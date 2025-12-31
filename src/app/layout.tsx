import type { Metadata } from "next";
import { Heebo, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import AIChatProvider from "@/components/ai/AIChatProvider";
import { OnboardingProvider } from "@/context/OnboardingContext";
import OnboardingLayer from "@/components/onboarding/OnboardingLayer";
import Analytics from "@/components/Analytics";
import Smartlook from "@/components/Smartlook";
import SmartlookIdentify from "@/components/SmartlookIdentify";
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
      <body className={`${heebo.variable} ${inter.variable} font-sans antialiased`}>
        <Providers>
          <OnboardingProvider>
            <AIChatProvider>
              {children}
            </AIChatProvider>
            <OnboardingLayer />
          </OnboardingProvider>
          <Analytics />
          <Smartlook />
          <SmartlookIdentify />
          <CookieConsent />
          <AccessibilityStatement />
        </Providers>
      </body>
    </html>
  );
}
