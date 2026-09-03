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
  // passport style: 02 OCT 2026
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/New_York",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}`.toUpperCase();
}

/* ── page faces ────────────────────────────────────────────── */

/** shared paper: spread.png as low-contrast texture only. Oversized and
 *  cropped INTO the paper so the render's baked page edges/margins bleed
 *  out of view — they were reading as a phantom inner card. Content sits
 *  directly on this paper, edge to edge. Gutter side gets ~4% extra
 *  padding like a real bound book; nothing may cross the spine. */
const PAD_OUT = "9%"; // outer/vertical padding
const PAD_GUTTER = "13%"; // spine-side padding (9% + 4% gutter margin)

type PageSide = "left" | "right" | "single";

function pageStyle(side: PageSide): React.CSSProperties {
  return {
    backgroundColor: PAPER,
    backgroundImage: "url(/assets/passport/spread.png)",
    backgroundSize: "260% 150%",
    // single pages sample off-center: 50% would land on the source
    // render's baked center crease and draw a seam down the page
    backgroundPosition:
      side === "left" ? "30% 48%" : side === "right" ? "70% 48%" : "28% 48%",
    backgroundBlendMode: "soft-light",
    overflow: "hidden",
    paddingTop: "5%",
    paddingBottom: "5%",
    paddingLeft: side === "left" || side === "single" ? PAD_OUT : PAD_GUTTER,
    paddingRight: side === "left" ? PAD_GUTTER : PAD_OUT,
    // each page is its own size container: cqw units scale with the
    // page itself, so single-page mobile type stays readable
    containerType: "inline-size",
  };
}

/** the cropped cover render as a page face (shared desktop + mobile) */
function CoverFace() {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: "#1B1F3B" }}>
      {/* the render's navy leather occupies only ~67% of the file
          (measured); crop computed from its bounding box */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/passport/cover.png"
        alt="Spilt Social passport cover"
        style={{
          position: "absolute",
          width: "177.6%",
          maxWidth: "none",
          left: "-35.3%",
          top: "-35.4%",
        }}
      />
    </div>
  );
}

function InsideCover({ earned }: { earned: Set<string> }) {
  return (
    <div className="flex h-full w-full flex-col" style={pageStyle("left")}>
      <p
        className="text-center font-mono text-[clamp(7px,3.2cqw,11px)] tracking-[0.3em] uppercase opacity-60"
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
        className="mt-auto text-center font-mono text-[clamp(6px,2.8cqw,10px)] tracking-[0.24em] uppercase opacity-40"
        style={{ color: CHARCOAL }}
      >
        Stamps are earned, never given
      </p>
    </div>
  );
}

function IdPage() {
  return (
    <div className="flex h-full w-full flex-col" style={pageStyle("right")}>
      <p
        className="font-mono text-[clamp(7px,3.4cqw,12px)] tracking-[0.26em] uppercase"
        style={{ color: CHARCOAL, opacity: 0.7 }}
      >
        Spilt Social — Social Passport
      </p>
      <div
        className="mt-[8%] space-y-[4%] text-[clamp(10px,5.2cqw,17px)]"
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
          className="truncate font-mono text-[clamp(7px,3.2cqw,11px)] tracking-[0.08em] opacity-45"
          style={{ color: CHARCOAL }}
        >
          P&lt;USA&lt;SPILT&lt;SOCIAL&lt;&lt;COLUMBUS&lt;OH&lt;EST2023&lt;&lt;&lt;&lt;&lt;&lt;&lt;
        </p>
      </div>
    </div>
  );
}

/** ONE event per page on a fixed vertical grid of reserved zones:
 *  sticker (fixed) / title (3-line clamp) / rule / details / CTA /
 *  flexible spacer / footer pinned to the bottom padding. Content sits
 *  directly on the page paper — no inner card. overflow:hidden on the
 *  page (via pageStyle) is the hard containment guarantee. */
