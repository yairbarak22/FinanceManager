import type { Metadata } from 'next';
import InvestProviders from '@/components/invest/InvestProviders';

export const metadata: Metadata = {
  title: 'מרכז ההשקעות | למד להשקיע נכון',
  description:
    'מדריכים, קורס וידאו וכלים מעשיים להשקעה חכמה בשוק ההון. למד מאפס: מה זה השקעה, פתיחת חשבון מסחר, פיזור תיק ועוד — בחינם.',
  openGraph: {
    title: 'מרכז ההשקעות | למד להשקיע נכון',
    description: 'מדריכים וקורס וידאו להשקעה חכמה בשוק ההון — בחינם.',
    type: 'website',
    siteName: 'MyNeto',
  },
  alternates: {
    canonical: 'https://myneto.co.il/invest',
  },
};

export default function InvestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InvestProviders>{children}</InvestProviders>;
}
