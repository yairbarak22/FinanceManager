import type { Metadata } from "next";
import { Heebo, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import OnboardingProvider from "@/components/onboarding/OnboardingProvider";
import AIChatProvider from "@/components/ai/AIChatProvider";
import Analytics from "@/components/Analytics";
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
          <AIChatProvider>
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
          </AIChatProvider>
          <Analytics />
          <CookieConsent />
          <AccessibilityStatement />
        </Providers>
      </body>
    </html>
  );
}
