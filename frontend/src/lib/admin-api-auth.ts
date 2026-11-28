import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth-roles';

export async function getAuthorizedAdminDb() {
  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json(
        { error: 'Supabase não configurado no servidor.' },
        { status: 503 }
      ),
    };
  }

  const serverClient = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();
  const allowLocalBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_LOCAL_ADMIN_BYPASS === 'true';

  if (!allowLocalBypass) {
    if (!serverClient) {
      return {
        error: NextResponse.json({ error: 'Sessão indisponível.' }, { status: 401 }),
      };
    }

    const { data, error } = await serverClient.auth.getUser();
    if (error || !data?.user) {
      return {
        error: NextResponse.json(
          { error: 'Sessão expirada. Faça login novamente no painel admin.' },
          { status: 401 }
        ),
      };
    }

    let profileRole: string | null = null;
    const roleLookupDb = adminClient || serverClient;
    try {
      const { data: profileRow } = await roleLookupDb
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      profileRole = (profileRow as { role?: string } | null)?.role ?? null;
    } catch {
      profileRole = null;
    }

    if (!isAdminUser(data.user, profileRole)) {
      return {
        error: NextResponse.json(
          { error: 'Acesso restrito a administradores.' },
          { status: 403 }
        ),
      };
    }
  }

  const db = adminClient || serverClient;
  if (!db) {
    return {
      error: NextResponse.json(
        { error: 'Cliente do banco de dados indisponível.' },
        { status: 500 }
      ),
    };
  }

  return { db };
}
