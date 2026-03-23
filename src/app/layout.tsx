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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://neto.co.il'),
  title: {
    default: 'NETO - ניהול הון חכם',
    template: '%s | NETO',
  },
  description: 'המקום שלך לצמוח כלכלית. ניהול הוצאות, השקעות ותכנון פיננסי חכם - בחינם.',
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
  authors: [{ name: 'NETO' }],
  creator: 'NETO',
  publisher: 'NETO',
  formatDetection: {
    telephone: false,
    email: false,
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    siteName: 'NETO',
    title: 'NETO - ניהול הון חכם',
    description: 'המקום שלך לצמוח כלכלית. ניהול הוצאות, השקעות ותכנון פיננסי חכם.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NETO - ניהול הון חכם',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NETO - ניהול הון חכם',
    description: 'המקום שלך לצמוח כלכלית. ניהול הוצאות, השקעות ותכנון פיננסי חכם.',
    images: ['/og-image.png'],
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
      <head />
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