function EventPage({ ev, side }: { ev: SpiltEvent; side: PageSide }) {
  const cta = ctaForFormat(ev.format);
  return (
    <div
      className="grid h-full w-full grid-rows-[auto_minmax(0,auto)_auto_auto_auto_minmax(0,1fr)_auto] justify-items-center text-center"
      style={pageStyle(side)}
    >
      {/* sticker zone — fixed height so every page aligns */}
      <div
        className="flex items-center justify-center"
        style={{ height: "clamp(32px, 17cqw, 64px)" }}
      >
        <Sticker
          format={ev.format}
          width={116}
          rotation={side === "left" ? -3 : 3}
          className="h-full w-auto max-w-full"
        />
      </div>
      {/* title zone — fluid type tied to book width, 3 lines max */}
      <h3
        className="font-heading mt-[4%] line-clamp-3 max-w-full text-[clamp(9.5px,4.6cqw,18px)] leading-snug"
        style={{ color: CHARCOAL, overflowWrap: "break-word" }}
      >
        {ev.title}
      </h3>
      <div className="my-[4%] h-px w-[52%]" style={{ backgroundColor: `${GOLD}99` }} />
      <div
        className="w-full min-w-0 space-y-[2%] text-left font-mono text-[clamp(6.5px,3.4cqw,12px)] leading-snug tracking-[0.06em]"
        style={{ color: CHARCOAL, overflowWrap: "break-word" }}
      >
        <p>
          <span className="opacity-50">DATE:&nbsp;&nbsp;</span>
          {fmtDate(ev.dateISO)}
        </p>
        <p>
          <span className="opacity-50">TIME:&nbsp;&nbsp;</span>
          {ev.timeDisplay.toUpperCase()}
        </p>
        <p className="line-clamp-2">
          <span className="opacity-50">VENUE:&nbsp;</span>
          {ev.venue}
          {ev.city ? `, ${ev.city}` : ""}
        </p>
      </div>
      <a
        href={ev.poshUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-[5%] inline-flex min-h-[44px] w-max max-w-full cursor-pointer items-center px-[1.6em] py-[0.8em] text-[clamp(7px,3.6cqw,12px)] font-medium tracking-[0.06em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HI)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
      >
        {cta.label}
      </a>
      {/* flexible spacer */}
      <div aria-hidden />
      <p
        className="w-full pt-[3%] text-center font-mono text-[clamp(5.5px,2.6cqw,9px)] leading-tight tracking-[0.12em] uppercase opacity-40"
        style={{ color: CHARCOAL }}
      >
        posh.vip · admits one · non-transferable
      </p>
    </div>
  );
}

/** Designed blank page for an odd event count — never a raw empty page. */
function BlankPage() {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center"
      style={pageStyle("right")}
    >
      {/* faint guilloche medallion */}
      <svg
        viewBox="0 0 200 200"
        className="w-[46%] opacity-[0.13]"
        aria-hidden
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse
            key={i}
            cx="100"
            cy="100"
            rx="88"
            ry="34"
            fill="none"
            stroke={CHARCOAL}
            strokeWidth="0.7"
            transform={`rotate(${i * 15} 100 100)`}
          />
        ))}
        <circle cx="100" cy="100" r="88" fill="none" stroke={GOLD} strokeWidth="0.8" />
      </svg>
      <p
        className="mt-[8%] text-center font-mono text-[clamp(7px,3.2cqw,11px)] tracking-[0.26em] uppercase opacity-55"
        style={{ color: CHARCOAL }}
      >
        More stamps coming — check back soon.
      </p>
    </div>
  );
}

/* ── the book ──────────────────────────────────────────────── */

type Spread = { left: React.ReactNode; right: React.ReactNode };

/* ── mobile book: single page per view, gesture-driven ─────────
   No scroll-jacking: the section is normal document height and the
   page scrolls straight past it. Turns come from horizontal swipes
   (touch-action: pan-y + horizontal-intent detection), edge taps,
   corner arrows, and ←/→. Swipe velocity carries the turn. */
