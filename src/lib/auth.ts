import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account', // Force showing account selection on every login
        },
      },
    }),
  ],
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
  },
};

