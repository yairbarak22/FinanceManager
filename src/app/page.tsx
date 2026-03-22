import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { isSafePostLoginPath } from '@/lib/safePostLoginPath';
import LandingPage from '@/components/landing/LandingPage';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);

  if (session) {
    const params = await searchParams;
    const callbackUrl = typeof params.callbackUrl === 'string' ? params.callbackUrl : null;
    const target = callbackUrl && isSafePostLoginPath(callbackUrl)
      ? callbackUrl
      : '/dashboard';
    redirect(target);
  }

  return <LandingPage />;
}
