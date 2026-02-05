import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { config as appConfig } from './lib/config';
import { logAuditEvent, AuditAction, getRequestInfo } from './lib/auditLog';

// Cookie name for signup source tracking
const SIGNUP_SOURCE_COOKIE = 'signup_source';

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return appConfig.adminEmails.includes(email.toLowerCase());
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow webhook endpoints without authentication (they verify signatures)
  if (pathname === '/api/webhook/receive') {
    return NextResponse.next();
  }

  // Capture signup source from URL parameters and set cookie
  const source = request.nextUrl.searchParams.get('source') || request.nextUrl.searchParams.get('utm_source');
  let response: NextResponse | null = null;
  
  if (source && !request.cookies.get(SIGNUP_SOURCE_COOKIE)) {
    // Will set cookie after determining the response
  }

  // Get the token
  const token = await getToken({
    req: request,
    secret: appConfig.nextAuthSecret,
  });

  // If trying to access login page while authenticated, redirect to home
  if (pathname === '/login' && token) {
    response = NextResponse.redirect(new URL('/', request.url));
    if (source) {
      response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      });
    }
    return response;
  }

  // If trying to access protected route without token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    // Preserve source parameter in callback URL
    if (source) {
      loginUrl.searchParams.set('source', source);
    }
    response = NextResponse.redirect(loginUrl);
    if (source) {
      response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      });
    }
    return response;
  }

  // SECURITY: CSRF Protection for API routes
  // Require custom header for all non-safe HTTP methods
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  const isApiRoute = pathname.startsWith('/api/');
  const isAuthRoute = pathname.startsWith('/api/auth/');
  const isWebhookRoute = pathname === '/api/webhook/receive';

  if (!isSafeMethod && isApiRoute && !isAuthRoute && !isWebhookRoute) {
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

  // Set signup source cookie if present in URL
  response = NextResponse.next();
  if (source && !request.cookies.get(SIGNUP_SOURCE_COOKIE)) {
    response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });
  }

  return response;
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
     * - /api/webhook/receive (webhook endpoints - verify signatures themselves)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico, /images (static assets)
     */
    '/((?!login|invite|api/auth|api/webhook|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
