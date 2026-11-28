import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Authenticates the current customer session and returns the user-scoped Supabase client (`db`)
 * so PostgreSQL RLS policies remain active on every query (Defense in Depth).
 * `adminDb` is provided strictly for controlled server-only operations (e.g. verified-email order backfill).
 */
export async function getAuthenticatedCustomerContext() {
  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json(
        { error: 'Autenticação indisponível no servidor.' },
        { status: 503 }
      ),
    };
  }

  const serverClient = await createSupabaseServerClient();
  if (!serverClient) {
    return {
      error: NextResponse.json({ error: 'Sessão indisponível.' }, { status: 401 }),
    };
  }

  const { data, error } = await serverClient.auth.getUser();
  if (error || !data?.user) {
    return {
      error: NextResponse.json(
        { error: 'Faça login para acessar sua conta.' },
        { status: 401 }
      ),
    };
  }

  return {
    user: data.user,
    db: serverClient,
    adminDb: createSupabaseAdminClient(),
    serverClient,
  };
}
