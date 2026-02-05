import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { config } from './config';
import { logAuditEvent, AuditAction } from './auditLog';
import { processCalculatorInvites } from './calculatorInvites';

// Cookie name for signup source tracking
const SIGNUP_SOURCE_COOKIE = 'signup_source';

/**
 * Mark user's signup source from cookie
 * Called when a new user is created to record their signup source (e.g., "prog")
 */
async function markUserSignupSource(userId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const signupSourceCookie = cookieStore.get(SIGNUP_SOURCE_COOKIE);
    
    if (signupSourceCookie?.value) {
      await prisma.user.update({
        where: { id: userId },
        data: { signupSource: signupSourceCookie.value },
      });
      console.log(`[Auth] Marked user ${userId} with signup source: ${signupSourceCookie.value}`);
    }
  } catch (error) {
    console.error('[Auth] Failed to mark signup source:', error);
    // Don't block user creation if this fails
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      authorization: {
        params: {
          prompt: 'select_account', // Force showing account selection on every login
        },
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      // Log LOGIN event for returning user tracking
      if (user?.id) {
        logAuditEvent({
          userId: user.id,
          action: AuditAction.LOGIN,
          metadata: { provider: 'google' },
        });
      }
    },
    async createUser({ user }) {
      // Process calculator invites when a new user signs up
      // This unlocks pro access for the user who invited them
      if (user?.email) {
        try {
          await processCalculatorInvites(user.email);
        } catch (error) {
          console.error('[Auth] Failed to process calculator invites:', error);
          // Don't block user creation if this fails
        }
      }
      
      // Mark signup source from cookie (e.g., "prog" for users from prog.co.il)
      if (user?.id) {
        try {
          await markUserSignupSource(user.id);
        } catch (error) {
          console.error('[Auth] Failed to mark signup source:', error);
          // Don't block user creation if this fails
        }
      }
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Prevent redirecting to deleted pages (terms, privacy)
      // These are now shown as modals in the login page
      if (url.includes('/privacy') || url.includes('/terms')) {
        return baseUrl;
      }
      // Default behavior: allow relative URLs and same-origin URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      // On initial sign in, add user id to token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user.id to the session from the JWT token
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt', // Use JWT for sessions (works with middleware)
    maxAge: 24 * 60 * 60, // 24 hours - session expires after this time
    updateAge: 60 * 60,   // 1 hour - session is refreshed if older than this
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours - JWT token lifetime
  },
};

