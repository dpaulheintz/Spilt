/** Shop data shapes shared by the server (lib/square.ts), the public
 *  shop section, and the admin preview. Client-safe: no secrets here. */

export type ShopVariation = {
  id: string; // Square ITEM_VARIATION id (demo: synthetic)
  name: string; // the size, e.g. "M"
  priceCents: number;
  available: boolean;
};

export type ShopProduct = {
  id: string;
  name: string;
  description: string;
  imageUrl: string; // "" → render the styled placeholder
  placeholder?: "cream" | "navy" | "charcoal";
  currency: string;
  variations: ShopVariation[];
};

export type ShopData = {
  /** demo: Square not configured · live: real catalog · unavailable:
   *  configured but Square failed — the section hides itself */
  mode: "demo" | "live" | "unavailable";
  products: ShopProduct[];
};

const SIZES = ["S", "M", "L", "XL", "XXL"];

function demoVariations(productId: string, soldOut: string[]): ShopVariation[] {
  return SIZES.map((size) => ({
    id: `demo-${productId}-${size.toLowerCase()}`,
    name: size,
    priceCents: 3000,
    available: !soldOut.includes(size),
  }));
}

/** Placeholder catalog shown until SQUARE_* env vars exist. */
export const DEMO_PRODUCTS: ShopProduct[] = [
  {
    id: "fill-your-cup-tee",
    name: "Fill Your Cup Tee",
    description: "Cream cotton, gold cup on the chest.",
    imageUrl: "",
    placeholder: "cream",
    currency: "USD",
    variations: demoVariations("fill-your-cup-tee", ["XXL"]),
  },
  {
    id: "social-passport-tee",
    name: "Social Passport Tee",
    description: "Navy, with the passport crest.",
    imageUrl: "",
    placeholder: "navy",
    currency: "USD",
    variations: demoVariations("social-passport-tee", ["S"]),
  },
  {
    id: "business-hop-tee",
    name: "Business Hop Tee",
    description: "Charcoal, stamped on the back.",
    imageUrl: "",
    placeholder: "charcoal",
    currency: "USD",
    variations: demoVariations("business-hop-tee", []),
  },
];

export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
