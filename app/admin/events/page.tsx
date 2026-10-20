import EventsScreen from "@/components/admin/EventsScreen";
import { loadEvents } from "@/lib/events";

export default async function AdminEventsPage() {
  return <EventsScreen events={await loadEvents()} />;
}
