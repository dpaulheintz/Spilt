"use client";

import { useState } from "react";
import { BRAND, EVENTS, EVENTS_GATE_LINE } from "@/lib/brand";
import { toast } from "@/lib/toast";
import ToastHost from "@/components/ToastHost";
import PixelHero from "./PixelHero";
import DerezHeading from "./DerezHeading";

/* Spilt's actual brand: ivory on warm ink, gold for accents + motion */
const INK = "#0B0A08";
const IVORY = "#F2EDE3";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";

const NAV_LINKS = ["Index", "Events", "Membership", "Contact"];
const MANIFESTO = [
  "We manufacture luck.",
  "No name tags. No pitch decks. No small talk.",
  "Columbus is early. That's the point.",
];

function fakeClick(e: React.MouseEvent) {
  e.preventDefault();
  toast();
}

/* solid gold CTA: ink text, fills to highlight gold on hover */
function GoldButton({
  children,
  onClick,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`cursor-pointer font-mono text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${className ?? ""}`}
      style={{ backgroundColor: GOLD, color: INK, outlineColor: IVORY }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = GOLD_HI;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = GOLD;
      }}
    >
      {children}
    </button>
  );
}

export default function PixelContent() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-dvh" style={{ backgroundColor: INK, color: IVORY }}>
      {/* ── nav ──────────────────────────────────────────── */}
      <header className="absolute inset-x-0 top-0 z-20">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a
            href="/pixel"
            onClick={fakeClick}
            className="font-italiana cursor-pointer text-xl tracking-[0.08em] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: IVORY, outlineColor: GOLD }}
          >
            SPILT SOCIAL
          </a>
          <div className="flex items-center gap-5 sm:gap-7">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link}
                href="#"
                onClick={fakeClick}
                className={`cursor-pointer font-mono text-[11px] tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  i > 1 ? "hidden sm:inline" : ""
                }`}
                style={{
                  color: i === 0 ? GOLD : IVORY,
                  outlineColor: GOLD,
                }}
              >
                {link}
              </a>
            ))}
            <GoldButton onClick={() => toast()} className="px-4 py-2">
              Apply
            </GoldButton>
          </div>
        </nav>
      </header>

      {/* ── hero ─────────────────────────────────────────── */}
      <PixelHero
        eyebrow="A private social club · Columbus Ohio"
        subline="Serendipity is a system."
      />

      {/* ── manifesto ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-28 sm:py-40">
        <p
          className="mb-14 font-mono text-[11px] tracking-[0.3em] uppercase"
          style={{ color: IVORY, opacity: 0.55 }}
        >
          01 / Manifesto
        </p>
        <div className="flex flex-col gap-14 sm:gap-20">
          {MANIFESTO.map((line, i) => (
            <DerezHeading
              key={line}
              text={line}
              delay={i * 120}
              className="font-italiana text-3xl leading-snug sm:text-5xl lg:text-6xl"
            />
          ))}
        </div>
      </section>

      {/* ── events ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p
          className="mb-3 font-mono text-[11px] tracking-[0.3em] uppercase"
          style={{ color: IVORY, opacity: 0.55 }}
        >
          02 / Events
        </p>
        <DerezHeading
          text={EVENTS_GATE_LINE}
          className="font-italiana mb-12 text-3xl sm:text-4xl"
        />
        <div
          className="overflow-x-auto border font-mono text-xs sm:text-sm"
          style={{ borderColor: `${IVORY}55` }}
        >
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr
                className="text-left text-[10px] tracking-[0.25em] uppercase"
                style={{ borderBottom: `1px solid ${IVORY}55` }}
              >
                <th className="px-4 py-3 font-normal opacity-60">Date</th>
                <th className="px-4 py-3 font-normal opacity-60">Event</th>
                <th className="px-4 py-3 font-normal opacity-60">Venue</th>
                <th className="px-4 py-3 font-normal opacity-60">Time</th>
                <th className="px-4 py-3 font-normal opacity-60" />
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((ev) => (
                <tr
                  key={ev.name}
                  className="group cursor-default transition-colors duration-200"
                  style={{ borderBottom: `1px solid ${IVORY}55` }}
                  onMouseEnter={(e) => {
                    /* row hover inverts to gold-on-ink */
                    e.currentTarget.style.color = GOLD;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = IVORY;
                  }}
                >
                  <td className="px-4 py-4 whitespace-nowrap">{ev.date}</td>
                  <td className="px-4 py-4 font-bold uppercase">{ev.name}</td>
                  <td className="px-4 py-4">
                    {ev.venue}, {ev.city}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{ev.time}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => toast()}
                      className="cursor-pointer border px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors duration-150 group-hover:border-current focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        borderColor: `${IVORY}88`,
                        color: "inherit",
                        outlineColor: GOLD,
                      }}
                    >
                      RSVP →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── membership ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
        <p
          className="mb-3 font-mono text-[11px] tracking-[0.3em] uppercase"
          style={{ color: IVORY, opacity: 0.55 }}
        >
          03 / Membership
        </p>
        {sent ? (
          <div aria-live="polite">
            <p className="font-italiana mb-4 text-4xl sm:text-6xl" style={{ color: GOLD_HI }}>
              Received.
              <span className="animate-pulse font-mono" aria-hidden>
                _
              </span>
            </p>
            <p className="font-mono text-sm" style={{ opacity: 0.7 }}>
              You&apos;re on the list for Spring 2026. We&apos;ll find you.
            </p>
          </div>
        ) : (
          <>
            <DerezHeading
              text={BRAND.membership}
              className="font-italiana mb-10 max-w-3xl text-3xl leading-snug sm:text-5xl"
            />
            <form
              className="flex max-w-xl flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (/.+@.+\..+/.test(email)) setSent(true);
                else toast("Enter a real email — we check.");
              }}
            >
              <label htmlFor="pixel-email" className="sr-only">
                Email address
              </label>
              <input
                id="pixel-email"
                type="email"
                required
                placeholder="you@yourthing.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border bg-transparent px-4 py-3 font-mono text-sm placeholder:opacity-40 focus:outline-2 focus:outline-offset-2"
                style={{ borderColor: `${IVORY}88`, color: IVORY, outlineColor: GOLD }}
              />
              <GoldButton type="submit" className="px-6 py-3">
                Request Invite
              </GoldButton>
            </form>
          </>
        )}
      </section>

      {/* ── footer ───────────────────────────────────────── */}
      <footer
        className="border-t"
        style={{ borderColor: `${IVORY}40` }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 pb-28 font-mono text-[11px] tracking-[0.15em] uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>{BRAND.contact}</span>
          <span className="flex gap-5">
            {["Instagram", "X", "LinkedIn"].map((s) => (
              <a
                key={s}
                href="#"
                onClick={fakeClick}
                className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: GOLD }}
              >
                {s}
              </a>
            ))}
          </span>
          <span style={{ opacity: 0.55 }}>
            © 2026 Spilt Social · Concept 1 of 5
          </span>
        </div>
      </footer>

      <ToastHost className="pointer-events-auto border px-5 py-3 font-mono text-xs tracking-wider [border-color:#0B0A0840] bg-[#F2EDE3] text-[#0B0A08]" />
    </div>
  );
}
