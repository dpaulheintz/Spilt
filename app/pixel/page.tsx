import type { Metadata } from "next";
import { Italiana, Silkscreen } from "next/font/google";
import PixelContent from "@/components/pixel/PixelContent";

/* Silkscreen survives only as the particle raster source + de-rez
   scramble glyphs; Italiana is the display face everywhere else. */
const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel",
});

const italiana = Italiana({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-italiana",
});

export const metadata: Metadata = {
  title: "Spilt Social — Concept 1: The Shatter",
  description:
    "SPILT rendered as thousands of dither dots that scatter under your cursor and heal when you leave. A private social club, Columbus, Ohio.",
};

export default function PixelPage() {
  return (
    <div className={`${silkscreen.variable} ${italiana.variable}`}>
      <PixelContent />
    </div>
  );
}
