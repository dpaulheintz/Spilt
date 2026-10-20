import ContentScreen from "@/components/admin/ContentScreen";
import { getContent } from "@/lib/content-store";

export default async function AdminContentPage() {
  return <ContentScreen content={await getContent()} />;
}
