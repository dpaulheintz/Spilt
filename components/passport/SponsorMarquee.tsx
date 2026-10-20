"use client";

/** "JPMorganChase.png" → "JPMorganChase", "Lower.com.png" → "Lower.com" */
export function sponsorName(file: string): string {
  return file.replace(/\.(png|jpe?g|webp|svg)$/i, "").replace(/_/g, " ");
}

/**
 * Previous-sponsors marquee. The logo files are rectangular tiles on
 * BLACK backgrounds, so the band is pure black and the logos render
 * completely untouched — no filters, no borders, or the tile edges
 * would show. Track is duplicated for a seamless left→right loop.
 * With no logos the section simply doesn't render.
 */
export default function SponsorMarquee({
  logos,
  label,
}: {
  logos: string[];
  label: string;
}) {
  if (logos.length === 0) return null;

  return (
    <section aria-label={label} className="pb-24 sm:pb-32">
      <p
        className="mb-6 text-center text-[12px] font-medium tracking-[0.24em] uppercase"
        style={{ color: "#2A2620", opacity: 0.65 }}
      >
        {label}
      </p>
      <div
        className="sponsor-marquee-band w-full overflow-hidden"
        style={{
          backgroundColor: "#000000",
          borderTop: "1px solid #C69D60",
          borderBottom: "1px solid #C69D60",
        }}
      >
        <div className="sponsor-marquee flex w-max items-center">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex items-center gap-16 py-5 pr-16 pl-16"
            >
              {logos.map((logo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={logo}
                  src={`/assets/passport/sponsors/${logo}`}
                  alt={copy === 0 ? sponsorName(logo) : ""}
                  className="block w-auto shrink-0"
                  style={{ height: 64 }}
                  loading="lazy"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
