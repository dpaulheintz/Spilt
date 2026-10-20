import { readdir } from "node:fs/promises";
import path from "node:path";
import PassportContent from "@/components/passport/PassportContent";
import { loadEvents } from "@/lib/events";

export const revalidate = 3600; // ISR — also revalidated by /api/refresh-events

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

export default async function HomePage() {
  const [events, sponsorLogos] = await Promise.all([
    loadEvents(),
    loadSponsorLogos(),
  ]);
  return <PassportContent events={events} sponsorLogos={sponsorLogos} />;
}
