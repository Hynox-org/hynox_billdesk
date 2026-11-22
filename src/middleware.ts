import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'wa_saas_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public routes, static assets, and auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/auth/') ||
    (pathname.startsWith('/api/receipts/') && pathname.endsWith('/pdf')) ||
    pathname === '/receipt' ||
    pathname.startsWith('/receipt/') ||
    pathname.startsWith('/api/test-email') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return NextResponse.next();
  }

  // 2. Read Session Cookies (wa_saas_token or Supabase access token)
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const hasSupabaseToken = Boolean(request.cookies.get('hynox_access_token')?.value);

  // Protected paths: /dashboard, /admin, and internal APIs
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (!token && !hasSupabaseToken) {
    if (pathname.startsWith('/api/receipts/') && !pathname.endsWith('/pdf')) {
      const orderNum = pathname.replace('/api/receipts/', '').split('/')[0];
      const acceptsHtml = request.headers.get('accept')?.includes('text/html');
      if (acceptsHtml) {
        return NextResponse.redirect(new URL(`/receipt/${orderNum}`, request.url));
      }
      return NextResponse.json({ error: 'Unauthorized: Store authentication required' }, { status: 401 });
    }

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Lightweight decode for role-based route guard
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = atob(parts[1]);
        const session = JSON.parse(payloadJson);

        // Super Admin route guard
        if (isAdminRoute && session.role !== 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/dashboard/pos', request.url));
        }

        // Vendor trying to access admin, or Super Admin navigating vendor dashboard
        if (isDashboardRoute && session.role === 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }
    } catch {
      // Corrupted token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
