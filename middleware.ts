import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Public routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/book', '/portal'];

export const config = {
  matcher: [
    '/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths (login, public booking, customer portal)
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublicPath || pathname === '/') {
    return NextResponse.next();
  }

  // Create Supabase client for server-side session check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  // Get session (reads from cookie, no network call)
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Redirect unauthenticated users to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}
