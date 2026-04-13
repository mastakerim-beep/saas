import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (static files)
     * 3. /_static (public files)
     * 4. /favicon.ico, /sitemap.xml, /robots.txt (static files)
     */
    '/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  // We are moving to a unified single domain. 
  // All paths like /admin and /[slug]/dashboard are now accessed directly.
  return NextResponse.next();
}
