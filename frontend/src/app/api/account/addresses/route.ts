import { NextResponse } from 'next/server';
import { getAuthenticatedCustomerContext } from '@/lib/customer-api-auth';
import {
  checkRateLimit,
  getClientIp,
  isTrustedSameOrigin,
  rateLimitExceededResponse,
} from '@/lib/security-guard';
import type { CustomerAddress } from '@/types';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function mapAddress(row: Record<string, unknown>): CustomerAddress {
  return {
    id: String(row.id),
    label: String(row.label || 'Principal'),
    recipientName: String(row.recipient_name || ''),
    cep: String(row.cep || ''),
    street: String(row.street || ''),
    number: String(row.number || ''),
    complement: String(row.complement || ''),
    neighborhood: String(row.neighborhood || ''),
    city: String(row.city || ''),
    state: String(row.state || ''),
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

export async function GET() {
  const ctx = await getAuthenticatedCustomerContext();
  if ('error' in ctx) return ctx.error;

  const { user, db } = ctx;
  const { data, error } = await db
    .from('customer_addresses')
    .select('id, label, recipient_name, cep, street, number, complement, neighborhood, city, state, is_default, created_at')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Não foi possível carregar seus endereços.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { addresses: (data || []).map((row) => mapAddress(row as Record<string, unknown>)) },
    { headers: NO_STORE_HEADERS }
  );
}

export async function POST(req: Request) {
  if (!isTrustedSameOrigin(req)) {
    return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 });
  }
  const rate = checkRateLimit({
    scope: 'account_address_post',
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
    const label = String(body.label || 'Casa').trim().slice(0, 40) || 'Casa';
    const recipientName = String(body.recipientName || '').trim().slice(0, 120);
    const cepDigits = String(body.cep || '').replace(/\D/g, '').slice(0, 8);
    const street = String(body.street || '').trim().slice(0, 160);
    const number = String(body.number || '').trim().slice(0, 24);
    const complement = String(body.complement || '').trim().slice(0, 120);
    const neighborhood = String(body.neighborhood || '').trim().slice(0, 100);
    const city = String(body.city || '').trim().slice(0, 100);
    const state = String(body.state || '').trim().toUpperCase().slice(0, 2);

    if (cepDigits.length !== 8 || !street || !number || !neighborhood || !city || state.length !== 2) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios do endereço (CEP, rua, número, bairro, cidade e UF).' },
        { status: 400 }
      );
    }

    const formattedCep = `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}`;

    const { count } = await db
      .from('customer_addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const shouldBeDefault = Boolean(body.isDefault) || (count ?? 0) === 0;

    if (shouldBeDefault) {
      await db
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data: inserted, error } = await db
      .from('customer_addresses')
      .insert({
        user_id: user.id,
        label,
        recipient_name: recipientName || null,
        cep: formattedCep,
        street,
        number,
        complement: complement || null,
        neighborhood,
        city,
        state,
        is_default: shouldBeDefault,
      })
      .select('id, label, recipient_name, cep, street, number, complement, neighborhood, city, state, is_default, created_at')
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: 'Erro ao salvar endereço.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { address: mapAddress(inserted as Record<string, unknown>) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Dados de endereço inválidos.' }, { status: 400 });
  }
}
