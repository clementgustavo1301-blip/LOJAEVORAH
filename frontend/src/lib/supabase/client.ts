import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

function timedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(700);
  const signal =
    init?.signal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([init.signal, timeoutSignal])
      : init?.signal || timeoutSignal;
  return fetch(input, { ...init, signal });
}

export function isSupabaseConfigured(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_REMOTE_SUPABASE === 'false') {
    return false;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes('your-project-id')) {
    return false;
  }
  // Evita bloquear SSR/CSR com DNS inexistente (ERR_NAME_NOT_RESOLVED) do projeto placeholder inativo
  if (
    url.includes('kvsaubwpzkhivixzuiwk.supabase.co') &&
    process.env.NEXT_PUBLIC_ENABLE_REMOTE_SUPABASE !== 'true'
  ) {
    return false;
  }
  return true;
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const options = { global: { fetch: timedFetch } };

  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options
    );
  }

  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options
    );
  }

  return client;
}
