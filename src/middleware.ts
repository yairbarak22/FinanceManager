import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Hardcoded admin emails - must match adminHelpers.ts
const ADMIN_EMAILS = ['yairbarak22@gmail.com'];

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
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

  // SECURITY: Block non-admin users from /admin/* routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdmin(token.email as string)) {
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
// - /api/auth/* (NextAuth routes)
// - /_next/* (Next.js internals)
// - /favicon.ico, /images/* (static assets)
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login
     * - /api/auth (NextAuth.js authentication routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico, /images (static assets)
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
