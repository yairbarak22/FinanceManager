import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { config as appConfig } from './lib/config';
import { logAuditEvent, AuditAction, getRequestInfo } from './lib/auditLog';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_LEGACY_HEADER,
  CSRF_TOKEN_MAX_AGE,
  generateCsrfToken,
  isValidCsrfToken,
  isValidOrigin,
} from './lib/csrf';

// Cookie name for signup source tracking
const SIGNUP_SOURCE_COOKIE = 'signup_source';

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return appConfig.adminEmails.includes(email.toLowerCase());
}

/**
 * Attach a CSRF cookie to the response if the user is authenticated
 * and does not already have one. Called on every response we return.
 */
function attachCsrfCookie(
  res: NextResponse,
  req: NextRequest,
  isAuthenticated: boolean,
): void {
  if (!isAuthenticated) return;
  if (req.cookies.get(CSRF_COOKIE_NAME)) return; // already has one, don't rotate
  const token = generateCsrfToken();
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,                                    // JS must read it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',                                 // the actual protection
    path: '/',
    maxAge: CSRF_TOKEN_MAX_AGE,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow webhook endpoints without authentication (they verify signatures)
  // Allow public marketing unsubscribe endpoints (users click from email)
  if (
    pathname === '/api/webhook/receive' ||
    pathname === '/api/webhooks/resend' ||
    pathname === '/api/marketing/unsubscribe' ||
    pathname === '/api/marketing/unsubscribe-email'
  ) {
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

  // /login redirects: authenticated → dashboard, unauthenticated → landing page
  if (pathname === '/login') {
    const target = token ? '/dashboard' : '/';
    const redirectUrl = new URL(target, request.url);
    // Preserve source param
    if (source) {
      redirectUrl.searchParams.set('source', source);
    }
    // Preserve callbackUrl param (used by invite flow)
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl) {
      redirectUrl.searchParams.set('callbackUrl', callbackUrl);
    }
    response = NextResponse.redirect(redirectUrl);
    if (source) {
      response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      });
    }
    attachCsrfCookie(response, request, !!token);
    return response;
  }

  // Landing page: unauthenticated users see it, authenticated users go to dashboard
  if (pathname === '/') {
    if (!token) {
      response = NextResponse.next();
      if (source && !request.cookies.get(SIGNUP_SOURCE_COOKIE)) {
        response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax',
        });
      }
      return response;
    } else {
      response = NextResponse.redirect(new URL('/dashboard', request.url));
      if (source) {
        response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax',
        });
      }
      attachCsrfCookie(response, request, true);
      return response;
    }
  }

  // If trying to access protected route without token, redirect to landing page
  if (!token) {
    const landingUrl = new URL('/', request.url);
    // Preserve source parameter
    if (source) {
      landingUrl.searchParams.set('source', source);
    }
    response = NextResponse.redirect(landingUrl);
    if (source) {
      response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      });
    }
    return response;
  }

  // SECURITY: CSRF Protection for API routes (Double Submit Cookie + Origin check)
  // Require valid CSRF token OR legacy header for all non-safe HTTP methods
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  const isApiRoute = pathname.startsWith('/api/');
  const isAuthRoute = pathname.startsWith('/api/auth/');
  const isWebhookRoute = pathname === '/api/webhook/receive' || pathname === '/api/webhooks/resend';
  const isPublicMarketingRoute = pathname === '/api/marketing/unsubscribe' || pathname === '/api/marketing/unsubscribe-email';

  if (!isSafeMethod && isApiRoute && !isAuthRoute && !isWebhookRoute && !isPublicMarketingRoute) {
    const newToken    = request.headers.get(CSRF_HEADER_NAME);          // X-CSRF-Token
    const legacyToken = request.headers.get(CSRF_LEGACY_HEADER);        // X-CSRF-Protection
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

    const newTokenValid    = isValidCsrfToken(newToken, cookieToken);
    const legacyTokenValid = legacyToken === '1'; // backward compat (remove in stage B)

    const originValid = isValidOrigin(
      request.headers.get('Origin'),
      request.headers.get('Referer'),
      appConfig.nextAuthUrl,
    );

    if ((!newTokenValid && !legacyTokenValid) || !originValid) {
      // Audit log: CSRF violation
      const { ipAddress, userAgent } = getRequestInfo(request.headers);
      logAuditEvent({
        userId: token?.sub,
        action: AuditAction.CSRF_VIOLATION,
        metadata: {
          path: pathname,
          method: request.method,
          newTokenPresent: !!newToken,
          legacyTokenPresent: !!legacyToken,
          cookiePresent: !!cookieToken,
          originValid,
        },
        ipAddress,
        userAgent,
      });

      return new NextResponse(
        JSON.stringify({
          error: 'CSRF protection required',
          details: 'Invalid or missing CSRF token'
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

  // Attach CSRF cookie for authenticated users
  attachCsrfCookie(response, request, !!token);

  return response;
}

// Protect all routes except:
// - /invite/* (invite pages - handle their own auth)
// - /api/auth/* (NextAuth routes)
// - /_next/* (Next.js internals)
// - /favicon.ico, /images/* (static assets)
// NOTE: /login is NOT excluded — middleware handles it (source cookie + redirect)
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /invite/* (invite pages - handle their own auth)
     * - /api/auth (NextAuth.js authentication routes)
     * - /api/webhook/receive, /api/webhooks/resend (webhook endpoints - verify signatures themselves)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico, /images, /screenshots (static assets)
     */
    '/((?!invite|api/auth|api/webhook|api/marketing/unsubscribe|_next/static|_next/image|favicon.ico|images|screenshots).*)',
  ],
};
