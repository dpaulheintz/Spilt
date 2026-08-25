"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND, EVENTS } from "@/lib/brand";
import { toast } from "@/lib/toast";
import ToastHost from "@/components/ToastHost";

/* palette — this page only */
const CREAM = "#F5E1C4";
const COBALT = "#16276B";
const RED = "#C13B2A"; // ticker + one CTA only

const TICKER =
  "SPILT SOCIAL — TRANSMITTING FROM COLUMBUS OH — MEMBERS SPRING 2026 — THE FUTURE SHOWS UP HERE FIRST — ";

function fakeClick(e: React.MouseEvent) {
  e.preventDefault();
  toast(">> LINK QUEUED — FULL BUILD PENDING");
}

/* ── scroll-driven: slide in horizontally 40px ─────────────── */
function SlideIn({
  children,
  from = "left",
  className,
}: {
  children: React.ReactNode;
  from?: "left" | "right";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView
          ? "translateX(0)"
          : `translateX(${from === "left" ? -40 : 40}px)`,
        transition:
          "opacity 600ms var(--ease-spilt), transform 600ms var(--ease-spilt)",
      }}
    >
      {children}
    </div>
  );
}

/* ── image reveal: cobalt bar wipes across, 500ms ──────────── */
function WipeImage({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`block h-full w-full object-cover ${imgClassName ?? ""}`}
        style={{
          clipPath: inView ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          transition: "clip-path 500ms var(--ease-spilt)",
        }}
      />
      {/* the sweeping cobalt bar */}
      <span
        aria-hidden
        className="absolute inset-y-0 w-full"
        style={{
          backgroundColor: COBALT,
          transform: inView ? "translateX(101%)" : "translateX(-100%)",
          transition: "transform 500ms var(--ease-spilt)",
        }}
      />
    </div>
  );
}

