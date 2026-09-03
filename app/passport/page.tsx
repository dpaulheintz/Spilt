import type { Metadata } from "next";
import { readdir } from "node:fs/promises";
import path from "node:path";
import PassportContent from "@/components/passport/PassportContent";
import { passportFontVars } from "@/components/passport/fonts";
import { loadEvents } from "@/lib/events";

export const revalidate = 3600; // ISR — also revalidated by /api/refresh-events

export const metadata: Metadata = {
  title: "Spilt Social — Concept 6: The Passport",
  description:
    "Fill your cup. Spilt Social's experiences connect Columbus's most driven people — and your social passport quietly collects the stamps.",
  openGraph: { images: ["/assets/passport/beauty-scene.png"] },
};

/** build-time glob of sponsor logo tiles */
async function loadSponsorLogos(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public/assets/passport/sponsors");
    return (await readdir(dir))
      .filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f))
      .sort();
  } catch {
    return [];
  }
}

export default async function PassportPage() {
  const [events, sponsorLogos] = await Promise.all([
    loadEvents(),
    loadSponsorLogos(),
  ]);
  return (
    <div className={passportFontVars}>
      <PassportContent events={events} sponsorLogos={sponsorLogos} />
    </div>
  );
}
