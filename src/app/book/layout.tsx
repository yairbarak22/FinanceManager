import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'קביעת שיחת ליווי | MyNeto',
  description: 'קבעו שיחת ליווי אישית של 10 דקות לפתיחת תיק מסחר עצמאי – ללא עלות',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
