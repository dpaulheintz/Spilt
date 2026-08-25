import type { Metadata } from "next";
import { Special_Elite } from "next/font/google";
import FieldnotesContent from "@/components/fieldnotes/FieldnotesContent";

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-typer",
});

export const metadata: Metadata = {
  title: "Spilt Social — Concept 3: Field Notes",
  description:
    "A traveler's field journal documenting the Columbus scene: aged paper, typewriter type, archival plates with rubber-stamp illustrations.",
};

export default function FieldnotesPage() {
  return (
    <div className={specialElite.variable}>
      <FieldnotesContent />
    </div>
  );
}
