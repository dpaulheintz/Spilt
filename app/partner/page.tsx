import type { Metadata } from "next";
import PartnerContent from "@/components/partner/PartnerContent";
import { passportFontVars } from "@/components/passport/fonts";

export const metadata: Metadata = {
  title: "Partner with Spilt Social",
  description:
    "Put your brand in Columbus's most connected room — founders, operators, and the people betting on this city.",
};

export default function PartnerPage() {
  return (
    <div className={passportFontVars}>
      <PartnerContent />
    </div>
  );
}
