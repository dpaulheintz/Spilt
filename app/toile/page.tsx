import type { Metadata } from "next";
import { Cinzel, Jost } from "next/font/google";
import ToileContent from "@/components/toile/ToileContent";

const cinzel = Cinzel({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-toile-display",
});

const jost = Jost({
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-toile-body",
});

export const metadata: Metadata = {
  title: "Spilt Social — Concept 2: Cobalt Engraving",
  description:
    "A museum plate that happens to be a website. 18th-century cobalt copperplate engraving of Columbus, engraved-roman type, slow confident motion.",
};

export default function ToilePage() {
  return (
    <div className={`${cinzel.variable} ${jost.variable}`}>
      <ToileContent />
    </div>
  );
}
