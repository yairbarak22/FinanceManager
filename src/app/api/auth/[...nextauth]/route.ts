import NextAuth from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';

const nextAuthHandler = NextAuth(authOptions);

async function handler(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  try {
    return await nextAuthHandler(req, ctx);
  } catch (error) {
    console.error('[next-auth] Route handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal auth error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export { handler as GET, handler as POST };
