import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";

import { SiteDisclaimer } from "@/components/common/site-disclaimer";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Should I See A Doctor?",
  description:
    "Educational care navigation and cost-aware healthcare decision support. Not a diagnostic tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} antialiased`}>
        <AppProviders>
          <SiteDisclaimer />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
