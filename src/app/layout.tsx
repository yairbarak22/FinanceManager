import type { Metadata } from "next";
import { Heebo, Inter, Nunito } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import Providers from "@/components/Providers";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import OnboardingLayer from "@/components/onboarding/OnboardingLayer";
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
      <head>
        {/* Smartlook - Session Recording with Privacy Settings */}
        <Script
          id="smartlook-init"
          strategy="afterInteractive"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              window.smartlook||(function(d) {
                var o=smartlook=function(){ o.api.push(arguments)},h=d.getElementsByTagName('head')[0];
                var c=d.createElement('script');o.api=new Array();c.async=true;c.type='text/javascript';
                c.charset='utf-8';c.src='https://web-sdk.smartlook.com/recorder.js';h.appendChild(c);
              })(document);
              smartlook('init', 'ff3850f57f63db3eeb1e38ed64c7c1d592664267', { region: 'eu' });
              
              // PRIVACY: Complete anonymization - disable ALL data collection
              smartlook('record', { 
                forms: false,    // Don't record form inputs
                numbers: false,  // Don't collect numbers
                emails: false,   // Don't collect emails
                ips: false       // Don't collect IPs
              });
              
              // PRIVACY: Disable IP consent tracking
              smartlook('consentIP', false);
              
              // PRIVACY: Mask user profile images (Google OAuth profile pictures)
              // Apply masking for all images marked with data-sl="mask" and Google profile images
              setTimeout(function() {
                if (typeof window.smartlook === 'function') {
                  // Mask images explicitly marked for privacy
                  smartlook('mask', 'img[data-sl="mask"]');
                  // Mask Google profile images
                  smartlook('mask', 'img[src*="googleusercontent.com"]');
                  smartlook('mask', 'img[src*="lh3.googleusercontent.com"]');
                  // Mask common avatar/profile images
                  smartlook('mask', 'img[alt*="profile"]');
                  smartlook('mask', 'img[alt*="avatar"]');
                  smartlook('mask', 'img[alt*="User"]');
                  console.debug('[Smartlook] Profile image masking applied');
                }
              }, 500);
            `,
          }}
        />
      </head>
      <body className={`${heebo.variable} ${inter.variable} ${nunito.variable} font-sans antialiased`}>
        <SkipToContent />
        <Providers>
          <AccessibilityProvider>
            <OnboardingProvider>
              {children}
              <OnboardingLayer />
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
