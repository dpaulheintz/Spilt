"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import type { SpiltEvent } from "@/lib/events";
import {
  FORMATS,
  POSH_GROUP_URL,
  TAPT_URL,
  ctaForFormat,
  type FormatSlug,
} from "@/lib/formats";
import { toast } from "@/lib/toast";
import ToastHost from "@/components/ToastHost";
import { STAMPS, Stamp, type StampDef } from "./stamps";
import Sticker from "./Sticker";
import PassportNav from "./PassportNav";
import PassportBook from "./PassportBook";
import SponsorMarquee from "./SponsorMarquee";

/* Spilt's production palette */
const CREAM = "#FAF6EE";
const CHARCOAL = "#2A2620";
const NAVY = "#1B1F3B";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";
const HAIRLINE = "rgba(42, 38, 32, 0.14)";

const MRZ = "P<USA<SPILT<SOCIAL<<COLUMBUS<OH<EST2023<<<<<<<";
const STORAGE_KEY = "spilt-passport-stamps";

function fakeClick(e: React.MouseEvent) {
  e.preventDefault();
  toast();
}

function GoldLink({
  href,
  children,
  className,
  newTab = true,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  newTab?: boolean;
}) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={`inline-block cursor-pointer px-6 py-3 text-[13px] font-medium tracking-[0.05em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${className ?? ""}`}
      style={{ backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HI)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
    >
      {children}
    </a>
  );
}

