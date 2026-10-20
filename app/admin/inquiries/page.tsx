import InquiriesScreen from "@/components/admin/InquiriesScreen";
import { SAMPLE_INQUIRIES } from "@/lib/admin-samples";
import { getCopy } from "@/lib/content-store";
import { FORMATS, formatName } from "@/lib/formats";

export default async function AdminInquiriesPage() {
  const copy = await getCopy();
  const formatNames = Object.fromEntries(FORMATS.map((f) => [f.slug, formatName(copy, f.slug)]));
  // TODO(supabase): read real submissions from a partner_inquiries table
  return <InquiriesScreen inquiries={SAMPLE_INQUIRIES} formatNames={formatNames} />;
}
