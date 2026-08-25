import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import StillContent from "@/components/still/StillContent";

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-still-display",
});

export const metadata: Metadata = {
  title: "Spilt Social — Concept 5: The Table",
  description:
    "A candlelit vanitas tablescape where the objects are the navigation. Nothing on this table is clickable. Especially not the cup.",
  openGraph: {
    images: ["/assets/still/beauty-scene.png"],
  },
};

export default function StillPage() {
  return (
    <div className={cormorant.variable}>
      <StillContent />
    </div>
  );
}
