"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BRAND, EVENTS } from "@/lib/brand";
import { toast } from "@/lib/toast";
import ToastHost from "@/components/ToastHost";
import { STAMPS, Stamp, type StampDef } from "./stamps";

/* Spilt's production palette */
const CREAM = "#FAF6EE";
const CHARCOAL = "#2A2620";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";
const HAIRLINE = "rgba(42, 38, 32, 0.14)";

const MRZ = "P<USA<SPILT<SOCIAL<<COLUMBUS<OH<EST2023<<<<<<<";
const STORAGE_KEY = "spilt-passport-stamps";

function fakeClick(e: React.MouseEvent) {
  e.preventDefault();
  toast();
}

/* ── shared premium button ─────────────────────────────────── */
function GoldButton({
  children,
  onClick,
  type = "button",
  ghost = false,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  ghost?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`cursor-pointer text-[13px] font-medium tracking-[0.06em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${className ?? ""}`}
      style={
        ghost
          ? { border: `1px solid ${GOLD}`, color: "inherit", outlineColor: GOLD }
          : { backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }
      }
      onMouseEnter={(e) => {
        if (!ghost) e.currentTarget.style.backgroundColor = GOLD_HI;
        else e.currentTarget.style.backgroundColor = "rgba(198,157,96,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = ghost ? "transparent" : GOLD;
      }}
    >
      {children}
    </button>
  );
}

