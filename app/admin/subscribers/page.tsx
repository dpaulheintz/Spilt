import SubscribersScreen from "@/components/admin/SubscribersScreen";
import { SAMPLE_LISTS } from "@/lib/admin-samples";

export default function AdminSubscribersPage() {
  // TODO(supabase): read real lists from a subscribers table
  return <SubscribersScreen lists={SAMPLE_LISTS} />;
}
