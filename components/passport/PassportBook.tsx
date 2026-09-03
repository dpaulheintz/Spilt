"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpiltEvent } from "@/lib/events";
import { ctaForFormat, type FormatSlug } from "@/lib/formats";
import Sticker from "./Sticker";
import { STAMPS, Stamp } from "./stamps";

const CHARCOAL = "#2A2620";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";
const PAPER = "#FBF7EF";

/* smoothness tuning */
const LERP = 0.12;
const SETTLE_MS = 450;
const IDLE_MS = 170;
const VH_PER_TURN = 110;
const VH_PER_TURN_REDUCED = 55; // less scroll-jacking for reduced-motion users

const easeSettle = (t: number) => 1 - Math.pow(1 - t, 5); // ≈ [0.16,1,0.3,1]
const smooth = (t: number) => t * t * (3 - 2 * t); // weighted turn feel

function fmtDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "America/New_York",
    })
    .toUpperCase();
}

/* ── page faces ────────────────────────────────────────────── */

/** shared paper: spread.png as low-contrast texture, never structure */
function pageStyle(side: "left" | "right"): React.CSSProperties {
  return {
    backgroundColor: PAPER,
    backgroundImage: "url(/assets/passport/spread.png)",
    backgroundSize: "200% 100%",
    backgroundPosition: side === "left" ? "left center" : "right center",
    backgroundBlendMode: "soft-light",
  };
}

function InsideCover({ earned }: { earned: Set<string> }) {
  return (
    <div className="flex h-full w-full flex-col p-[6%]" style={pageStyle("left")}>
      <p
        className="text-center font-mono text-[clamp(7px,1.6cqw,11px)] tracking-[0.3em] uppercase opacity-60"
        style={{ color: CHARCOAL }}
      >
        Collect the rooms
      </p>
      <div className="mt-[6%] flex flex-wrap items-start justify-center gap-[4%]">
        {STAMPS.map((s) =>
          earned.has(s.id) ? (
            <Stamp key={s.id} def={s} size={72} className="max-w-[26%]" />
          ) : (
            <span
              key={s.id}
              aria-hidden
              className="m-[2%] inline-block h-[64px] w-[64px] max-w-[24%] rounded-full border border-dashed opacity-20"
              style={{
                borderColor: CHARCOAL,
                borderRadius: s.shape === "round" ? "9999px" : "8px",
              }}
            />
          )
        )}
      </div>
      <p
        className="mt-auto text-center font-mono text-[clamp(6px,1.4cqw,10px)] tracking-[0.24em] uppercase opacity-40"
        style={{ color: CHARCOAL }}
      >
        Stamps are earned, never given
      </p>
    </div>
  );
}

function IdPage() {
  return (
    <div className="flex h-full w-full flex-col p-[7%]" style={pageStyle("right")}>
      <p
        className="font-mono text-[clamp(7px,1.7cqw,12px)] tracking-[0.26em] uppercase"
        style={{ color: CHARCOAL, opacity: 0.7 }}
      >
        Spilt Social — Social Passport
      </p>
      <div
        className="mt-[8%] space-y-[4%] text-[clamp(10px,2.6cqw,17px)]"
        style={{ color: CHARCOAL }}
      >
        {(
          [
            ["Bearer", "You"],
            ["Issued", "Columbus, OH"],
            ["Expires", "Never, if you use it."],
          ] as const
        ).map(([k, v]) => (
          <p key={k} className="flex items-baseline gap-3">
            <span className="text-[0.72em] tracking-[0.18em] uppercase opacity-55">
              {k}
            </span>
            <span className="font-mono">{v}</span>
          </p>
        ))}
      </div>
      <div className="mt-auto">
        <div className="mb-[4%] h-px w-full" style={{ backgroundColor: `${GOLD}88` }} />
        <p
          className="truncate font-mono text-[clamp(7px,1.6cqw,11px)] tracking-[0.08em] opacity-45"
          style={{ color: CHARCOAL }}
        >
          P&lt;USA&lt;SPILT&lt;SOCIAL&lt;&lt;COLUMBUS&lt;OH&lt;EST2023&lt;&lt;&lt;&lt;&lt;&lt;&lt;
        </p>
      </div>
    </div>
  );
}

