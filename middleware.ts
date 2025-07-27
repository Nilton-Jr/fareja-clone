import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only run on production to avoid development overhead
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  // Skip analytics for admin pages, API routes, and static files
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/analytics-admin') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Add analytics headers for client-side tracking
  const response = NextResponse.next();
  
  // Set session cookie if not exists (for analytics tracking)
  if (!request.cookies.get('fareja_session')) {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    response.cookies.set('fareja_session', sessionId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: false, // Allow client-side access for analytics
      secure: true,
      sameSite: 'lax'
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};