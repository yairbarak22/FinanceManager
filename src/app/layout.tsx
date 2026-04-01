import type { Metadata } from "next";
import { Heebo, Inter, Nunito } from "next/font/google";
import { headers } from "next/headers";
import Providers from "@/components/Providers";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import Analytics from "@/components/Analytics";
import CookieConsent from "@/components/CookieConsent";
import { AccessibilityStatement } from "@/components/AccessibilityStatement";
import SkipToContent from "@/components/accessibility/SkipToContent";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heebo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://myneto.co.il'),
  title: {
    default: 'MyNeto — ניהול תקציב, השקעות ותכנון פיננסי | חינם',
    template: '%s | MyNeto',
  },
  description: 'אפליקציה חינמית לניהול הכספים האישיים: מעקב הוצאות אוטומטי עם AI, תיק השקעות, תקציב חודשי, יעדי חיסכון ודוחות חכמים — הכל במקום אחד.',
  keywords: [
    'ניהול הון',
    'ניהול הוצאות',
    'תכנון פיננסי',
    'השקעות',
    'תקציב אישי',
    'ניהול כספים',
    'מעקב הוצאות',
    'חיסכון',
    'תכנון פרישה',
    'שווי נקי',
  ],
  authors: [{ name: 'MyNeto' }],
  creator: 'MyNeto',
  publisher: 'MyNeto',
  formatDetection: {
    telephone: false,
    email: false,
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    siteName: 'MyNeto',
    title: 'MyNeto — ניהול תקציב, השקעות ותכנון פיננסי | חינם',
    description: 'אפליקציה חינמית לניהול הכספים האישיים: מעקב הוצאות, תיק השקעות, תקציב חודשי ויעדי חיסכון.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyNeto — ניהול תקציב, השקעות ותכנון פיננסי | חינם',
    description: 'אפליקציה חינמית לניהול הכספים האישיים: מעקב הוצאות, תיק השקעות, תקציב חודשי ויעדי חיסכון.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    // Add these when you have the verification codes
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  category: 'finance',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <html lang="he" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'MyNeto',
              alternateName: 'מיינטו',
              url: 'https://myneto.co.il',
              description:
                'אפליקציה חינמית לניהול הכספים האישיים: מעקב הוצאות אוטומטי עם AI, תיק השקעות, תקציב חודשי, יעדי חיסכון ודוחות חכמים.',
              inLanguage: 'he',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'MyNeto',
              alternateName: 'מיינטו',
              url: 'https://myneto.co.il',
              logo: 'https://myneto.co.il/icon.png',
              description: 'פלטפורמה חינמית לניהול הכספים האישיים בישראל.',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SiteNavigationElement',
              name: ['מרכז הידע', 'מרכז ההשקעות'],
              url: [
                'https://myneto.co.il/knowledge',
                'https://myneto.co.il/invest',
              ],
            }),
          }}
        />
      </head>
      <body className={`${heebo.variable} ${inter.variable} ${nunito.variable} font-sans antialiased`}>
        <SkipToContent />
        <Providers>
          <AccessibilityProvider>
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
            <Analytics nonce={nonce} />
            <CookieConsent />
            <AccessibilityStatement />
          </AccessibilityProvider>
        </Providers>
      </body>
    </html>
  );
}
