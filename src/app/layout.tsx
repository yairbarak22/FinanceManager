import type { Metadata } from "next";
import { Heebo, Inter } from "next/font/google";
import Script from "next/script";
import Providers from "@/components/Providers";
import AIChatProvider from "@/components/ai/AIChatProvider";
import { OnboardingProvider } from "@/context/OnboardingContext";
import OnboardingLayer from "@/components/onboarding/OnboardingLayer";
import Analytics from "@/components/Analytics";
import SmartlookIdentify from "@/components/SmartlookIdentify";
import SmartlookMasking from "@/components/SmartlookMasking";
import CookieConsent from "@/components/CookieConsent";
import { AccessibilityStatement } from "@/components/AccessibilityStatement";
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

export const metadata: Metadata = {
  title: "NETO - ניהול הון חכם",
  description: "המקום שלך לצמוח כלכלית. ניהול הוצאות, השקעות ותכנון פיננסי חכם.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {/* Smartlook - Session Recording */}
        <Script
          id="smartlook-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.smartlook||(function(d) {
                var o=smartlook=function(){ o.api.push(arguments)},h=d.getElementsByTagName('head')[0];
                var c=d.createElement('script');o.api=new Array();c.async=true;c.type='text/javascript';
                c.charset='utf-8';c.src='https://web-sdk.smartlook.com/recorder.js';h.appendChild(c);
              })(document);
              smartlook('init', 'ff3850f57f63db3eeb1e38ed64c7c1d592664267', { region: 'eu' });
            `,
          }}
        />
      </head>
      <body className={`${heebo.variable} ${inter.variable} font-sans antialiased`}>
        <Providers>
          <OnboardingProvider>
            <AIChatProvider>
              {children}
            </AIChatProvider>
            <OnboardingLayer />
          </OnboardingProvider>
          <Analytics />
          <SmartlookIdentify />
          <SmartlookMasking />
          <CookieConsent />
          <AccessibilityStatement />
        </Providers>
      </body>
    </html>
  );
}