const MOBILE_ROT = -115; // past 90° the leaf's front face vanishes
const MOBILE_DUR = 350;

function MobileBook({
  pages,
  reduced,
  onPageViewed,
}: {
  pages: { node: React.ReactNode; format?: FormatSlug }[];
  reduced: boolean;
  onPageViewed?: (format: FormatSlug) => void;
}) {
  const N = pages.length;
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  indexRef.current = index;

  const sectionRef = useRef<HTMLElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const animating = useRef(false);
  const gesture = useRef({
    active: false,
    claimed: false,
    dir: 0 as 0 | 1 | -1,
    x0: 0,
    y0: 0,
    t0: 0,
    p: 0,
  });

  /* stamp earning on page view */
  useEffect(() => {
    const f = pages[index]?.format;
    if (f && f !== "other") onPageViewed?.(f);
  }, [index, pages, onPageViewed]);

  /* reset leaf transforms the instant the index commits (before paint) */
  useEffect(() => {
    if (curRef.current) {
      curRef.current.getAnimations().forEach((a) => a.cancel());
      curRef.current.style.transform = "rotateY(0deg)";
    }
    if (prevRef.current) {
      prevRef.current.getAnimations().forEach((a) => a.cancel());
      prevRef.current.style.transform = `rotateY(${MOBILE_ROT}deg)`;
    }
    if (shadowRef.current) shadowRef.current.style.opacity = "0";
    animating.current = false;
  }, [index]);

  const commit = useCallback(
    (dir: 1 | -1, fromP: number, velocity: number) => {
      const i = indexRef.current;
      const to = i + dir;
      if (to < 0 || to > N - 1) return;
      if (reduced) {
        setIndex(to); // instant crossfade — no turn
        return;
      }
      animating.current = true;
      // fast flick = fast turn
      const dur = Math.max(
        140,
        Math.min(420, (MOBILE_DUR - velocity * 220) * (1 - fromP * 0.6))
      );
      const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
      const el = dir === 1 ? curRef.current : prevRef.current;
      if (!el) return;
      const from = dir === 1 ? MOBILE_ROT * fromP : MOBILE_ROT * (1 - fromP);
      const to_ = dir === 1 ? MOBILE_ROT : 0;
      const anim = el.animate(
        [{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to_}deg)` }],
        { duration: dur, easing: ease, fill: "forwards" }
      );
      shadowRef.current?.animate([{ opacity: "0.3" }, { opacity: "0" }], {
        duration: dur,
        easing: ease,
        fill: "forwards",
      });
      // commit on finish, with a timeout fallback — finish events are
      // frame-gated and can be swallowed (backgrounded tab, cancelled
      // animation); the page must never wedge mid-turn
      let committed = false;
      const done = () => {
        if (committed) return;
        committed = true;
        setIndex(to);
      };
      anim.onfinish = done;
      setTimeout(done, dur + 120);
    },
    [N, reduced]
  );

  const revert = useCallback((dir: 1 | -1, fromP: number) => {
    const el = dir === 1 ? curRef.current : prevRef.current;
    if (!el) return;
    animating.current = true;
    const from = dir === 1 ? MOBILE_ROT * fromP : MOBILE_ROT * (1 - fromP);
    const to = dir === 1 ? 0 : MOBILE_ROT;
    const anim = el.animate(
      [{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }],
      { duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      el.style.transform = `rotateY(${to}deg)`;
      el.getAnimations().forEach((a) => a.cancel());
      animating.current = false;
    };
    anim.onfinish = done;
    setTimeout(done, 340);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (animating.current) return;
      commit(dir, 0, 0);
    },
    [commit]
  );

  /* touch gestures: only claim clearly-horizontal swipes; vertical
     intent always scrolls the page */
  useEffect(() => {
    const face = faceRef.current;
    if (!face) return;
    const g = gesture.current;

    const onStart = (e: TouchEvent) => {
      // gestures on the book never reach window-level listeners
      // (the concept switcher's swipe handler in particular)
      e.stopPropagation();
      if (animating.current) return;
      g.active = true;
      g.claimed = false;
      g.dir = 0;
      g.x0 = e.touches[0].clientX;
      g.y0 = e.touches[0].clientY;
      g.t0 = performance.now();
      g.p = 0;
    };
    const onMove = (e: TouchEvent) => {
      e.stopPropagation();
      if (!g.active) return;
      const dx = e.touches[0].clientX - g.x0;
      const dy = e.touches[0].clientY - g.y0;
      if (!g.claimed) {
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
          g.active = false; // vertical intent — the page scrolls
          return;
        }
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
          const dir = dx < 0 ? 1 : -1;
          const to = indexRef.current + dir;
          if (to < 0 || to > N - 1) {
            g.active = false;
            return;
          }
          g.claimed = true;
          g.dir = dir as 1 | -1;
        } else return;
      }
      e.preventDefault(); // claimed: the book owns this gesture
      const w = face.getBoundingClientRect().width;
      g.p = Math.min(1, Math.max(0, Math.abs(dx) / (w * 0.6)));
      if (reduced) return; // no live drag under reduced motion
      if (g.dir === 1 && curRef.current) {
        curRef.current.style.transform = `rotateY(${MOBILE_ROT * g.p}deg)`;
      } else if (g.dir === -1 && prevRef.current) {
        prevRef.current.style.transform = `rotateY(${MOBILE_ROT * (1 - g.p)}deg)`;
      }
      if (shadowRef.current)
        shadowRef.current.style.opacity = String(Math.sin(g.p * Math.PI) * 0.3);
    };
    const onEnd = (e: TouchEvent) => {
      e.stopPropagation();
      if (!g.active) return;
      g.active = false;
      if (!g.claimed) return;
      const dt = Math.max(1, performance.now() - g.t0);
      const dx = e.changedTouches[0].clientX - g.x0;
      const velocity = Math.abs(dx) / dt; // px/ms
      if (g.p > 0.32 || velocity > 0.45) commit(g.dir as 1 | -1, g.p, velocity);
      else revert(g.dir as 1 | -1, g.p);
    };

    face.addEventListener("touchstart", onStart, { passive: true });
    face.addEventListener("touchmove", onMove, { passive: false });
    face.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      face.removeEventListener("touchstart", onStart);
      face.removeEventListener("touchmove", onMove);
      face.removeEventListener("touchend", onEnd);
    };
  }, [N, commit, revert, reduced]);

  /* arrow keys while in view + concept-switcher swipe guard */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let inView = false;
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting && e.intersectionRatio > 0.3;
        if (inView) document.body.dataset.spiltBookNav = "1";
        else delete document.body.dataset.spiltBookNav;
      },
      { threshold: [0, 0.3, 0.6] }
    );
    io.observe(section);
    const onKey = (e: KeyboardEvent) => {
      if (!inView) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      delete document.body.dataset.spiltBookNav;
      window.removeEventListener("keydown", onKey);
    };
  }, [step]);

  /* pagination scrub */
  const scrubTo = (clientX: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const i = Math.round(((clientX - r.left) / r.width) * (N - 1));
    const clamped = Math.min(N - 1, Math.max(0, i));
    if (clamped !== indexRef.current) setIndex(clamped);
  };

  return (
    <section
      ref={sectionRef}
      id="events"
      className="flex min-h-[92vh] scroll-mt-16 flex-col items-center justify-center px-4 py-16"
    >
      <div
        ref={faceRef}
        className="relative"
        style={{
          width: "min(88vw, 430px)",
          aspectRatio: "5 / 7",
          perspective: "1600px",
          touchAction: "pan-y",
          filter: "drop-shadow(0 18px 40px rgba(42,38,32,0.25))",
        }}
      >
        {/* next page beneath */}
        <div className="absolute inset-0 overflow-hidden rounded-xl" style={{ zIndex: 10 }}>
          {pages[index + 1]?.node ?? (
            <div className="h-full w-full rounded-xl" style={{ backgroundColor: "#171310" }} />
          )}
        </div>
        {/* current leaf */}
        <div
          ref={curRef}
          className="absolute inset-0"
          style={{
            zIndex: 20,
            transformOrigin: "left center",
            backfaceVisibility: "hidden",
            willChange: "transform",
          }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            {pages[index].node}
            <div
              ref={shadowRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{
                opacity: 0,
                background: "linear-gradient(to right, rgba(20,17,13,0.5), transparent 60%)",
              }}
            />
          </div>
        </div>
        {/* previous leaf — parked past 90°, invisible via backface */}
        <div
          ref={prevRef}
          className="absolute inset-0"
          style={{
            zIndex: 30,
            transform: `rotateY(${MOBILE_ROT}deg)`,
            transformOrigin: "left center",
            backfaceVisibility: "hidden",
            willChange: "transform",
          }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            {index > 0 ? pages[index - 1].node : null}
          </div>
        </div>
        {/* edge tap zones (redundant affordance; arrows + dashes carry a11y) */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => step(-1)}
          className="absolute inset-y-0 left-0 z-[40] w-[16%] cursor-pointer"
          style={{ background: "transparent" }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => step(1)}
          className="absolute inset-y-0 right-0 z-[40] w-[16%] cursor-pointer"
          style={{ background: "transparent" }}
        />
        <BookArrows
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          canPrev={index > 0}
          canNext={index < N - 1}
        />
      </div>

      {/* wayfinding: gold dashes + mono counter, tappable + scrubbable */}
      <div className="mt-7 flex items-center gap-4">
        <div
          className="flex touch-none items-center"
          role="tablist"
          aria-label="Passport pages"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            scrubTo(e.clientX, e.currentTarget);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) scrubTo(e.clientX, e.currentTarget);
          }}
        >
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Page ${i + 1} of ${N}`}
              onClick={() => setIndex(i)}
              className="flex h-8 cursor-pointer items-center px-[3px] focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ outlineColor: GOLD }}
            >
              <span
                className="block h-[2px] transition-all duration-300"
                style={{
                  width: i === index ? 22 : 9,
                  backgroundColor: i === index ? GOLD : "rgba(42,38,32,0.25)",
                }}
              />
            </button>
          ))}
        </div>
        <span
          className="font-mono text-[11px] tracking-[0.14em]"
          style={{ color: CHARCOAL, opacity: 0.6 }}
          aria-live="polite"
        >
          {index + 1} / {N}
        </span>
      </div>
    </section>
  );
}

