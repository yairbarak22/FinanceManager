import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

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

