"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { formatPrice, type ShopData, type ShopProduct } from "@/lib/shop-types";

const CHARCOAL = "#2A2620";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";
const HAIRLINE = "rgba(42, 38, 32, 0.14)";

const TEE_COLORS = {
  cream: { body: "#F3ECDD", print: GOLD, line: "rgba(42,38,32,0.18)" },
  navy: { body: "#1B1F3B", print: GOLD, line: "rgba(0,0,0,0.25)" },
  charcoal: { body: "#2A2620", print: GOLD_HI, line: "rgba(0,0,0,0.3)" },
} as const;

/** Styled stand-in product photo — a flat tee in the brand palette. */
export function TeeArt({ variant = "cream" }: { variant?: keyof typeof TEE_COLORS }) {
  const c = TEE_COLORS[variant];
  return (
    <svg viewBox="0 0 200 220" className="h-[72%] w-auto" aria-hidden>
      <path
        d="M62 24 L38 34 L8 66 L30 92 L50 78 L50 200 L150 200 L150 78 L170 92 L192 66 L162 34 L138 24 C132 40 118 48 100 48 C82 48 68 40 62 24 Z"
        fill={c.body}
        stroke={c.line}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M62 24 C68 40 82 48 100 48 C118 48 132 40 138 24" fill="none" stroke={c.line} strokeWidth="1.5" />
      {variant === "cream" && (
        /* gold coupe */
        <g fill="none" stroke={c.print} strokeWidth="2.2" strokeLinecap="round">
          <path d="M84 92 H116 C115 104 108 111 100 111 C92 111 85 104 84 92 Z" fill={c.print} fillOpacity="0.25" />
          <path d="M100 111 V130 M90 133 H110" />
        </g>
      )}
      {variant === "navy" && (
        <g fill="none" stroke={c.print} strokeWidth="1.6">
          <ellipse cx="100" cy="110" rx="17" ry="21" />
          <ellipse cx="100" cy="110" rx="12.5" ry="16.5" strokeWidth="0.8" />
          <text
            x="100"
            y="118"
            textAnchor="middle"
            fill={c.print}
            stroke="none"
            style={{ font: "400 22px var(--font-heading), Georgia, serif" }}
          >
            S
          </text>
        </g>
      )}
      {variant === "charcoal" && (
        <g fill="none" stroke={c.print} strokeWidth="1.6">
          <rect x="76" y="92" width="48" height="30" rx="5" transform="rotate(-6 100 107)" />
          <text
            x="100"
            y="111"
            textAnchor="middle"
            fill={c.print}
            stroke="none"
            transform="rotate(-6 100 107)"
            style={{ font: "700 8px var(--font-geist-mono), monospace", letterSpacing: "0.14em" }}
          >
            BUSINESS HOP
          </text>
        </g>
      )}
    </svg>
  );
}

function ProductCard({
  product,
  mode,
  buyLabel,
  comingSoon,
}: {
  product: ShopProduct;
  mode: ShopData["mode"];
  buyLabel: string;
  comingSoon: string;
}) {
  const firstAvailable = product.variations.find((v) => v.available)?.id ?? null;
  const [selected, setSelected] = useState<string | null>(firstAvailable);
  const [busy, setBusy] = useState(false);
  const soldOutEverywhere = firstAvailable === null;
  const variation = product.variations.find((v) => v.id === selected);
  const price = variation?.priceCents ?? product.variations[0]?.priceCents ?? 0;

  const buy = async () => {
    if (!variation || !variation.available) return;
    if (mode === "demo") {
      toast(comingSoon);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variationId: variation.id }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string; reason?: string };
      if (data.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      toast(
        data.reason === "sold-out"
          ? "That size just sold out — try another."
          : "Checkout is taking a breather. Try again in a minute."
      );
    } catch {
      toast("Checkout is taking a breather. Try again in a minute.");
    }
    setBusy(false);
  };

  return (
    <article className="flex flex-col">
      <div
        className="relative flex aspect-[4/5] items-center justify-center overflow-hidden border"
        style={{ borderColor: GOLD, backgroundColor: "#FFFDF8" }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <TeeArt variant={product.placeholder} />
        )}
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h3 className="font-heading text-xl">{product.name}</h3>
        <p className="shrink-0 text-[15px] tabular-nums">
          {formatPrice(price, product.currency)}
        </p>
      </div>
      {product.description && (
        <p className="mt-1.5 text-[14px] leading-relaxed opacity-70">{product.description}</p>
      )}

      {product.variations.length > 1 && (
        <div role="radiogroup" aria-label={`${product.name} size`} className="mt-5 flex flex-wrap gap-2">
          {product.variations.map((v) => {
            const on = v.id === selected;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={v.available ? v.name : `${v.name}, sold out`}
                disabled={!v.available}
                onClick={() => setSelected(v.id)}
                className="flex h-11 min-w-11 cursor-pointer items-center justify-center border px-3 text-[13px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
                style={{
                  borderColor: on ? CHARCOAL : HAIRLINE,
                  backgroundColor: on ? CHARCOAL : "transparent",
                  color: on ? "#FAF6EE" : CHARCOAL,
                  opacity: v.available ? 1 : 0.38,
                  textDecoration: v.available ? "none" : "line-through",
                  outlineColor: GOLD,
                }}
              >
                {v.name}
              </button>
            );
          })}
        </div>
      )}
      <p aria-live="polite" className="mt-2 min-h-[18px] text-[12px] opacity-70">
        {soldOutEverywhere
          ? "Sold out"
          : product.variations.some((v) => !v.available)
            ? `Sold out in ${product.variations
                .filter((v) => !v.available)
                .map((v) => v.name)
                .join(", ")}`
            : ""}
      </p>

      <button
        type="button"
        onClick={buy}
        disabled={soldOutEverywhere || busy}
        className="mt-3 min-h-[48px] w-full cursor-pointer px-6 text-[13px] font-medium tracking-[0.05em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = GOLD_HI;
        }}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
      >
        {soldOutEverywhere ? "Sold out" : busy ? "Opening checkout…" : buyLabel}
      </button>
    </article>
  );
}

export default function ShopSection({
  copy,
  shop,
}: {
  copy: Record<string, string>;
  shop: ShopData;
}) {
  // returning from Square's hosted checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchased") === "1") {
      toast("Thank you — Square is sending your receipt.");
      params.delete("purchased");
      const qs = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
    }
  }, []);

  // Square configured but unreachable or empty: no section, no error
  if (shop.products.length === 0) return null;

  return (
    <section id="shop" className="scroll-mt-20 border-t" style={{ borderColor: HAIRLINE }}>
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-heading text-4xl sm:text-5xl">{copy.heading}</h2>
          <div className="flex flex-col gap-2 sm:items-end">
            {/* before Square is connected, say so before anyone picks a size */}
            {shop.mode === "demo" && (
              <span
                className="w-max border px-3 py-1 text-[12px] font-medium tracking-[0.12em] uppercase"
                style={{ borderColor: GOLD, color: CHARCOAL }}
              >
                {copy.comingSoon}
              </span>
            )}
            {copy.intro && <p className="max-w-sm text-[15px] opacity-70 sm:text-right">{copy.intro}</p>}
          </div>
        </div>
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {shop.products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              mode={shop.mode}
              buyLabel={copy.buyLabel}
              comingSoon={copy.comingSoon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
