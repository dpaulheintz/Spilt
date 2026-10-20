import SponsorsScreen from "@/components/admin/SponsorsScreen";
import { loadSponsorLogos } from "@/lib/sponsors";

export default async function AdminSponsorsPage() {
  return <SponsorsScreen logos={await loadSponsorLogos()} />;
}
