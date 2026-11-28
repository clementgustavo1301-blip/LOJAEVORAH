import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminUser } from '@/lib/auth-roles';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isAdminLoginPage = pathname === '/admin/login';
  const isAdminArea = pathname.startsWith('/admin');
  const isProtectedAdminRoute = isAdminArea && !isAdminLoginPage;
  const isCustomerAccountRoute = pathname.startsWith('/conta');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const remoteDisabled = process.env.NEXT_PUBLIC_ENABLE_REMOTE_SUPABASE === 'false';
  const supabaseConfigured = Boolean(
    !remoteDisabled &&
      supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('your-project-id')
  );

  // Bypass local SOMENTE quando explicitamente optado via ALLOW_LOCAL_ADMIN_BYPASS=true em dev
  const allowLocalBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_LOCAL_ADMIN_BYPASS === 'true';

  if (allowLocalBypass && isAdminArea) {
    return supabaseResponse;
  }

  if (!supabaseConfigured) {
    return supabaseResponse;
  }

  const hasSupabaseSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'));

  if (!hasSupabaseSession) {
    if (isProtectedAdminRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }
    if (isCustomerAccountRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/entrar';
      loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;
  try {
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase auth timeout')), 3500)
    );
    const result = await Promise.race([authPromise, timeoutPromise]);
    user = result.data?.user ?? null;
  } catch {
    user = null;
  }

  if (isCustomerAccountRoute) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/entrar';
      loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // Verificação estrita de papel admin para rotas /admin
  let userIsAdmin = false;
  if (user && isAdminArea) {
    userIsAdmin = isAdminUser(user);
    if (!userIsAdmin) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        userIsAdmin = isAdminUser(user, (profile as { role?: string } | null)?.role);
      } catch {
        userIsAdmin = false;
      }
    }
  }

  if (isProtectedAdminRoute) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }
    if (!userIsAdmin) {
      const accountUrl = request.nextUrl.clone();
      accountUrl.pathname = '/conta';
      return NextResponse.redirect(accountUrl);
    }
  }

  if (isAdminLoginPage && user && userIsAdmin) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = '/admin/produtos';
    return NextResponse.redirect(adminUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/conta/:path*'],
};
