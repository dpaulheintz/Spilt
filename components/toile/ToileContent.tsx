"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND, EVENTS } from "@/lib/brand";
import { toast } from "@/lib/toast";
import ToastHost from "@/components/ToastHost";
import Reveal from "@/components/Reveal";

/* palette — this page only */
const CREAM = "#F5E1C4";
const COBALT = "#16276B";
const DEEP = "#0E1B4D";
const IVORY = "#F2EDE3";

const HERO_SRC = "/assets/toile-hero.png";
const ROMAN = ["I", "II", "III", "IV"];
const STAMP_TOAST = "Noted. The full build takes reservations.";

function fakeClick(e: React.MouseEvent) {
  e.preventDefault();
  toast(STAMP_TOAST);
}

/* ── ornament: thin double rule with centered diamond ─────── */
function Fleuron() {
  return (
    <div className="mx-auto flex w-full max-w-xs items-center gap-3" aria-hidden>
      <span className="h-px flex-1" style={{ backgroundColor: COBALT }} />
      <svg width="10" height="10" viewBox="0 0 10 10">
        <rect
          x="2.2"
          y="2.2"
          width="5.6"
          height="5.6"
          transform="rotate(45 5 5)"
          fill={COBALT}
        />
      </svg>
      <span className="h-px flex-1" style={{ backgroundColor: COBALT }} />
    </div>
  );
}

/* ── engraved coupe glass; liquid fills on plate hover ────── */
function Coupe() {
  return (
    <svg
      width="26"
      height="34"
      viewBox="0 0 26 34"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* liquid — scales up on .plate:hover via CSS */}
      <path
        className="coupe-fill"
        d="M4.5 6 H21.5 C21 10 17.5 12.5 13 12.5 C8.5 12.5 5 10 4.5 6 Z"
        fill={COBALT}
        style={{
          transformOrigin: "13px 12px",
          transform: "scaleY(0)",
          transition: "transform 500ms var(--ease-spilt)",
        }}
      />
      {/* bowl */}
      <path
        d="M3.5 5 H22.5 C22 10.5 18 13.5 13 13.5 C8 13.5 4 10.5 3.5 5 Z"
        stroke={COBALT}
        strokeWidth="1.2"
      />
      {/* stem + foot */}
      <line x1="13" y1="13.5" x2="13" y2="28" stroke={COBALT} strokeWidth="1.2" />
      <line x1="6" y1="30" x2="20" y2="30" stroke={COBALT} strokeWidth="1.2" />
      <line x1="13" y1="28" x2="6" y2="30" stroke={COBALT} strokeWidth="0.8" />
      <line x1="13" y1="28" x2="20" y2="30" stroke={COBALT} strokeWidth="0.8" />
    </svg>
  );
}

/* ── social dot (circle per approved mockup) ──────────────── */
function SocialDot({ label, path }: { label: string; path: string }) {
  return (
    <a
      href="#"
      onClick={fakeClick}
      aria-label={label}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ backgroundColor: DEEP, outlineColor: DEEP }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={CREAM} aria-hidden>
        <path d={path} />
      </svg>
    </a>
  );
}

const SOCIAL = [
  {
    label: "X",
    path: "M18.9 1.2h3.7l-8.1 9.3L24 22.8h-7.5l-5.9-7.7-6.7 7.7H.2l8.7-9.9L0 1.2h7.7l5.3 7 6-7z",
  },
  {
    label: "LinkedIn",
    path: "M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.1h4.56V23H.22V8.1zM8.4 8.1h4.37v2.03h.06c.61-1.15 2.1-2.37 4.32-2.37 4.62 0 5.47 3.04 5.47 7v8.24h-4.55v-7.3c0-1.74-.03-3.99-2.43-3.99-2.44 0-2.81 1.9-2.81 3.86V23H8.4V8.1z",
  },
  {
    label: "Instagram",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.15A3.99 3.99 0 1 1 16 12a3.99 3.99 0 0 1-4 3.99zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z",
  },
];

