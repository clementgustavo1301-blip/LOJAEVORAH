import { NextResponse } from 'next/server';
import { getAuthenticatedCustomerContext } from '@/lib/customer-api-auth';
import { isEmailVerifiedUser, isValidCpfDigits, resolveUserRole } from '@/lib/auth-roles';
import {
  checkRateLimit,
  getClientIp,
  isTrustedSameOrigin,
  rateLimitExceededResponse,
} from '@/lib/security-guard';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  const ctx = await getAuthenticatedCustomerContext();
  if ('error' in ctx) return ctx.error;

  const { user, db } = ctx;
  const { data: row, error } = await db
    .from('profiles')
    .select('id, email, full_name, phone, cpf, role, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'Não foi possível carregar seu perfil.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  const email = (row?.email || user.email || '').toLowerCase();
  const fullName =
    row?.full_name ||
    String(user.user_metadata?.full_name || user.user_metadata?.name || '').trim();

  return NextResponse.json(
    {
      profile: {
        id: user.id,
        email,
        fullName,
        phone: row?.phone || '',
        cpf: row?.cpf || '',
        role: resolveUserRole(user, row?.role),
        emailVerified: isEmailVerifiedUser(user),
        provider: String(user.app_metadata?.provider || 'email'),
        createdAt: row?.created_at || user.created_at,
      },
    },
    { headers: NO_STORE_HEADERS }
  );
}

export async function PATCH(req: Request) {
  if (!isTrustedSameOrigin(req)) {
    return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 });
  }
  const rate = checkRateLimit({
    scope: 'account_profile_patch',
    identifier: getClientIp(req),
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    return rateLimitExceededResponse(rate.retryAfterSeconds);
  }

  const ctx = await getAuthenticatedCustomerContext();
  if ('error' in ctx) return ctx.error;

  const { user, db } = ctx;

  try {
    const body = await req.json();
    const fullName = String(body.fullName || '').trim().slice(0, 120);
    const phone = String(body.phone || '').trim().slice(0, 24);
    const cpfRaw = String(body.cpf || '').trim();
    const cpfDigits = cpfRaw.replace(/\D/g, '');

    if (fullName.length < 2) {
      return NextResponse.json(
        { error: 'Informe seu nome completo.' },
        { status: 400 }
      );
    }

    if (cpfDigits.length > 0 && !isValidCpfDigits(cpfDigits)) {
      return NextResponse.json(
        { error: 'CPF inválido. Confira os 11 dígitos.' },
        { status: 400 }
      );
    }

    const formattedCpf =
      cpfDigits.length === 11
        ? cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        : '';

    const email = (user.email || '').toLowerCase();

    const { data: existing } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    const { data: saved, error } = existing
      ? await db
          .from('profiles')
          .update({
            full_name: fullName,
            phone,
            cpf: formattedCpf,
          })
          .eq('id', user.id)
          .select('id, email, full_name, phone, cpf, role, created_at')
          .single()
      : await db
          .from('profiles')
          .insert({
            id: user.id,
            email,
            full_name: fullName,
            phone,
            cpf: formattedCpf,
            role: 'customer',
          })
          .select('id, email, full_name, phone, cpf, role, created_at')
          .single();

    if (error || !saved) {
      return NextResponse.json(
        { error: 'Não foi possível salvar os dados do perfil.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: {
        id: saved.id,
        email: saved.email || email,
        fullName: saved.full_name || fullName,
        phone: saved.phone || '',
        cpf: saved.cpf || '',
        role: resolveUserRole(user, saved.role),
        emailVerified: isEmailVerifiedUser(user),
        provider: String(user.app_metadata?.provider || 'email'),
        createdAt: saved.created_at || user.created_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Payload inválido ao atualizar perfil.' },
      { status: 400 }
    );
  }
}
