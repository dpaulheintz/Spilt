import NewsletterScreen from "@/components/admin/NewsletterScreen";
import { SAMPLE_LISTS } from "@/lib/admin-samples";
import { loadEvents } from "@/lib/events";

export default async function AdminNewsletterPage() {
  return (
    <NewsletterScreen
      events={await loadEvents()}
      counts={{ main: SAMPLE_LISTS.main.count, donors: SAMPLE_LISTS.donors.count }}
    />
  );
}
