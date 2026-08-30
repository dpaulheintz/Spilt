import type { Metadata } from "next";
import { Jost } from "next/font/google";
import PassportContent from "@/components/passport/PassportContent";

const jost = Jost({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-passport",
});

export const metadata: Metadata = {
  title: "Spilt Social — Concept 6: The Passport",
  description:
    "A home for the people building Columbus. Membership unlocks the rooms — and your social passport quietly collects the stamps.",
};

export default function PassportPage() {
  return (
    <div className={jost.variable}>
      <PassportContent />
    </div>
  );
}
