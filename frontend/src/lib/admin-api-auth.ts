import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

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

  if (process.env.NODE_ENV === 'production') {
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
  }

  const db = createSupabaseAdminClient() || serverClient;
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
