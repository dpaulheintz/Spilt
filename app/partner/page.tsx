import type { Metadata } from "next";
import PartnerContent from "@/components/partner/PartnerContent";
import { getCopy } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "Partner with Spilt Social",
  description:
    "Put your brand in Columbus's most connected room — founders, operators, and the people betting on this city.",
};

export default async function PartnerPage() {
  return <PartnerContent copy={await getCopy()} />;
}
