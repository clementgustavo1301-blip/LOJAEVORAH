import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from './client';

function serverTimedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(1500);
  const signal =
    init?.signal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([init.signal, timeoutSignal])
      : init?.signal || timeoutSignal;
  return fetch(input, { ...init, signal });
}

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: serverTimedFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorado quando chamado de um Server Component sem contexto de escrita de cookies
          }
        },
      },
    }
  );
}

/**
 * Cliente administrativo usando SUPABASE_SERVICE_ROLE_KEY (apenas Route Handlers / Server Actions).
 * Necessário para o Webhook do Mercado Pago atualizar payment_status sem sessão de usuário.
 */
export function createSupabaseAdminClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey || serviceRoleKey.includes('your-')) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: { fetch: serverTimedFetch },
  });
}