export default function PassportBook({
  events,
  earned,
  onSpreadViewed,
}: {
  events: SpiltEvent[];
  earned: Set<string>;
  onSpreadViewed?: (format: FormatSlug) => void;
}) {
  const spreads = useMemo<Spread[]>(() => {
    // two events per open spread, chronological, left page first;
    // an odd count closes on the designed blank page
    const eventSpreads: Spread[] = [];
    for (let i = 0; i < events.length; i += 2) {
      eventSpreads.push({
        left: <EventPage ev={events[i]} side="left" />,
        right: events[i + 1] ? (
          <EventPage ev={events[i + 1]} side="right" />
        ) : (
          <BlankPage />
        ),
      });
    }
    return [
      { left: <InsideCover earned={earned} />, right: <IdPage /> },
      ...eventSpreads,
    ];
  }, [events, earned]);
  const S = spreads.length; // leaves = S (cover + S-1 page leaves), progress 0..S

  /* mobile (≤1024px): single-page, gesture-driven — flat page list in
     the same reading order as the desktop spreads */
  const pages = useMemo<{ node: React.ReactNode; format?: FormatSlug }[]>(() => {
    const list: { node: React.ReactNode; format?: FormatSlug }[] = [
      { node: <CoverFace /> },
      { node: <InsideCover earned={earned} /> },
      { node: <IdPage /> },
      ...events.map((ev) => ({
        node: <EventPage ev={ev} side={"single" as const} />,
        format: ev.format,
      })),
    ];
    if (events.length % 2 === 1) list.push({ node: <BlankPage /> });
    return list;
  }, [events, earned]);

  const [isMobile, setIsMobile] = useState(false);

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
    const mq = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
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
    if (isMobile) return; // mobile book is gesture-driven, no scroll mapping
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
      // stamp earning: an event spread holds TWO events — earn both formats
      const atSpread = Math.round(d) - 1;
      if (atSpread !== viewedRef.current && atSpread >= 1 && atSpread < S) {
        viewedRef.current = atSpread;
        for (const ev of [events[(atSpread - 1) * 2], events[(atSpread - 1) * 2 + 1]]) {
          if (ev && ev.format !== "other") onSpreadViewed?.(ev.format);
        }
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
  }, [S, reduced, isMobile, events, onSpreadViewed, progressFromScroll, scrollToProgress]);

  /* keyboard + swipe while the book is in view; flag off the concept
     switcher's own arrow/swipe handlers via a body dataset marker */
  useEffect(() => {
    if (isMobile) return; // MobileBook owns its own gestures + keys
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
  }, [S, goToSpread, reduced, isMobile, progressFromScroll]);

  /* ── render ──────────────────────────────────────────────── */
  /* the ONLY rounded corners in the book: its two outer edges.
     Right-half faces round their right corners; a back face's radius
     lands on the left outer edge after the 180° flip — automatically
     correct. Gutter corners stay square. */
  const FACE_R_RIGHT = "0 12px 12px 0";
  const FACE_R_LEFT = "12px 0 0 12px";

  /* ≤1024px: equal-class single-page book — no scroll-driving, no
     sticky height; the page scrolls straight past it */
  if (isMobile) {
    return (
      <MobileBook pages={pages} reduced={reduced} onPageViewed={onSpreadViewed} />
    );
  }

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
            className="relative overflow-hidden rounded-xl shadow-[0_30px_70px_rgba(42,38,32,0.25)]"
            style={{
              width: "min(92vw, 1080px, 111.4vh)",
              aspectRatio: "10 / 7",
              containerType: "inline-size",
            }}
          >
            <div key={s} className="grid h-full grid-cols-2 transition-opacity duration-500">
              <div className="h-full overflow-hidden rounded-l-xl">{spreads[s].left}</div>
              <div className="h-full overflow-hidden rounded-r-xl">{spreads[s].right}</div>
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
            width: "min(92vw, 1080px, 111.4vh)",
            aspectRatio: "10 / 7",
            perspective: "2000px",
            containerType: "inline-size",
            filter: "drop-shadow(0 30px 60px rgba(42,38,32,0.28))",
          }}
        >
          {/* left backing under everything */}
          <div
            ref={leftBaseRef}
            className="absolute inset-y-0 left-0 w-1/2"
            style={{ backgroundColor: "#171310", opacity: 0, borderRadius: FACE_R_LEFT }}
          />
          {/* right base: final spread's right page */}
          <div
            className="absolute inset-y-0 right-0 w-1/2 overflow-hidden"
            style={{ zIndex: 0, borderRadius: FACE_R_RIGHT }}
          >
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
                style={{ backfaceVisibility: "hidden", borderRadius: FACE_R_RIGHT }}
              >
                {i === 0 ? <CoverFace /> : spreads[i - 1].right}
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
              {/* back face — radius mirrors onto the left outer edge */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderRadius: FACE_R_RIGHT,
                }}
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
