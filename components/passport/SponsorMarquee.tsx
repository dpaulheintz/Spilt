"use client";

/**
 * Previous-sponsors marquee. The logo files are rectangular tiles on
 * BLACK backgrounds, so the band is pure black and the logos render
 * completely untouched — no filters, no borders, or the tile edges
 * would show. Track is duplicated for a seamless left→right loop.
 */
export default function SponsorMarquee({ logos }: { logos: string[] }) {
  const items =
    logos.length > 0
      ? logos
      : ["Sponsor logos land in /public/assets/passport/sponsors/"];

  return (
    <section aria-label="Previous sponsors" className="pb-24 sm:pb-32">
      <p
        className="mb-6 text-center text-[12px] font-medium tracking-[0.24em] uppercase"
        style={{ color: "#2A2620", opacity: 0.65 }}
      >
        Previous sponsors
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
              {items.map((logo) =>
                logos.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={logo}
                    src={`/assets/passport/sponsors/${logo}`}
                    alt={logo.replace(/\.[a-z]+$/i, "").replace(/_/g, " ")}
                    className="block w-auto shrink-0"
                    style={{ height: 64 }}
                    loading="lazy"
                  />
                ) : (
                  <span
                    key={logo}
                    className="font-mono text-[12px] tracking-[0.2em] text-white/60 uppercase"
                  >
                    {logo}
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
