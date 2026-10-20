import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { passportFontVars } from "@/components/passport/fonts";
import "./globals.css";

/* document mono — MRZ line, passport dates/times, stamp text only */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* absolute base for OG/social image URLs: explicit override, else the
   Vercel production domain, else local dev */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Spilt Social — Fill your cup.",
  description:
    "Spilt Social's experiences connect Columbus's most driven people — founders, operators, mentors, and the occasional gym buddy.",
  openGraph: {
    title: "Spilt Social — Fill your cup.",
    images: ["/assets/passport/hero-poster.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${passportFontVars} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