function EventLeft({ ev }: { ev: SpiltEvent }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center p-[7%] text-center"
      style={pageStyle("left")}
    >
      <Sticker format={ev.format} width={150} rotation={-4} className="mt-[4%] w-[55%] min-w-[110px]" />
      <h3
        className="font-heading mt-[9%] text-[clamp(15px,3.4cqw,24px)] leading-snug"
        style={{ color: CHARCOAL }}
      >
        {ev.title}
      </h3>
      {ev.city && (
        <p
          className="mt-[4%] text-[clamp(7px,1.8cqw,12px)] tracking-[0.22em] uppercase opacity-55"
          style={{ color: CHARCOAL }}
        >
          {ev.city}
        </p>
      )}
    </div>
  );
}

function EventRight({ ev }: { ev: SpiltEvent }) {
  const cta = ctaForFormat(ev.format);
  return (
    <div className="flex h-full w-full flex-col p-[8%]" style={pageStyle("right")}>
      <div
        className="space-y-[5%] font-mono text-[clamp(8px,2cqw,14px)] tracking-[0.1em]"
        style={{ color: CHARCOAL }}
      >
        <p>
          <span className="opacity-50">DATE:&nbsp;</span>
          {fmtDate(ev.dateISO)}
        </p>
        <p>
          <span className="opacity-50">TIME:&nbsp;</span>
          {ev.timeDisplay.toUpperCase()}
        </p>
        <p className="leading-relaxed">
          <span className="opacity-50">VENUE:&nbsp;</span>
          {ev.venue}
          {ev.city ? `, ${ev.city}` : ""}
        </p>
      </div>
      <div className="my-[8%] h-px w-full" style={{ backgroundColor: `${GOLD}99` }} />
      <a
        href={ev.poshUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-max cursor-pointer px-6 py-3 text-[clamp(8px,1.9cqw,13px)] font-medium tracking-[0.06em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HI)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
      >
        {cta.label}
      </a>
      <p
        className="mt-auto font-mono text-[clamp(6px,1.4cqw,10px)] tracking-[0.2em] uppercase opacity-40"
        style={{ color: CHARCOAL }}
      >
        posh.vip · admits one · non-transferable
      </p>
    </div>
  );
}

/* ── the book ──────────────────────────────────────────────── */

type Spread = { left: React.ReactNode; right: React.ReactNode };

export default function PassportBook({
  events,
  earned,
  onSpreadViewed,
}: {
  events: SpiltEvent[];
  earned: Set<string>;
  onSpreadViewed?: (format: FormatSlug) => void;
}) {
  const spreads = useMemo<Spread[]>(
    () => [
      { left: <InsideCover earned={earned} />, right: <IdPage /> },
      ...events.map((ev) => ({
        left: <EventLeft ev={ev} />,
        right: <EventRight ev={ev} />,
      })),
    ],
    [events, earned]
  );
  const S = spreads.length; // leaves = S (cover + S-1 page leaves), progress 0..S

  const outerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftBaseRef = useRef<HTMLDivElement>(null);

  const [reduced, setReduced] = useState(false);
  const [currentSpread, setCurrentSpread] = useState(-1); // reduced-motion path
  const display = useRef(0);
  const target = useRef(0);
  const lastScrollAt = useRef(0);
  const settling = useRef<number | null>(null);
  const viewedRef = useRef(-1);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const progressFromScroll = useCallback(() => {
    const outer = outerRef.current;
    if (!outer) return 0;
    const rect = outer.getBoundingClientRect();
    const denom = outer.offsetHeight - window.innerHeight;
    if (denom <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / denom)) * S;
  }, [S]);

  const scrollToProgress = useCallback(
    (p: number, animate: boolean) => {
      const outer = outerRef.current;
      if (!outer) return;
      const denom = outer.offsetHeight - window.innerHeight;
      const top =
        outer.getBoundingClientRect().top + window.scrollY + (p / S) * denom;
      if (!animate) {
        window.scrollTo(0, top);
        return;
      }
      if (settling.current) cancelAnimationFrame(settling.current);
      const from = window.scrollY;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / SETTLE_MS);
        window.scrollTo(0, from + (top - from) * easeSettle(t));
        if (t < 1) settling.current = requestAnimationFrame(step);
        else settling.current = null;
      };
      settling.current = requestAnimationFrame(step);
    },
    [S]
  );

  const goToSpread = useCallback(
    (spread: number) => {
      // spread s is at rest after turn s+... progress p = s+1 shows spread s?
      // progress p: turned leaves = floor(p). At p = k, spreads[k-1] shows
      // (cover open at p=1 → spread 0). So spread s ⇒ progress s+1.
      const p = Math.min(S, Math.max(0, spread + 1));
      scrollToProgress(p, !reduced);
    },
    [S, scrollToProgress, reduced]
  );

  /* main loop: scroll → lerped leaf rotations, shadows, z-order */
  useEffect(() => {
    if (reduced) {
      const onScroll = () => {
        const p = Math.round(progressFromScroll());
        setCurrentSpread(Math.min(S - 1, p - 1));
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    let raf = 0;
    const onScroll = () => {
      lastScrollAt.current = performance.now();
    };
    const cancelSettle = () => {
      if (settling.current) {
        cancelAnimationFrame(settling.current);
        settling.current = null;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", cancelSettle, { passive: true });
    window.addEventListener("touchstart", cancelSettle, { passive: true });

    const frame = (now: number) => {
      target.current = progressFromScroll();
      display.current += (target.current - display.current) * LERP;
      const d = display.current;

      // snap-settle when scroll rests mid-turn
      if (
        settling.current === null &&
        now - lastScrollAt.current > IDLE_MS &&
        Math.abs(target.current - Math.round(target.current)) > 0.04 &&
        Math.abs(d - target.current) < 0.25
      ) {
        scrollToProgress(Math.round(target.current), true);
      }

      for (let i = 0; i < S; i++) {
        const leaf = leafRefs.current[i];
        if (!leaf) continue;
        const r = Math.min(1, Math.max(0, d - i));
        const e = smooth(r);
        leaf.style.transform = `rotateY(${(-180 * e).toFixed(2)}deg)`;
        leaf.style.zIndex =
          r > 0.001 && r < 0.999 ? String(S + 10) : r >= 0.999 ? String(i + 1) : String(S - i);
        const sh = shadowRefs.current[i];
        if (sh) sh.style.opacity = (Math.sin(e * Math.PI) * 0.32).toFixed(3);
      }
      // left base (bare backing) fades in as the cover opens
      if (leftBaseRef.current) {
        leftBaseRef.current.style.opacity = Math.min(1, d * 1.4).toFixed(3);
      }
      // stamp earning: entering an event spread (spread s at progress s+1)
      const atSpread = Math.round(d) - 1;
      if (atSpread !== viewedRef.current && atSpread >= 1 && atSpread < S) {
        viewedRef.current = atSpread;
        const ev = events[atSpread - 1];
        if (ev && ev.format !== "other") onSpreadViewed?.(ev.format);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", cancelSettle);
      window.removeEventListener("touchstart", cancelSettle);
    };
  }, [S, reduced, events, onSpreadViewed, progressFromScroll, scrollToProgress]);

  /* keyboard + swipe while the book is in view; flag off the concept
     switcher's own arrow/swipe handlers via a body dataset marker */
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    let inView = false;
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting && e.intersectionRatio > 0.05;
        if (inView) document.body.dataset.spiltBookNav = "1";
        else delete document.body.dataset.spiltBookNav;
      },
      { threshold: [0, 0.05, 0.5] }
    );
    io.observe(outer);

    const currentSpreadNow = () =>
      Math.min(S - 1, Math.max(-1, Math.round(reduced ? progressFromScroll() : display.current) - 1));

    const onKey = (e: KeyboardEvent) => {
      if (!inView) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToSpread(currentSpreadNow() + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSpread(currentSpreadNow() - 1);
      }
    };
    let tx = 0;
    let ty = 0;
    const onTouchStart = (e: TouchEvent) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!inView) return;
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        goToSpread(currentSpreadNow() + (dx < 0 ? 1 : -1));
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      io.disconnect();
      delete document.body.dataset.spiltBookNav;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [S, goToSpread, reduced, progressFromScroll]);

  /* ── render ──────────────────────────────────────────────── */
  const spineOverlay = (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-[60] w-10 -translate-x-1/2">
      <div
        className="h-full w-full"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(42,38,32,0.16) 46%, rgba(42,38,32,0.28) 50%, rgba(42,38,32,0.16) 54%, transparent)",
        }}
      />
      <div
        className="absolute inset-y-0 left-1/2 w-px"
        style={{ backgroundColor: "rgba(42,38,32,0.35)", boxShadow: "0 0 3px rgba(42,38,32,0.4)" }}
      />
    </div>
  );

  if (reduced) {
    const s = Math.max(0, Math.min(S - 1, currentSpread < 0 ? 0 : currentSpread));
    return (
      <div ref={outerRef} id="events" style={{ height: `${S * VH_PER_TURN_REDUCED + 100}vh` }} className="relative scroll-mt-16">
        <div className="sticky top-0 flex h-screen items-center justify-center px-4">
          <div
            ref={bookRef}
            className="relative overflow-hidden shadow-[0_30px_70px_rgba(42,38,32,0.25)]"
            style={{
              width: "min(92vw, 1080px)",
              aspectRatio: "10 / 7",
              maxHeight: "78vh",
              containerType: "inline-size",
            }}
          >
            <div key={s} className="grid h-full grid-cols-2 transition-opacity duration-500">
              <div className="h-full overflow-hidden">{spreads[s].left}</div>
              <div className="h-full overflow-hidden">{spreads[s].right}</div>
            </div>
            {spineOverlay}
            <BookArrows
              onPrev={() => goToSpread(s - 1)}
              onNext={() => goToSpread(s + 1)}
              canPrev={s > 0}
              canNext={s < S - 1}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={outerRef} id="events" style={{ height: `${S * VH_PER_TURN + 100}vh` }} className="relative scroll-mt-16">
      <div className="sticky top-0 flex h-screen items-center justify-center px-4">
        <div
          ref={bookRef}
          className="relative"
          style={{
            width: "min(92vw, 1080px)",
            aspectRatio: "10 / 7",
            maxHeight: "78vh",
            perspective: "2000px",
            containerType: "inline-size",
            filter: "drop-shadow(0 30px 60px rgba(42,38,32,0.28))",
          }}
        >
          {/* left backing under everything */}
          <div
            ref={leftBaseRef}
            className="absolute inset-y-0 left-0 w-1/2"
            style={{ backgroundColor: "#171310", opacity: 0 }}
          />
          {/* right base: final spread's right page */}
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden" style={{ zIndex: 0 }}>
            {spreads[S - 1].right}
          </div>

          {/* leaves: 0 = cover; i>=1 front = spreads[i-1].right, back = spreads[i].left */}
          {Array.from({ length: S }).map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                leafRefs.current[i] = el;
              }}
              className="absolute inset-y-0 right-0 w-1/2"
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "left center",
                willChange: "transform",
                zIndex: S - i,
              }}
            >
              {/* front face */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
              >
                {i === 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/assets/passport/cover.png"
                    alt="Spilt Social passport cover — scroll to open"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  spreads[i - 1].right
                )}
                {/* moving turn shadow */}
                <div
                  ref={(el) => {
                    shadowRefs.current[i] = el;
                  }}
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    opacity: 0,
                    background:
                      "linear-gradient(to right, rgba(20,17,13,0.55), transparent 55%)",
                  }}
                />
              </div>
              {/* back face */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                {spreads[i].left}
              </div>
            </div>
          ))}

          {spineOverlay}
          <BookArrows
            onPrev={() => goToSpread(Math.round(display.current) - 2)}
            onNext={() => goToSpread(Math.round(display.current))}
            canPrev
            canNext
          />
        </div>
      </div>
    </div>
  );
}

function BookArrows({
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  const base =
    "absolute bottom-3 z-[70] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-xl transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2";
  return (
    <>
      <button
        type="button"
        aria-label="Previous page"
        onClick={onPrev}
        disabled={!canPrev}
        className={`${base} left-3 disabled:opacity-25`}
        style={{ backgroundColor: "rgba(250,246,238,0.9)", color: CHARCOAL, outlineColor: GOLD }}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next page"
        onClick={onNext}
        disabled={!canNext}
        className={`${base} right-3 disabled:opacity-25`}
        style={{ backgroundColor: "rgba(250,246,238,0.9)", color: CHARCOAL, outlineColor: GOLD }}
      >
        ›
      </button>
    </>
  );
}
