import type { Metadata } from "next";
import { Anton } from "next/font/google";
import DitherContent from "@/components/dither/DitherContent";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dither-display",
});

export const metadata: Metadata = {
  title: "Spilt Social — Concept 4: The Transmission",
  description:
    "A photo-forward editorial zine where every image is transmitted through cobalt-on-cream ordered dither. Hard rules, huge type, ticker tapes.",
};

export default function DitherPage() {
  return (
    <div className={anton.variable}>
      <DitherContent />
    </div>
  );
}
