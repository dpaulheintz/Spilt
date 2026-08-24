import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConceptShell from "@/components/ConceptShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spilt Social — Concepts",
  description:
    "Four landing page design directions for Spilt Social, a private social club in Columbus, Ohio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <ConceptShell />
      </body>
    </html>
  );
}
