"use client";

import { useState } from "react";
import { TeeArt } from "@/components/passport/ShopSection";
import { formatPrice, type ShopData } from "@/lib/shop-types";
import { Badge, Button, Card, GOLD, HAIRLINE, MUTED, PageHeader, Toggle, previewOnly } from "./ui";

export default function ShopScreen({
  shop,
  connected,
  initiallyVisible,
}: {
  shop: ShopData;
  connected: boolean;
  initiallyVisible: boolean;
}) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      previewOnly();
    }, 1200);
  };

  return (
    <div>
      <PageHeader
        title="Shop"
        description="Shirts, sizes, photos, prices, and stock all live in Square. The website shows whatever is in your Square “Website” category."
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span
              aria-hidden
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: connected ? "#3F5877" : GOLD }}
            />
            <div>
              <p className="text-[16px] font-medium">
                {connected ? "Square connected" : "Square not connected yet"}
              </p>
              <p className="mt-1 max-w-lg text-[14px] leading-relaxed" style={{ color: MUTED }}>
                {connected
                  ? "Products refresh from Square every 10 minutes."
                  : "The site is showing three sample shirts marked “Shop opens soon.” Connecting your Square account takes about 20 minutes — your web developer has the step-by-step guide."}
              </p>
            </div>
          </div>
          <Button onClick={refresh} disabled={refreshing} className="shrink-0">
            {refreshing ? "Refreshing…" : "Refresh products from Square"}
          </Button>
        </div>
      </Card>

      <Card className="mb-8">
        <Toggle
          label="Show the shop section on the homepage"
          description="Turn off to hide the shop without touching Square."
          checked={visible}
          onChange={setVisible}
        />
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" style={{ opacity: visible ? 1 : 0.5 }}>
        {shop.products.map((p) => (
          <Card key={p.id} padded={false}>
            <div
              className="relative flex aspect-[4/3] items-center justify-center border-b"
              style={{ borderColor: HAIRLINE, backgroundColor: "#FFFDF8" }}
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <TeeArt variant={p.placeholder} />
              )}
              {!connected && (
                <span className="absolute top-3 left-3">
                  <Badge tone="sample">Sample</Badge>
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-heading text-lg">{p.name}</h2>
                <span className="text-[14px] tabular-nums">
                  {formatPrice(p.variations[0]?.priceCents ?? 0, p.currency)}
                </span>
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${p.name} stock`}>
                {p.variations.map((v) => (
                  <li
                    key={v.id}
                    className="border px-2.5 py-1 text-[12px]"
                    style={{
                      borderColor: HAIRLINE,
                      color: v.available ? "inherit" : "#A34A2E",
                      textDecoration: v.available ? "none" : "line-through",
                    }}
                  >
                    {v.name}
                    <span className="sr-only">{v.available ? " in stock" : " sold out"}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px]" style={{ color: MUTED }}>
                Edit price, sizes, and stock in Square.
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="gold">Save changes</Button>
      </div>
    </div>
  );
}