/* ── passport interlude: one clean page turn ───────────────── */
function Interlude({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [turned, setTurned] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setTurned(true), 350);
          io.disconnect();
        }
      },
      { threshold: 0.55 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="flex justify-center px-6 py-24 sm:py-32">
      <div
        ref={ref}
        className="relative h-[360px] w-[260px]"
        style={{ perspective: reduced ? undefined : "1400px" }}
      >
        {reduced ? (
          /* reduced motion: crossfade */
          <>
            <img
              src="/assets/passport/cover.png"
              alt="Spilt Social passport cover"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: turned ? 0 : 1,
                transition: "opacity 500ms var(--ease-spilt)",
                boxShadow: "0 18px 40px rgba(42,38,32,0.18)",
              }}
            />
            <IdPage visible={turned} />
          </>
        ) : (
          <>
            <IdPage visible={true} />
            <div
              className="absolute inset-0"
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "left center",
                transform: turned ? "rotateY(-165deg)" : "rotateY(0deg)",
                transition: "transform 800ms var(--ease-spilt)",
              }}
            >
              <img
                src="/assets/passport/cover.png"
                alt="Spilt Social passport cover"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  backfaceVisibility: "hidden",
                  boxShadow: "0 18px 40px rgba(42,38,32,0.18)",
                }}
              />
              {/* back of the cover — guilloche paper */}
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  backgroundImage: "url(/assets/passport/spread.png)",
                  backgroundSize: "cover",
                }}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function IdPage({ visible }: { visible: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col justify-end p-6"
      style={{
        backgroundImage: "url(/assets/passport/spread.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 500ms var(--ease-spilt)",
        boxShadow: "0 12px 32px rgba(42,38,32,0.14)",
        color: CHARCOAL,
      }}
    >
      <p className="text-[10px] tracking-[0.24em] uppercase opacity-70">
        Spilt Social — Social Passport
      </p>
      <div className="mt-3 space-y-1 text-[13px] leading-relaxed">
        <p>
          <span className="opacity-55">Bearer:</span> You
        </p>
        <p>
          <span className="opacity-55">Issued:</span> Columbus, OH
        </p>
        <p>
          <span className="opacity-55">Expires:</span> Never, if you use it.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function PassportContent() {
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
  const venuesRef = useRef<HTMLElement>(null);
  const earnedRef = useRef(earned);
  earnedRef.current = earned;

  /* load persisted stamps (session-scoped) */
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

  /* section stamps via IntersectionObserver (>=60% viewed) */
  useEffect(() => {
    if (!loaded) return;
    const targets: [React.RefObject<HTMLElement | null>, string][] = [
      [manifestoRef, "manifesto"],
      [venuesRef, "venues"],
    ];
    const observers = targets.map(([ref, id]) => {
      const el = ref.current;
      if (!el) return null;
      const io = new IntersectionObserver(
        ([e]) => {
          // "60% viewed": 60% of the section on screen, or — for sections
          // taller than the viewport — the section filling 60% of it
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

  /* modal esc */
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

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

  return (
    <div
      className="min-h-dvh font-passport"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* ── 1 · nav ───────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: CREAM, borderColor: HAIRLINE }}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <a
            href="/passport"
            onClick={fakeClick}
            className="cursor-pointer text-[15px] font-semibold tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: CHARCOAL, outlineColor: GOLD }}
          >
            SPILT SOCIAL
          </a>
          <div className="hidden items-center gap-8 text-[13px] md:flex">
            {["Membership", "Experiences", "What's On", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                onClick={fakeClick}
                className="cursor-pointer transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: CHARCOAL, outlineColor: GOLD }}
              >
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#"
              onClick={fakeClick}
              className="hidden cursor-pointer text-[13px] transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 sm:inline"
              style={{ color: CHARCOAL, outlineColor: GOLD }}
            >
              Sign in
            </a>
            <GoldButton onClick={() => toast()} className="px-5 py-2.5">
              Apply
            </GoldButton>
          </div>
        </nav>
      </header>

      {/* ── 2 · hero ──────────────────────────────────────── */}
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
        {/* subtle bottom scrim */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5"
          style={{
            background: "linear-gradient(to top, rgba(20,17,13,0.62), transparent)",
          }}
        />
        <div className="absolute right-0 bottom-0 left-0 flex flex-col gap-5 p-6 pb-28 sm:flex-row sm:items-end sm:justify-between sm:p-10 sm:pb-28">
          <div>
            <h1 className="max-w-2xl text-3xl leading-tight font-medium text-white sm:text-5xl">
              A home for the people building Columbus.
            </h1>
            <div className="mt-6">
              <GoldButton onClick={() => toast()} className="px-6 py-3">
                Apply for membership
              </GoldButton>
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

      {/* ── 3 · passport interlude ────────────────────────── */}
      <Interlude reduced={reduced} />

      {/* ── 4 · manifesto ─────────────────────────────────── */}
      <section
        id="manifesto"
        ref={manifestoRef}
        className="mx-auto max-w-3xl px-6 pb-28 text-center sm:pb-36"
      >
        <h2 className="text-3xl leading-snug font-medium sm:text-4xl">
          Membership unlocks the rooms of Columbus.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed opacity-80">
          Founders, operators, and remarkable people — connected on purpose. We
          book the venues, build the guest list, and make the introductions.
        </p>
        <dl className="mt-12 flex items-start justify-center gap-10 sm:gap-16">
          {[
            ["2", "cities"],
            ["12+", "venues"],
            ["100s", "events a year"],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="sr-only">{l}</dt>
              <dd className="text-3xl font-medium" style={{ color: GOLD }}>
                {n}
              </dd>
              <dd className="mt-1 text-[12px] tracking-[0.14em] uppercase opacity-60">
                {l}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-12">
          <GoldButton onClick={() => toast()} className="px-6 py-3">
            Apply
          </GoldButton>
        </div>
      </section>

      {/* ── 5 · venues ────────────────────────────────────── */}
      <section id="venues" ref={venuesRef} className="mx-auto max-w-7xl px-6 pb-28">
        <h2 className="mb-10 text-3xl font-medium">The rooms.</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* real photo tile — drop future venue photos alongside as
              /assets/passport/venues/<slug>.png and swap tiles below */}
          <figure className="group">
            <div className="aspect-[3/4] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/passport/venue.png"
                alt="Prim on 5th, Cincinnati — dining room set for a Spilt Social evening"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <figcaption className="mt-3 text-[14px] italic opacity-75">
              Prim on 5th, Cincinnati
            </figcaption>
          </figure>
          {/* typographic tiles — intentional set until photography lands */}
          {[
            ["Ohio Statehouse", "Columbus"],
            ["The Loom", "Columbus"],
            ["Huntington Park", "Columbus"],
          ].map(([name, city]) => (
            <div key={name} className="flex flex-col">
              <div
                className="flex aspect-[3/4] flex-col items-center justify-center gap-5 border px-6 text-center"
                style={{ borderColor: GOLD, backgroundColor: "#FFFDF8" }}
              >
                <span className="text-[13px] font-medium tracking-[0.22em] uppercase">
                  {name}
                </span>
                <span className="h-px w-10" style={{ backgroundColor: GOLD }} aria-hidden />
              </div>
              <p className="mt-3 text-[14px] italic opacity-75">
                {name}, {city}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6 · what's on ─────────────────────────────────── */}
      <section id="whats-on" className="mx-auto max-w-5xl px-6 pb-28">
        <h2 className="mb-10 text-3xl font-medium">What&apos;s on.</h2>
        <div className="flex flex-col gap-4">
          {EVENTS.map((ev, i) => {
            const stampDef = STAMPS[2 + i];
            return (
              <article
                key={ev.name}
                onPointerEnter={(e) => earn(stampDef.id, e.currentTarget)}
                onClick={(e) => earn(stampDef.id, e.currentTarget)}
                className="flex items-center gap-5 border px-5 py-5 transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(42,38,32,0.08)] sm:gap-8 sm:px-7"
                style={{ borderColor: HAIRLINE, backgroundColor: "#FFFDF8" }}
              >
                <div className="w-16 shrink-0 text-center">
                  <p className="text-2xl font-medium" style={{ color: GOLD }}>
                    {ev.date.split("/")[1]}
                  </p>
                  <p className="text-[11px] tracking-[0.16em] uppercase opacity-60">
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][
                      parseInt(ev.date.split("/")[0], 10) - 1
                    ]}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-medium">{ev.name}</h3>
                  <p className="mt-1 text-[13px] opacity-70">
                    {ev.venue}, {ev.city} · {ev.time}
                  </p>
                </div>
                <div className="hidden shrink-0 sm:block" aria-hidden>
                  <Stamp def={stampDef} size={44} className={earned.has(stampDef.id) ? "" : "opacity-25"} />
                </div>
                <GoldButton ghost onClick={() => toast()} className="shrink-0 px-5 py-2.5">
                  RSVP
                </GoldButton>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── 7 · featured banner ───────────────────────────── */}
      <section style={{ backgroundColor: GOLD }}>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
          <p className="text-xl font-medium" style={{ color: CHARCOAL }}>
            Founders Fair — 100 founders. One day. Get your stamp.
          </p>
          <a
            href="#"
            onClick={fakeClick}
            className="cursor-pointer text-[14px] font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: CHARCOAL, outlineColor: CHARCOAL }}
          >
            Find out more
          </a>
        </div>
      </section>

      {/* ── 8 · subscribe ─────────────────────────────────── */}
      <section id="subscribe" className="mx-auto max-w-2xl px-6 py-28 text-center">
        <h2 className="text-2xl font-medium sm:text-3xl">
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
            <GoldButton type="submit" className="shrink-0 px-6 py-3">
              Subscribe
            </GoldButton>
          </form>
        )}
      </section>

      {/* ── 9 · mega footer ───────────────────────────────── */}
      <footer className="border-t" style={{ borderColor: HAIRLINE, backgroundColor: "#F4EEE2" }}>
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Club", ["About", "The rooms", "House rules", "Careers"]],
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

      {/* ── passport widget (bottom-left) ──────────────────── */}
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

      {/* ── stamp earn overlay ─────────────────────────────── */}
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

      {/* ── passport modal ─────────────────────────────────── */}
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
            {/* two-page spread; stamps double as a site map */}
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
                          className="flex h-[84px] w-[84px] items-center justify-center rounded-full border border-dashed text-center text-[9px] leading-tight tracking-[0.12em] uppercase opacity-45"
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
                <GoldButton onClick={() => toast()} className="px-5 py-2.5">
                  Apply
                </GoldButton>
              </div>
            )}
          </div>
        </div>
      )}

      <ToastHost className="pointer-events-auto border px-5 py-3 text-[13px] [border-color:#C69D6055] bg-[#2A2620] text-[#FAF6EE]" />
    </div>
  );
}
