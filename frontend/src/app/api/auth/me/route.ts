import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminUser, isEmailVerifiedUser, resolveUserRole } from '@/lib/auth-roles';
import type { AuthMeResponse, CustomerProfile } from '@/types';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  if (!isSupabaseConfigured()) {
    const payload: AuthMeResponse = {
      authenticated: false,
      supabaseConfigured: false,
      isAdmin: false,
      user: null,
      profile: null,
    };
    return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
  }

  const serverClient = await createSupabaseServerClient();
  if (!serverClient) {
    const payload: AuthMeResponse = {
      authenticated: false,
      supabaseConfigured: false,
      isAdmin: false,
      user: null,
      profile: null,
    };
    return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
  }

  const { data, error } = await serverClient.auth.getUser();
  if (error || !data?.user) {
    const payload: AuthMeResponse = {
      authenticated: false,
      supabaseConfigured: true,
      isAdmin: false,
      user: null,
      profile: null,
    };
    return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
  }

  const user = data.user;
  const email = (user.email || '').toLowerCase();
  const emailVerified = isEmailVerifiedUser(user);
  const provider = String(user.app_metadata?.provider || 'email');
  const fallbackName = String(
    user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split('@')[0] ||
      'Cliente EVORAH'
  ).trim();

  const db = createSupabaseAdminClient() || serverClient;
  let profileRow: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    cpf: string | null;
    role: string | null;
    created_at: string | null;
  } | null = null;

  try {
    const { data: existing } = await db
      .from('profiles')
      .select('id, email, full_name, phone, cpf, role, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      profileRow = existing;
    } else if (email) {
      const { data: created } = await db
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email,
            full_name: fallbackName,
            role: isAdminUser(user) ? 'admin' : 'customer',
          },
          { onConflict: 'id' }
        )
        .select('id, email, full_name, phone, cpf, role, created_at')
        .maybeSingle();
      profileRow = created ?? null;
    }
  } catch {
    profileRow = null;
  }

  const admin = isAdminUser(user, profileRow?.role);
  const profile: CustomerProfile = {
    id: user.id,
    email: profileRow?.email || email,
    fullName: profileRow?.full_name || fallbackName,
    phone: profileRow?.phone || '',
    cpf: profileRow?.cpf || '',
    role: resolveUserRole(user, profileRow?.role),
    emailVerified,
    provider,
    createdAt: profileRow?.created_at || user.created_at,
  };

  const payload: AuthMeResponse = {
    authenticated: true,
    supabaseConfigured: true,
    isAdmin: admin,
    user: {
      id: user.id,
      email,
      emailVerified,
      provider,
    },
    profile,
  };

  return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
}