export default function ToileContent() {
  const [email, setEmail] = useState("");
  const [inscribed, setInscribed] = useState(false);
  const heroImgRef = useRef<HTMLDivElement>(null);

  /* barely-perceptible parallax, ≤10px */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = heroImgRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const dx = (e.clientX / window.innerWidth - 0.5) * -10;
        const dy = (e.clientY / window.innerHeight - 0.5) * -6;
        el.style.transform = `scale(1.03) translate(${dx}px, ${dy}px)`;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const h1 = "FILL YOUR CUP.";
  const letterCount = h1.length;
  const afterLetters = 60 * letterCount + 250;

  return (
    <div
      className="min-h-dvh font-toile-body"
      style={{ backgroundColor: CREAM, color: COBALT }}
    >
      {/* ── nav: links · CINZEL MARK · links ───────────────── */}
      <header className="absolute inset-x-0 top-0 z-20">
        <nav className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 px-6 py-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="hidden justify-end gap-7 text-[12px] tracking-[0.18em] uppercase md:flex">
            {["Home", "Events", "About"].map((l, i) => (
              <a
                key={l}
                href="#"
                onClick={fakeClick}
                className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  color: COBALT,
                  outlineColor: COBALT,
                  borderBottom: i === 0 ? `1px solid ${COBALT}` : "none",
                  paddingBottom: 2,
                }}
              >
                {l}
              </a>
            ))}
          </div>
          <a
            href="/toile"
            onClick={fakeClick}
            className="font-toile-display cursor-pointer justify-self-center px-6 text-lg font-bold tracking-[0.14em] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: COBALT, outlineColor: COBALT }}
          >
            SPILT SOCIAL
          </a>
          <div className="hidden gap-7 text-[12px] tracking-[0.18em] uppercase md:flex">
            {["Membership", "Experiences", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                onClick={fakeClick}
                className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: COBALT, outlineColor: COBALT }}
              >
                {l}
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* ── hero: full-bleed engraving, copy in sky window ─── */}
      <section
        className="relative overflow-hidden"
        style={{ height: "100dvh", minHeight: 620 }}
      >
        <div ref={heroImgRef} className="absolute inset-0 will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_SRC}
            alt="Cobalt copperplate engraving of Columbus: dense toile trees, the LeVeque tower, the Statehouse, statues raising coupes"
            className="h-full w-full object-cover object-[62%_0%] md:object-[center_top]"
          />
        </div>

        {/* copy block in the clear sky right of the tower */}
        <div className="absolute inset-0 z-10 flex items-start justify-center sm:justify-end">
          <div className="mt-[15dvh] flex w-full max-w-lg flex-col items-center px-6 text-center sm:mr-[8vw] lg:mr-[15vw]">
            <p
              className="mb-6 text-[12px] tracking-[0.3em] uppercase"
              style={{
                color: COBALT,
                opacity: 0,
                animation: `toile-rise 800ms var(--ease-spilt) ${afterLetters}ms forwards`,
              }}
            >
              A Private Social Club · Columbus, Ohio
            </p>
            <h1
              className="font-toile-display mb-8 text-5xl leading-[1.08] font-bold tracking-[0.1em] sm:text-6xl lg:text-7xl"
              style={{ color: COBALT }}
              aria-label={h1}
            >
              <span aria-hidden>
                {["FILL YOUR", "CUP."].map((line, li) => (
                  <span key={li} className="block whitespace-nowrap">
                    {line.split("").map((c, i) => {
                      const idx = li * 10 + i;
                      return (
                        <span
                          key={i}
                          className="inline-block"
                          style={{
                            opacity: 0,
                            animation: `toile-rise 600ms var(--ease-spilt) ${idx * 60}ms forwards`,
                          }}
                        >
                          {c === " " ? "\u00A0" : c}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </span>
            </h1>
            <p
              className="mb-10 max-w-md text-[15px] leading-relaxed"
              style={{
                color: COBALT,
                opacity: 0,
                animation: `toile-rise 800ms var(--ease-spilt) ${afterLetters + 100}ms forwards`,
              }}
            >
              The rooms where Columbus actually gets built. Founders, operators,
              and remarkable people — connected on purpose.
            </p>
            <div
              style={{
                opacity: 0,
                animation: `toile-rise 800ms var(--ease-spilt) ${afterLetters + 200}ms forwards`,
              }}
              className="flex flex-col items-center gap-6"
            >
              <button
                type="button"
                onClick={() => toast(STAMP_TOAST)}
                className="cursor-pointer px-10 py-4 text-[12px] tracking-[0.25em] uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: DEEP,
                  color: CREAM,
                  outlineColor: DEEP,
                }}
              >
                Apply for Membership
              </button>
              <div className="flex gap-3">
                {SOCIAL.map((s) => (
                  <SocialDot key={s.label} label={s.label} path={s.path} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── section 2: the club ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <Reveal>
          <p className="mb-3 text-center text-[11px] tracking-[0.3em] uppercase opacity-70">
            № I
          </p>
          <h2 className="font-toile-display mb-6 text-center text-3xl font-bold tracking-[0.1em] sm:text-4xl">
            THE CLUB
          </h2>
          <Fleuron />
        </Reveal>
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-[16px] leading-[1.9]" style={{ color: COBALT }}>
              <span
                className="font-toile-display float-left mt-1 mr-3 text-[64px] leading-[0.8] font-bold"
                aria-hidden
              >
                S
              </span>
              erendipity is a system. Behind these gates, the introductions are
              deliberate, the rooms are curated, and the conversations compound.
              These are the rooms where Columbus actually gets built — founders
              beside operators, capital beside craft, each glass raised to the
              next introduction. We simply set the table; the city does the
              rest.
            </p>
            <p className="mt-6 text-[16px] leading-[1.9] italic" style={{ color: COBALT }}>
              Columbus is early. That&apos;s the point.
            </p>
          </Reveal>
          <Reveal delay={150}>
            {/* framed detail crop: double cobalt rule + generous mat */}
            <div
              className="border p-2"
              style={{ borderColor: COBALT }}
            >
              <div
                className="border p-6 sm:p-8"
                style={{ borderColor: COBALT, backgroundColor: IVORY }}
              >
                {/* detail crop: the statue raising the coupe, right side */}
                <div className="h-72 w-full overflow-hidden sm:h-80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={HERO_SRC}
                    alt="Detail of the engraving: a statue raising a coupe among the toile trees"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "96% 68%", transform: "scale(1.9)", transformOrigin: "96% 68%" }}
                  />
                </div>
                <p className="mt-4 text-center text-[11px] tracking-[0.25em] uppercase opacity-70">
                  The Toast — detail, plate II
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── section 3: events as engraved plates ───────────── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <p className="mb-3 text-center text-[11px] tracking-[0.3em] uppercase opacity-70">
            № II
          </p>
          <h2 className="font-toile-display mb-6 text-center text-3xl font-bold tracking-[0.1em] sm:text-4xl">
            THE CALENDAR
          </h2>
          <Fleuron />
        </Reveal>
        <div className="mt-16 flex flex-col">
          {EVENTS.map((ev, i) => (
            <Reveal key={ev.name} delay={i * 100}>
              <div className="plate group relative grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 py-7 sm:grid-cols-[72px_110px_1fr_auto_auto] sm:gap-x-8">
                {/* double rules top+bottom; ink-in overlay on hover */}
                <span className="toile-rule absolute top-0 left-0 h-px w-full opacity-30" />
                <span className="toile-rule absolute top-[3px] left-0 h-px w-full opacity-30" />
                <span className="toile-rule-ink absolute top-0 left-0 h-px w-full" />
                <span className="toile-rule-ink absolute top-[3px] left-0 h-px w-full" />
                {i === EVENTS.length - 1 && (
                  <>
                    <span className="toile-rule absolute bottom-0 left-0 h-px w-full opacity-30" />
                    <span className="toile-rule absolute bottom-[3px] left-0 h-px w-full opacity-30" />
                    <span className="toile-rule-ink absolute bottom-0 left-0 h-px w-full" />
                    <span className="toile-rule-ink absolute bottom-[3px] left-0 h-px w-full" />
                  </>
                )}

                <span className="font-toile-display text-sm font-bold tracking-[0.15em]">
                  No. {ROMAN[i]}
                </span>
                <span className="text-[12px] tracking-[0.2em] uppercase">
                  {ev.date} · {ev.time}
                </span>
                <span className="font-toile-display col-span-3 text-xl font-bold tracking-[0.08em] sm:col-span-1 sm:text-2xl">
                  {ev.name.toUpperCase()}
                </span>
                <span className="col-span-2 text-[14px] italic opacity-80 sm:col-span-1">
                  {ev.venue}, {ev.city}
                </span>
                <span className="flex items-center gap-4 justify-self-end">
                  <Coupe />
                  <button
                    type="button"
                    onClick={() => toast(STAMP_TOAST)}
                    className="cursor-pointer border px-4 py-2 text-[11px] tracking-[0.25em] uppercase transition-colors duration-300 hover:text-[--cream] focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ borderColor: COBALT, color: COBALT, outlineColor: COBALT }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = DEEP;
                      e.currentTarget.style.color = CREAM;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COBALT;
                    }}
                  >
                    RSVP
                  </button>
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── section 4: membership ──────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-24 sm:py-32 text-center">
        <Reveal>
          <p className="mb-3 text-[11px] tracking-[0.3em] uppercase opacity-70">
            № III
          </p>
          <h2 className="font-toile-display mb-6 text-2xl leading-snug font-bold tracking-[0.1em] sm:text-3xl">
            ACCEPTING MEMBERS
            <br />
            SPRING MMXXVI.
          </h2>
          <Fleuron />
          <form
            className="mx-auto mt-14 flex max-w-md items-end gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (inscribed) return;
              if (/.+@.+\..+/.test(email)) {
                setInscribed(true);
                setEmail("Inscribed.");
              } else {
                toast(STAMP_TOAST);
              }
            }}
          >
            <label htmlFor="toile-email" className="sr-only">
              Email address
            </label>
            <input
              id="toile-email"
              type={inscribed ? "text" : "email"}
              required
              readOnly={inscribed}
              placeholder="your@correspondence.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-toile-display flex-1 bg-transparent pb-2 text-center text-base tracking-[0.12em] placeholder:tracking-[0.15em] placeholder:opacity-40 focus:outline-none"
              style={{
                borderBottom: `1px solid ${COBALT}`,
                color: COBALT,
                fontStyle: inscribed ? "normal" : undefined,
              }}
            />
            {!inscribed && (
              <button
                type="submit"
                className="cursor-pointer pb-2 text-[12px] tracking-[0.25em] uppercase transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: COBALT, outlineColor: COBALT }}
              >
                Inscribe
              </button>
            )}
          </form>
          {inscribed && (
            <p
              aria-live="polite"
              className="mt-6 text-[12px] tracking-[0.25em] uppercase opacity-70"
            >
              Your name is in the ledger.
            </p>
          )}
        </Reveal>
      </section>

      {/* ── footer ─────────────────────────────────────────── */}
      <footer className="mx-auto max-w-6xl px-6 pb-28">
        <div className="h-px w-full" style={{ backgroundColor: COBALT }} />
        <div className="flex flex-col items-center gap-3 pt-8 text-center text-[11px] tracking-[0.25em] uppercase sm:flex-row sm:justify-between sm:text-left">
          <span>{BRAND.contact}</span>
          <span className="opacity-70">
            Plate II of V — Spilt Social Concepts
          </span>
          <span className="opacity-70">© MMXXVI Spilt Social</span>
        </div>
      </footer>

      <ToastHost className="pointer-events-auto -rotate-2 border-2 px-6 py-3 text-[12px] tracking-[0.22em] uppercase [border-color:#16276B] bg-[#F2EDE3] text-[#16276B]" />

    </div>
  );
}
