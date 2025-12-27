import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { config as appConfig } from './lib/config';
import { logAuditEvent, AuditAction, getRequestInfo } from './lib/auditLog';

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return appConfig.adminEmails.includes(email.toLowerCase());
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the token
  const token = await getToken({
    req: request,
    secret: appConfig.nextAuthSecret,
  });

  // If trying to access login page while authenticated, redirect to home
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If trying to access protected route without token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // SECURITY: CSRF Protection for API routes
  // Require custom header for all non-safe HTTP methods
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  const isApiRoute = pathname.startsWith('/api/');
  const isAuthRoute = pathname.startsWith('/api/auth/');

  if (!isSafeMethod && isApiRoute && !isAuthRoute) {
    const csrfHeader = request.headers.get('X-CSRF-Protection');
    if (csrfHeader !== '1') {
      // Audit log: CSRF violation
      const { ipAddress, userAgent } = getRequestInfo(request.headers);
      logAuditEvent({
        userId: token?.sub,
        action: AuditAction.CSRF_VIOLATION,
        metadata: {
          path: pathname,
          method: request.method,
          header: csrfHeader || 'missing',
        },
        ipAddress,
        userAgent,
      });

      return new NextResponse(
        JSON.stringify({
          error: 'CSRF protection required',
          details: 'Missing or invalid X-CSRF-Protection header'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // SECURITY: Block non-admin users from /admin/* routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdmin(token.email as string)) {
      // Audit log: Unauthorized admin access attempt
      const { ipAddress, userAgent } = getRequestInfo(request.headers);
      logAuditEvent({
        userId: token?.sub,
        action: AuditAction.UNAUTHORIZED_ACCESS,
        metadata: {
          path: pathname,
          email: token?.email,
          attemptedResource: 'admin',
        },
        ipAddress,
        userAgent,
      });

      // Return 403 Forbidden for non-admin users
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

// Protect all routes except:
// - /login (auth page)
// - /invite/* (invite pages - handle their own auth)
// - /api/auth/* (NextAuth routes)
// - /_next/* (Next.js internals)
// - /favicon.ico, /images/* (static assets)
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login
     * - /invite/* (invite pages - handle their own auth)
     * - /api/auth (NextAuth.js authentication routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico, /images (static assets)
     */
    '/((?!login|invite|api/auth|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
