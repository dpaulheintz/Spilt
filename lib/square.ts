import "server-only";
import { randomUUID } from "node:crypto";
import { unstable_cache } from "next/cache";
import { SquareClient, SquareEnvironment, type Square } from "square";
import { DEMO_PRODUCTS, type ShopData, type ShopProduct, type ShopVariation } from "./shop-types";

/**
 * Square is the source of truth for the shop: products, sizes (item
 * variations), photos, prices, and inventory all live in Spilt's Square
 * dashboard. Only items in a Square category named "Website" appear.
 * "Buy" creates a Square-hosted payment link (Checkout API); Square
 * handles payment, shipping/pickup, and receipts, and the order lands
 * in Square like any other sale. Setup steps: SETUP-SQUARE.md.
 *
 * Env: SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENVIRONMENT
 * (sandbox | production). Until both credentials exist the shop runs in
 * DEMO mode. Any Square failure degrades quietly — visitors never see
 * an error, the shop section simply hides.
 */

const WEBSITE_CATEGORY = "website";
export const CATALOG_REVALIDATE_SECONDS = 600; // 10 minutes

export function squareConfigured(): boolean {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

function client(): SquareClient {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment:
      process.env.SQUARE_ENVIRONMENT === "sandbox"
        ? SquareEnvironment.Sandbox
        : SquareEnvironment.Production,
  });
}

const toCents = (amount: bigint | null | undefined) => Number(amount ?? BigInt(0));

/** Pull ITEM + IMAGE + CATEGORY objects and keep "Website" items. */
async function fetchCatalog(): Promise<ShopProduct[]> {
  const sq = client();
  const locationId = process.env.SQUARE_LOCATION_ID!;

  const items: Square.CatalogObject.Item[] = [];
  const images = new Map<string, string>();
  const websiteCategoryIds = new Set<string>();

  // merch catalogs are small; listing everything is simpler and more
  // robust than attribute queries across legacy/new category fields
  const pages = await sq.catalog.list({ types: "ITEM,IMAGE,CATEGORY" });
  for await (const obj of pages) {
    if (obj.isDeleted || !obj.id) continue;
    if (obj.type === "ITEM") items.push(obj);
    else if (obj.type === "IMAGE" && obj.imageData?.url) images.set(obj.id, obj.imageData.url);
    else if (
      obj.type === "CATEGORY" &&
      obj.categoryData?.name?.trim().toLowerCase() === WEBSITE_CATEGORY
    )
      websiteCategoryIds.add(obj.id);
  }
  if (websiteCategoryIds.size === 0) return [];

  const atLocation = (o: Square.CatalogObject) =>
    o.presentAtAllLocations !== false
      ? !(o.absentAtLocationIds ?? []).includes(locationId)
      : (o.presentAtLocationIds ?? []).includes(locationId);

  const websiteItems = items.filter((item) => {
    const d = item.itemData;
    if (!d || d.isArchived || !atLocation(item)) return false;
    const catIds = [
      ...(d.categories ?? []).map((c) => c.id),
      d.categoryId,
      d.reportingCategory?.id,
    ];
    return catIds.some((id) => id && websiteCategoryIds.has(id));
  });

  // inventory for every tracked variation at this location
  const variationIds = websiteItems
    .flatMap((i) => (i.itemData?.variations ?? []).map((v) => v.id))
    .filter((id): id is string => Boolean(id));
  const inStock = new Map<string, number>();
  if (variationIds.length > 0) {
    const counts = await sq.inventory.batchGetCounts({
      catalogObjectIds: variationIds,
      locationIds: [locationId],
      states: ["IN_STOCK"],
    });
    for await (const c of counts) {
      if (c.catalogObjectId) inStock.set(c.catalogObjectId, Number(c.quantity ?? 0));
    }
  }

  return websiteItems.map((item): ShopProduct => {
    const d = item.itemData!;
    const variations: ShopVariation[] = (d.variations ?? [])
      .filter(
        (v): v is Square.CatalogObject.ItemVariation =>
          v.type === "ITEM_VARIATION" && Boolean(v.id)
      )
      .filter((v) => atLocation(v) && v.itemVariationData?.sellable !== false)
      .sort((a, b) => (a.itemVariationData?.ordinal ?? 0) - (b.itemVariationData?.ordinal ?? 0))
      .map((v) => {
        const vd = v.itemVariationData!;
        const override = vd.locationOverrides?.find((o) => o.locationId === locationId);
        const tracked = override?.trackInventory ?? vd.trackInventory ?? false;
        const soldOut =
          override?.soldOut === true || (tracked && (inStock.get(v.id) ?? 0) <= 0);
        return {
          id: v.id,
          name: vd.name ?? "One size",
          priceCents: toCents(vd.priceMoney?.amount),
          available: !soldOut,
        };
      });
    const imageId = d.imageIds?.[0];
    return {
      id: item.id,
      name: d.name ?? "Untitled",
      description: d.descriptionPlaintext ?? d.description ?? "",
      imageUrl: (imageId && images.get(imageId)) || "",
      currency:
        d.variations?.find((v) => v.type === "ITEM_VARIATION")?.itemVariationData?.priceMoney
          ?.currency ?? "USD",
      variations,
    };
  }).filter((p) => p.variations.length > 0);
}

/* cached across requests; the homepage's ISR window matches */
const cachedCatalog = unstable_cache(fetchCatalog, ["square-website-catalog"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ["square-catalog"],
});

/** What the shop section renders. Never throws. */
export async function getShop(): Promise<ShopData> {
  if (!squareConfigured()) return { mode: "demo", products: DEMO_PRODUCTS };
  try {
    return { mode: "live", products: await cachedCatalog() };
  } catch (err) {
    console.error("[square] catalog fetch failed — hiding the shop section:", err);
    return { mode: "unavailable", products: [] };
  }
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: "demo" | "unavailable" | "sold-out" | "not-found" };

/**
 * Create a Square-hosted checkout for one unit of a variation. The
 * variation is re-validated against the live Website catalog so a
 * tampered request can't buy something that isn't for sale here.
 */
export async function createCheckout(
  variationId: string,
  returnUrl: string
): Promise<CheckoutResult> {
  if (!squareConfigured()) return { ok: false, reason: "demo" };
  try {
    const products = await fetchCatalog();
    const variation = products
      .flatMap((p) => p.variations)
      .find((v) => v.id === variationId);
    if (!variation) return { ok: false, reason: "not-found" };
    if (!variation.available) return { ok: false, reason: "sold-out" };

    // optional flat shipping fee in cents, e.g. SQUARE_SHIPPING_FEE_CENTS=600
    const shippingCents = Number(process.env.SQUARE_SHIPPING_FEE_CENTS ?? 0);
    const res = await client().checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID!,
        lineItems: [{ catalogObjectId: variationId, quantity: "1" }],
      },
      checkoutOptions: {
        askForShippingAddress: true,
        redirectUrl: returnUrl,
        ...(shippingCents > 0 && {
          shippingFee: {
            name: "Shipping",
            charge: { amount: BigInt(Math.round(shippingCents)), currency: "USD" },
          },
        }),
      },
    });
    const url = res.paymentLink?.url;
    if (!url) throw new Error("Square returned no payment link URL");
    return { ok: true, url };
  } catch (err) {
    console.error("[square] payment link creation failed:", err);
    return { ok: false, reason: "unavailable" };
  }
}
