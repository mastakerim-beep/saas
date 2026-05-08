import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // 1. BOT PROTECTION LAYER
  // Block known bad bots and suspicious scanners
  const botPattern = /bot|crawler|spider|crawling|slurp|bingbot|yandex|baidu|semrush|ahrefs|python|curl|wget/i;
  if (botPattern.test(userAgent) && !pathname.startsWith('/api/public')) {
    return new NextResponse('Access Denied: Bot Activity Detected', { status: 403 });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. SUPABASE AUTH INITIALIZATION
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
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. SECURITY HEADERS
  // Modern web security standard headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // 4. AUTH REDIRECTION LOGIC (FLUID EXPERIENCE)
  const isPublicPath = ['/login', '/book', '/portal'].some(p => pathname.startsWith(p));
  const isRoot = pathname === '/';

  // If no user and trying to access a protected route
  if (!user && !isPublicPath && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // REMOVED: Redirect from /login to root if user exists. 
  // This was causing infinite loops when a session existed but the profile record was missing or failed to fetch on the client.
  // The client-side (ClientWrapper and LoginPage) will handle redirecting authenticated users.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
