import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { sanitizeRedirectPath } from '@/lib/auth-roles';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextPath = sanitizeRedirectPath(searchParams.get('next'), '/conta');

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?error=codigo_invalido`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/entrar?error=configuracao`);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.user) {
    return NextResponse.redirect(`${origin}/entrar?error=autenticacao`);
  }

  // Garante criação do perfil caso a trigger ainda não tenha sido aplicada
  const user = data.user;
  const adminDb = createSupabaseAdminClient();
  if (adminDb && user.email) {
    const extractedName =
      String(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email.split('@')[0] ||
          ''
      ).trim();

    try {
      await adminDb.from('profiles').upsert(
        {
          id: user.id,
          email: user.email.toLowerCase(),
          full_name: extractedName,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    } catch {
      // Ignora erro caso tabela profiles ainda não exista no ambiente
    }
  }

  return NextResponse.redirect(`${origin}${nextPath}`);
}
