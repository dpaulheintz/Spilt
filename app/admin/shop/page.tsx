import ShopScreen from "@/components/admin/ShopScreen";
import { getCopy } from "@/lib/content-store";
import { getShop, squareConfigured } from "@/lib/square";

export default async function AdminShopPage() {
  const [shop, copy] = await Promise.all([getShop(), getCopy()]);
  return (
    <ShopScreen
      shop={shop}
      connected={squareConfigured()}
      initiallyVisible={copy.shop.visible !== "false"}
    />
  );
}
