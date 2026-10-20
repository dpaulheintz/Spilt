import { readdir } from "node:fs/promises";
import path from "node:path";
import PassportContent from "@/components/passport/PassportContent";
import { getCopy } from "@/lib/content-store";
import { loadEvents } from "@/lib/events";
import { getShop } from "@/lib/square";

/* ISR: 10 minutes, matching the Square catalog cache. Also revalidated
   on demand by /api/refresh-events after the nightly Posh sync. */
export const revalidate = 600;

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
  const [copy, events, sponsorLogos, shop] = await Promise.all([
    getCopy(),
    loadEvents(),
    loadSponsorLogos(),
    getShop(),
  ]);
  return (
    <PassportContent copy={copy} events={events} sponsorLogos={sponsorLogos} shop={shop} />
  );
}
