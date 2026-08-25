import type { Metadata } from "next";
import { Silkscreen } from "next/font/google";
import PixelContent from "@/components/pixel/PixelContent";

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Spilt Social — Concept 1: The Shatter",
  description:
    "SPILT rendered as thousands of dither dots that scatter under your cursor and heal when you leave. A private social club, Columbus, Ohio.",
};

export default function PixelPage() {
  return (
    <div className={silkscreen.variable}>
      <PixelContent />
    </div>
  );
}
