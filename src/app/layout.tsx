import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Providers from "@/components/Providers";
import OnboardingProvider from "@/components/onboarding/OnboardingProvider";
// AI Feature temporarily disabled
// import AIChatProvider from "@/components/ai/AIChatProvider";
import Analytics from "@/components/Analytics";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "הניהול הפיננסי שלי",
  description: "מעקב ושליטה מלאה על התקציב המשפחתי",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased`}>
        <Providers>
          {/* AI Feature temporarily disabled */}
          {/* <AIChatProvider> */}
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
          {/* </AIChatProvider> */}
          <Analytics />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
