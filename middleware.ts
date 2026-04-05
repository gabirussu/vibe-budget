/**
 * MIDDLEWARE - Supabase Auth Session Refresh
 *
 * SCOP:
 * 1. Refresh automat session cookies pentru utilizatori autentificați
 * 2. Protejează rute care necesită autentificare
 * 3. Redirect utilizatori ne-autentificați la /login
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session dacă există
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protejează rute care necesită autentificare
  const protectedPaths = ['/dashboard', '/transactions', '/categories', '/banks'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Verifică trial pentru utilizatori autentificați pe rute protejate
  if (isProtectedPath && user && request.nextUrl.pathname !== '/trial-expired') {
    const { data: userData } = await supabase
      .from('users')
      .select('trial_ends_at')
      .eq('id', user.id)
      .single();

    if (userData?.trial_ends_at && new Date(userData.trial_ends_at) < new Date()) {
      const url = request.nextUrl.clone();
      url.pathname = '/trial-expired';
      return NextResponse.redirect(url);
    }
  }

  // User autentificat încearcă să acceseze /login sau /register
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match toate rutele EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (*.svg, *.png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