export default function PassportContent({
  events,
  sponsorLogos,
}: {
  events: SpiltEvent[];
  sponsorLogos: string[];
}) {
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [fly, setFly] = useState<{
    def: StampDef;
    x: number;
    y: number;
    phase: "press" | "fly";
  } | null>(null);

  const widgetRef = useRef<HTMLButtonElement>(null);
  const manifestoRef = useRef<HTMLElement>(null);
  const formatRefs = useRef<Record<string, HTMLElement | null>>({});
  const earnedRef = useRef(earned);
  earnedRef.current = earned;

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setEarned(new Set(JSON.parse(raw) as string[]));
    } catch {}
    setLoaded(true);
  }, []);

  const earn = useCallback(
    (id: string, anchor?: Element | null) => {
      if (earnedRef.current.has(id)) return;
      const def = STAMPS.find((s) => s.id === id);
      if (!def) return;
      setEarned((prev) => {
        const next = new Set(prev);
        next.add(id);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        } catch {}
        return next;
      });
      if (reduced || !anchor) return;
      const r = anchor.getBoundingClientRect();
      setFly({
        def,
        x: Math.min(window.innerWidth - 120, r.right - 60),
        y: Math.max(24, r.top + 12),
        phase: "press",
      });
      setTimeout(() => setFly((f) => (f ? { ...f, phase: "fly" } : f)), 600);
      setTimeout(() => setFly(null), 1250);
    },
    [reduced]
  );

  /* section stamps: manifesto + the five format rows */
  useEffect(() => {
    if (!loaded) return;
    const entries: [Element | null, string][] = [
      [manifestoRef.current, "manifesto"],
      ...FORMATS.map(
        (f) => [formatRefs.current[f.slug], f.slug] as [Element | null, string]
      ),
    ];
    const observers = entries.map(([el, id]) => {
      if (!el) return null;
      const io = new IntersectionObserver(
        ([e]) => {
          const viewportShare =
            e.intersectionRect.height / Math.max(1, window.innerHeight);
          if (e.intersectionRatio >= 0.6 || viewportShare >= 0.6) {
            earn(id, el);
            io.disconnect();
          }
        },
        { threshold: [0.2, 0.4, 0.6, 0.8] }
      );
      io.observe(el);
      return io;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, [loaded, earn]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const onSpreadViewed = useCallback(
    (format: FormatSlug) => {
      earn(format, widgetRef.current);
    },
    [earn]
  );

  const complete = earned.size === STAMPS.length;

  const goTo = (target: string) => {
    setModalOpen(false);
    document.getElementById(target)?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };

  const flyTransform = () => {
    if (!fly || !widgetRef.current) return {};
    if (fly.phase === "press") return { transform: "scale(1)" };
    const w = widgetRef.current.getBoundingClientRect();
    const dx = w.left + w.width / 2 - (fly.x + 44);
    const dy = w.top + w.height / 2 - (fly.y + 44);
    return { transform: `translate(${dx}px, ${dy}px) scale(0.22)`, opacity: 0.35 };
  };

  /* soonest future event per format → real CTA destinations */
  const eventForFormat = (slug: FormatSlug) =>
    events.find((e) => e.format === slug);

  return (
    <div
      className="font-body min-h-dvh"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      <PassportNav />

      {/* ── hero ──────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ height: "calc(100dvh - 61px)", minHeight: 540, backgroundColor: CHARCOAL }}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/assets/passport/hero.mp4"
          poster="/assets/passport/hero-poster.jpg"
          autoPlay={!reduced}
          muted
          loop
          playsInline
          preload="auto"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5"
          style={{ background: "linear-gradient(to top, rgba(20,17,13,0.62), transparent)" }}
        />
        <div className="absolute right-0 bottom-0 left-0 flex flex-col gap-5 p-6 pb-28 sm:flex-row sm:items-end sm:justify-between sm:p-10 sm:pb-28">
          <div>
            <h1 className="font-heading-xl max-w-2xl text-4xl leading-tight text-white sm:text-6xl">
              Fill your cup
            </h1>
            <div className="mt-7">
              <GoldLink href={POSH_GROUP_URL}>Apply for membership</GoldLink>
            </div>
          </div>
          <p
            className="hidden font-mono text-[11px] tracking-[0.08em] text-white sm:block"
            style={{ opacity: 0.4 }}
            aria-hidden
          >
            {MRZ}
          </p>
        </div>
      </section>

      {/* ── manifesto ─────────────────────────────────────── */}
      <section
        id="manifesto"
        ref={manifestoRef}
        className="mx-auto max-w-3xl px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-24"
      >
        <h2 className="font-heading text-4xl leading-snug sm:text-5xl">
          Find your people
        </h2>
        <p className="mx-auto mt-7 max-w-[640px] text-[16px] leading-relaxed opacity-80">
          Whether that means your next new hire, lifelong mentor, or even a gym
          buddy, our experiences connect like-minded people to help everyone
          level up.
        </p>
        <div className="mt-10">
          <GoldLink href={POSH_GROUP_URL}>Apply</GoldLink>
        </div>
      </section>

      {/* ── sponsors ──────────────────────────────────────── */}
      <SponsorMarquee logos={sponsorLogos} />

      {/* ── the passport book (events) ────────────────────── */}
      <PassportBook events={events} earned={earned} onSpreadViewed={onSpreadViewed} />

      {/* ── the experiences ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <h2 className="font-heading mb-14 text-4xl sm:text-5xl">
          The experiences.
        </h2>
        <div className="flex flex-col gap-16 sm:gap-20">
          {FORMATS.map((f, i) => {
            const isTapt = f.slug === "tapt";
            const ev = eventForFormat(f.slug);
            const href = isTapt ? TAPT_URL : (ev?.poshUrl ?? POSH_GROUP_URL);
            const cta = ctaForFormat(f.slug);
            return (
              <article
                key={f.slug}
                id={f.slug}
                ref={(el) => {
                  formatRefs.current[f.slug] = el;
                }}
                className={`flex scroll-mt-24 flex-col gap-8 lg:items-center ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                }`}
                style={
                  isTapt
                    ? {
                        backgroundColor: NAVY,
                        color: CREAM,
                        padding: "clamp(24px, 4vw, 48px)",
                      }
                    : undefined
                }
              >
                {/* photo placeholder — real photo drops in at
                    /public/assets/passport/formats/<slug>.jpg */}
                <div className="lg:w-1/2">
                  <div
                    className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border"
                    style={{
                      borderColor: isTapt ? "rgba(198,157,96,0.5)" : GOLD,
                      backgroundColor: isTapt ? "#232845" : "#FFFDF8",
                    }}
                  >
                    <span
                      aria-hidden
                      className="font-heading text-[11cqw] whitespace-nowrap opacity-[0.07] lg:text-6xl"
                      style={{ color: isTapt ? CREAM : CHARCOAL }}
                    >
                      {isTapt ? "?" : f.name}
                    </span>
                  </div>
                </div>
                <div className="lg:w-1/2 lg:px-6">
                  <Sticker
                    format={f.slug}
                    width={150}
                    rotation={i % 2 === 1 ? 3 : -3}
                  />
                  <h3 className="font-heading mt-6 text-3xl sm:text-4xl">
                    {f.name}
                  </h3>
                  <p
                    className="mt-4 max-w-lg text-[15px] leading-relaxed"
                    style={{ opacity: isTapt ? 0.85 : 0.8 }}
                  >
                    {f.copy}
                  </p>
                  <div className="mt-7">
                    <GoldLink href={href}>{cta.label}</GoldLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── subscribe ─────────────────────────────────────── */}
      <section
        id="subscribe"
        className="border-t"
        style={{ borderColor: HAIRLINE }}
      >
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl">
            Hear about events first.
          </h2>
          {subscribed ? (
            <p aria-live="polite" className="mt-8 text-lg" style={{ color: GOLD }}>
              You&apos;re on the list.
            </p>
          ) : (
            <form
              className="mx-auto mt-8 flex max-w-md gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (/.+@.+\..+/.test(email)) {
                  setSubscribed(true);
                  earn("subscribed", e.currentTarget);
                } else toast("That address doesn't look right.");
              }}
            >
              <label htmlFor="passport-email" className="sr-only">
                Email address
              </label>
              <input
                id="passport-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border bg-white px-4 py-3 text-[14px] placeholder:opacity-45 focus:outline-2 focus:outline-offset-1"
                style={{ borderColor: HAIRLINE, color: CHARCOAL, outlineColor: GOLD }}
              />
              <button
                type="submit"
                className="shrink-0 cursor-pointer px-6 py-3 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HI)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── footer ────────────────────────────────────────── */}
      <footer className="border-t" style={{ borderColor: HAIRLINE, backgroundColor: "#F4EEE2" }}>
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Club", ["About", "The experiences", "House rules", "Careers"]],
              ["Membership", ["Apply", "Benefits", "FAQs", "Gift membership"]],
              ["Contact", [BRAND.contact, "Press", "Partnerships"]],
              ["Follow", ["Instagram", "X", "LinkedIn"]],
            ] as [string, string[]][]
          ).map(([title, links]) => (
            <div key={title}>
              <p className="mb-4 text-[12px] font-semibold tracking-[0.2em] uppercase opacity-70">
                {title}
              </p>
              <ul className="space-y-2.5 text-[14px]">
                {links.map((l) => (
                  <li key={l}>
                    {l.includes("@") ? (
                      <span className="opacity-80">{l}</span>
                    ) : l === "Partnerships" ? (
                      <a
                        href="/partner"
                        className="cursor-pointer opacity-80 transition-opacity hover:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{ outlineColor: GOLD }}
                      >
                        {l}
                      </a>
                    ) : (
                      <a
                        href="#"
                        onClick={fakeClick}
                        className="cursor-pointer opacity-80 transition-opacity hover:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{ outlineColor: GOLD }}
                      >
                        {l}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="mx-auto max-w-7xl border-t px-6 py-6 pb-24 text-[12px] opacity-60"
          style={{ borderColor: HAIRLINE }}
        >
          © 2026 Spilt Social · Concept 6 of 6
        </div>
      </footer>

      {/* ── passport widget ───────────────────────────────── */}
      <button
        ref={widgetRef}
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label={`Open your social passport — ${earned.size} of ${STAMPS.length} stamps earned`}
        className="fixed bottom-5 left-5 z-[95] cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: GOLD }}
      >
        <span
          className="block h-14 w-11 rounded-[3px] bg-cover bg-top"
          style={{
            backgroundImage: "url(/assets/passport/cover.png)",
            boxShadow: "0 6px 18px rgba(42,38,32,0.28)",
          }}
        />
        <span
          className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold"
          style={{ backgroundColor: GOLD, color: CHARCOAL }}
        >
          {loaded ? earned.size : 0}
        </span>
      </button>

      {/* ── stamp earn overlay ────────────────────────────── */}
      {fly && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[110]"
          style={{
            left: fly.x,
            top: fly.y,
            transition:
              fly.phase === "fly"
                ? "transform 550ms var(--ease-spilt), opacity 550ms var(--ease-spilt)"
                : undefined,
            animation:
              fly.phase === "press"
                ? "passport-press 180ms var(--ease-spilt)"
                : undefined,
            ...flyTransform(),
          }}
        >
          <Stamp def={fly.def} size={88} />
        </div>
      )}

      {/* ── passport modal ────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(42,38,32,0.55)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Your social passport"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl overflow-hidden"
            style={{
              backgroundImage: "url(/assets/passport/spread.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "0 30px 80px rgba(20,17,13,0.4)",
            }}
          >
            <button
              type="button"
              autoFocus
              onClick={() => setModalOpen(false)}
              aria-label="Close passport"
              className="absolute top-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center text-xl focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: CHARCOAL, outlineColor: GOLD }}
            >
              ×
            </button>
            <div className="px-6 pt-8 pb-3 text-center">
              <p className="text-[11px] tracking-[0.26em] uppercase opacity-70">
                Social Passport · {earned.size} of {STAMPS.length} stamps
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 px-6 pb-6 sm:px-10">
              {[STAMPS.slice(0, 4), STAMPS.slice(4)].map((page, pi) => (
                <div
                  key={pi}
                  className={`grid grid-cols-2 content-start gap-3 py-4 ${
                    pi === 0 ? "sm:border-r" : ""
                  }`}
                  style={{ borderColor: "rgba(42,38,32,0.12)" }}
                >
                  {page.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => goTo(s.target)}
                      className="flex cursor-pointer flex-col items-center gap-1.5 p-2 transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ outlineColor: GOLD }}
                      aria-label={`${s.label} — ${earned.has(s.id) ? "earned" : "not yet earned"}; go to section`}
                    >
                      {earned.has(s.id) ? (
                        <Stamp def={s} size={84} />
                      ) : (
                        <span
                          className="flex h-[84px] w-[84px] items-center justify-center border border-dashed text-center text-[9px] leading-tight tracking-[0.12em] uppercase opacity-45"
                          style={{
                            borderColor: CHARCOAL,
                            borderRadius: s.shape === "round" ? "9999px" : "6px",
                            color: CHARCOAL,
                          }}
                        >
                          {s.label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {complete && (
              <div className="flex items-center justify-center gap-5 px-6 pb-8">
                <p className="text-[15px] font-medium" style={{ color: GOLD }}>
                  Frequent flyer. Apply.
                </p>
                <GoldLink href={POSH_GROUP_URL} className="!px-5 !py-2.5">
                  Apply
                </GoldLink>
              </div>
            )}
          </div>
        </div>
      )}

      <ToastHost className="font-body pointer-events-auto border px-5 py-3 text-[13px] [border-color:#C69D6055] bg-[#2A2620] text-[#FAF6EE]" />
    </div>
  );
}
