import { Metadata } from 'next';

/**
 * Invite Page Layout with noindex
 *
 * Invite pages contain sensitive tokens and should never be indexed.
 * Each invite URL is unique and temporary.
 */
export const metadata: Metadata = {
  title: 'הזמנה לשיתוף חשבון',
  description: 'הצטרף לחשבון משותף ב-NETO',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
