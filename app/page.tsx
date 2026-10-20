import PassportContent from "@/components/passport/PassportContent";
import { getCopy } from "@/lib/content-store";
import { loadEvents } from "@/lib/events";
import { getShop } from "@/lib/square";
import { loadSponsorLogos } from "@/lib/sponsors";

/* ISR: 10 minutes, matching the Square catalog cache. Also revalidated
   on demand by /api/refresh-events after the nightly Posh sync. */
export const revalidate = 600;

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