export default function DitherContent() {
  const [email, setEmail] = useState("");
  const [received, setReceived] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      className="min-h-dvh"
      style={{ backgroundColor: CREAM, color: COBALT }}
    >
      {/* ── top ticker ─────────────────────────────────────── */}
      <div
        className="overflow-hidden border-y py-1.5"
        style={{ borderColor: COBALT }}
        aria-label={TICKER}
      >
        <div className="dither-marquee flex w-max" aria-hidden>
          {[0, 1].map((k) => (
            <span
              key={k}
              className="font-mono text-[11px] font-bold tracking-[0.18em] whitespace-nowrap"
              style={{ color: RED }}
            >
              {TICKER + TICKER}
            </span>
          ))}
        </div>
      </div>

      {/* ── nav ────────────────────────────────────────────── */}
      <header className="border-b-2" style={{ borderColor: COBALT }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <a
            href="/dither"
            onClick={fakeClick}
            className="font-dither cursor-pointer text-lg tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: COBALT, outlineColor: COBALT }}
          >
            Spilt Social
          </a>
          <div className="hidden gap-6 font-mono text-[11px] tracking-[0.15em] uppercase sm:flex">
            {["Index", "Events", "Members", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                onClick={fakeClick}
                className="cursor-pointer hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: COBALT, outlineColor: COBALT, textUnderlineOffset: 4 }}
              >
                {l}
              </a>
            ))}
          </div>
          <span className="font-mono text-[11px] font-bold tracking-[0.15em]">
            CONCEPT 04/05
          </span>
        </nav>
      </header>

      {/* ── hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "88dvh" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/dither/hero.png"
          alt="Dithered transmission: a Columbus crowd under the skyline"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-10 flex min-h-[88dvh] flex-col items-center justify-center px-4 py-20">
          <h1
            className="dither-outline font-dither w-[92vw] text-center text-[17vw] leading-[0.9] uppercase sm:text-[15vw]"
            style={{ color: CREAM }}
          >
            GET IN
            <br />
            THE ROOM.
          </h1>
          <p
            className="mt-6 border px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase sm:text-[12px]"
            style={{ color: CREAM, backgroundColor: COBALT, borderColor: CREAM }}
          >
            A private social club — Columbus, Ohio — Est. 2023
          </p>
        </div>
      </section>

      {/* ── section 2: editorial grid ──────────────────────── */}
      <section className="border-t-2" style={{ borderColor: COBALT }}>
        <div className="mx-auto grid max-w-7xl items-stretch lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WipeImage
              src="/assets/dither/fig-01.png"
              alt="Dithered figure: the Statehouse during The Business Hop"
              className="h-full min-h-[320px]"
            />
            <div
              className="flex items-center justify-between border-y px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase"
              style={{ borderColor: COBALT }}
            >
              <span>FIG 01 — THE BUSINESS HOP / STATEHOUSE</span>
              <span>BAYER 8×8 · SCALE 3</span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-6 border-t-2 p-8 lg:border-t-0 lg:border-l-2 lg:p-12" style={{ borderColor: COBALT }}>
            <SlideIn from="right">
              <h2 className="font-dither text-4xl leading-[0.95] uppercase sm:text-5xl">
                We manu-
                <br />
                facture luck.
              </h2>
              <p className="mt-6 font-mono text-[13px] leading-relaxed">
                Serendipity is a system. We build the rooms, cut the guest
                list, and let compound interest do the rest. No name tags. No
                pitch decks. No small talk.
              </p>
            </SlideIn>
          </div>
        </div>
      </section>

      <section className="border-t-2" style={{ borderColor: COBALT }}>
        <div className="mx-auto grid max-w-7xl items-stretch lg:grid-cols-3">
          <div className="order-2 flex flex-col justify-center gap-6 border-t-2 p-8 lg:order-1 lg:border-t-0 lg:border-r-2 lg:p-12" style={{ borderColor: COBALT }}>
            <SlideIn from="left">
              <h2 className="font-dither text-4xl leading-[0.95] uppercase sm:text-5xl">
                Columbus is
                <br />
                early. That&apos;s
                <br />
                the point.
              </h2>
              <p className="mt-6 font-mono text-[13px] leading-relaxed">
                NYC energy, Midwest address. The future shows up here first —
                it just doesn&apos;t send a press release. Your network is the
                moat.
              </p>
            </SlideIn>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-2">
            <WipeImage
              src="/assets/dither/fig-02.png"
              alt="Dithered figure: The Loom during the Founders Fair"
              className="h-full min-h-[320px]"
            />
            <div
              className="flex items-center justify-between border-y px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase"
              style={{ borderColor: COBALT }}
            >
              <span>FIG 02 — FOUNDERS FAIR / THE LOOM</span>
              <span>BAYER 8×8 · SCALE 3</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── section 3: events index ────────────────────────── */}
      <section className="border-t-2" style={{ borderColor: COBALT }}>
        <div className="mx-auto max-w-7xl px-5 py-16">
          <SlideIn from="left">
            <h2 className="font-dither mb-2 text-5xl uppercase sm:text-7xl">
              The Index
            </h2>
            <p className="mb-10 font-mono text-[11px] tracking-[0.2em] uppercase">
              Want to see the future? — Q3/Q4 2026 transmissions
            </p>
          </SlideIn>
          <div className="border-t-2" style={{ borderColor: COBALT }}>
            {EVENTS.map((ev, i) => (
              <div
                key={ev.name}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="relative grid grid-cols-[44px_1fr_auto] items-center gap-x-4 overflow-hidden border-b-2 py-5 pr-2 pl-1 transition-colors duration-200 sm:grid-cols-[64px_130px_1.4fr_1fr_auto] sm:gap-x-6"
                style={{
                  borderColor: COBALT,
                  backgroundColor: hovered === i ? COBALT : "transparent",
                  color: hovered === i ? CREAM : COBALT,
                }}
              >
                <span
                  className="font-dither text-2xl sm:text-3xl"
                  style={{ color: hovered === i ? CREAM : RED }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[12px] tracking-[0.12em]">
                  {ev.date} · {ev.time}
                </span>
                <span className="font-dither col-span-3 text-xl uppercase sm:col-span-1 sm:text-2xl">
                  {ev.name}
                </span>
                <span className="col-span-2 font-mono text-[11px] tracking-[0.1em] uppercase opacity-80 sm:col-span-1">
                  {ev.venue} / {ev.city}
                </span>
                <button
                  type="button"
                  onClick={() => toast(">> RSVP QUEUED — FULL BUILD PENDING")}
                  className="z-10 col-start-3 row-start-1 cursor-pointer border-2 px-4 py-2 font-mono text-[11px] font-bold tracking-[0.18em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:col-start-5 sm:row-auto"
                  style={{
                    borderColor: hovered === i ? CREAM : COBALT,
                    color: hovered === i ? CREAM : COBALT,
                    outlineColor: RED,
                  }}
                >
                  RSVP
                </button>
                {/* dithered thumbnail slides in at row's right edge */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-0 right-24 bottom-0 hidden w-40 sm:block"
                  style={{
                    transform: hovered === i ? "translateX(0)" : "translateX(120%)",
                    opacity: hovered === i ? 1 : 0,
                    transition:
                      "transform 300ms var(--ease-spilt), opacity 300ms var(--ease-spilt)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={i % 2 === 0 ? "/assets/dither/fig-01.png" : "/assets/dither/fig-02.png"}
                    alt=""
                    className="h-full w-full border-l-2 object-cover"
                    style={{ borderColor: CREAM }}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── section 4: membership ──────────────────────────── */}
      <section
        className="relative overflow-hidden border-t-2"
        style={{ borderColor: COBALT }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/dither/band.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-5 py-24">
          <h2
            className="dither-outline-only font-dither text-center text-[16vw] leading-none uppercase sm:text-[11vw]"
            aria-label="Spring 2026"
          >
            SPRING 2026
          </h2>
          <p
            className="mt-4 mb-10 px-3 py-1 font-mono text-[11px] tracking-[0.22em] uppercase"
            style={{ backgroundColor: CREAM, color: COBALT }}
          >
            {BRAND.membership} Applications open now.
          </p>
          {received ? (
            <div
              aria-live="polite"
              className="border-2 px-10 py-5 font-mono text-sm font-bold tracking-[0.2em] uppercase"
              style={{ backgroundColor: RED, color: CREAM, borderColor: RED }}
            >
              SIGNAL RECEIVED
            </div>
          ) : (
            <form
              className="flex w-full max-w-lg border-2"
              style={{ borderColor: COBALT, backgroundColor: CREAM }}
              onSubmit={(e) => {
                e.preventDefault();
                if (/.+@.+\..+/.test(email)) setReceived(true);
                else toast(">> INVALID FREQUENCY — CHECK ADDRESS");
              }}
            >
              <label htmlFor="dither-email" className="sr-only">
                Email address
              </label>
              <input
                id="dither-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOUR@FREQUENCY.COM"
                className="w-full bg-transparent px-4 py-4 font-mono text-[13px] tracking-[0.1em] placeholder:opacity-40 focus:outline-none"
                style={{ color: COBALT }}
              />
              {/* the one red CTA */}
              <button
                type="submit"
                className="shrink-0 cursor-pointer px-6 font-mono text-[12px] font-bold tracking-[0.18em] uppercase focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: RED, color: CREAM, outlineColor: COBALT }}
              >
                Transmit
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── footer: masthead colophon ──────────────────────── */}
      <footer className="border-t-2" style={{ borderColor: COBALT }}>
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 pb-28 font-mono text-[10px] leading-[1.8] tracking-[0.12em] uppercase sm:grid-cols-3">
          <div>
            <span className="font-dither block text-xl normal-case">
              Spilt Social
            </span>
            Published irregularly from Columbus, Ohio.
            <br />
            All photography transmitted via Bayer 8×8
            <br />
            ordered dither. No grayscale survives.
          </div>
          <div>
            Correspondence: {BRAND.contact}
            <br />
            {["Instagram", "X", "LinkedIn"].map((s, i) => (
              <a
                key={s}
                href="#"
                onClick={fakeClick}
                className="cursor-pointer underline underline-offset-2 focus-visible:outline-2"
                style={{ outlineColor: COBALT }}
              >
                {s}
                {i < 2 ? " / " : ""}
              </a>
            ))}
          </div>
          <div className="sm:text-right">
            TRANSMISSION 4 OF 5
            <br />© 2026 SPILT SOCIAL · CONCEPT 4 OF 5
          </div>
        </div>
      </footer>

      <ToastHost className="pointer-events-auto border-2 px-5 py-3 font-mono text-[12px] font-bold tracking-[0.12em] [border-color:#F5E1C4] bg-[#16276B] text-[#F5E1C4]" />
    </div>
  );
}
