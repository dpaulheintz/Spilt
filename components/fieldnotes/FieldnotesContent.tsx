"use client";

import { useMemo, useState } from "react";
import { BRAND, EVENTS } from "@/lib/brand";
import { toast } from "@/lib/toast";
import ToastHost from "@/components/ToastHost";
import Typewriter from "./Typewriter";
import Plate, { type PlateSpec } from "./Plate";

const PAPER = "#F4EFE4";
const CARBON = "#1E1B16";
const BRICK = "#A34A2E";
const SLATE = "#3F5877";
const OCHRE = "#C08A3E";

const PLATES: PlateSpec[] = [
  { n: 1, location: "COLUMBUS", keywords: "hop / mentors / statehouse", stamp: "statehouse" },
  { n: 2, location: "COLUMBUS", keywords: "founders / fair / loom", stamp: "loom" },
  { n: 3, location: "COLUMBUS", keywords: "move / music / park", stamp: "park" },
  { n: 4, location: "CINCINNATI", keywords: "cincy / pour / prim", stamp: "prim" },
];

function fakeClick(e: React.MouseEvent) {
  e.preventDefault();
  toast();
}

/** seeded, subtle per-letter baseline wobble for headings */
function UnevenText({ text, className }: { text: string; className?: string }) {
  const spans = useMemo(
    () =>
      text.split("").map((c, i) => {
        // deterministic 0–1px offset, seeded by char index
        const y = ((i * 2654435761) % 100) / 100; // 0..1
        return (
          <span
            key={i}
            className="inline-block"
            style={{ transform: `translateY(${(y - 0.35) * 1.4}px)` }}
            aria-hidden
          >
            {c === " " ? " " : c}
          </span>
        );
      }),
    [text]
  );
  return (
    <span className={className} aria-label={text}>
      {spans}
    </span>
  );
}

/** red-ink stamp block that thunks in */
function Stamp({
  children,
  color = BRICK,
  show,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  show: boolean;
  className?: string;
}) {
  return (
    <div
      className={`font-typer inline-block border-[2.5px] px-5 py-2.5 text-[13px] font-bold tracking-[0.18em] uppercase ${className ?? ""}`}
      style={{
        color,
        borderColor: color,
        opacity: show ? 0.92 : 0,
        transform: show ? "scale(1) rotate(-2deg)" : "scale(1.15) rotate(-4deg)",
        transition: "opacity 250ms var(--ease-spilt), transform 250ms var(--ease-spilt)",
        textShadow: `0.4px 0.4px 0 ${color}55`,
        boxShadow: `inset 0 0 0 0.5px ${color}33`,
      }}
    >
      {children}
    </div>
  );
}

export default function FieldnotesContent() {
  const [heroStamp, setHeroStamp] = useState(false);
  const [received, setReceived] = useState<boolean[]>(EVENTS.map(() => false));
  const [email, setEmail] = useState("");
  const [filed, setFiled] = useState(false);

  return (
    <div
      className="fieldnotes-paper font-typer min-h-dvh"
      style={{ backgroundColor: PAPER, color: CARBON }}
    >
      {/* ── nav ──────────────────────────────────────────── */}
      <header className="border-t-2" style={{ borderColor: CARBON }}>
        <nav
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 border-b px-6 py-4"
          style={{ borderColor: `${CARBON}33` }}
        >
          <a
            href="/fieldnotes"
            onClick={fakeClick}
            className="cursor-pointer text-[13px] font-bold tracking-[0.14em] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: CARBON, outlineColor: BRICK }}
          >
            SPILT SOCIAL — FIELD NOTES
          </a>
          <div className="flex gap-5 text-[11px] tracking-[0.14em]">
            {["No. 01", "No. 02", "No. 03", "No. 04", "No. 05"].map((l, i) => (
              <a
                key={l}
                href="#"
                onClick={fakeClick}
                className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  color: i === 2 ? BRICK : CARBON,
                  outlineColor: BRICK,
                  textDecoration: i === 2 ? "underline" : "none",
                  textUnderlineOffset: 4,
                }}
              >
                {l}
              </a>
            ))}
          </div>
        </nav>
      </header>

      {/* ── hero: mostly paper, typed observation ──────────── */}
      <section className="mx-auto flex max-w-4xl flex-col items-start px-6 pt-28 pb-24 sm:pt-40 sm:pb-32">
        <Typewriter
          autoStart
          segments={[
            { text: "COLUMBUS, OHIO. Pop. 913,000. Notable: the people.", pauseAfter: 650 },
            { text: "Field observation No. 001 — serendipity is a system." },
          ]}
          className="min-h-[4.5em] text-lg leading-[2] sm:text-2xl"
          onDone={() => setTimeout(() => setHeroStamp(true), 400)}
        />
        <div className="mt-10 min-h-[52px]">
          <Stamp show={heroStamp}>Spilt Social · Est. 2023</Stamp>
        </div>
      </section>

      {/* ── section 2: the plates ──────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-2 text-[11px] tracking-[0.3em] uppercase" style={{ color: OCHRE }}>
          Section II
        </p>
        <h2 className="mb-14 text-xl font-bold sm:text-2xl">
          <UnevenText text="THE PLATES — EVIDENCE OF A SCENE" />
        </h2>
        <div className="flex flex-col gap-20">
          {PLATES.map((p, i) => (
            <div
              key={p.n}
              className={`w-full sm:w-[88%] ${i % 2 === 1 ? "sm:self-end" : "sm:self-start"}`}
            >
              <Plate spec={p} flip={i % 2 === 1} />
            </div>
          ))}
        </div>
      </section>

      {/* ── section 3: events ledger ───────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <p className="mb-2 text-[11px] tracking-[0.3em] uppercase" style={{ color: OCHRE }}>
          Section III
        </p>
        <h2 className="mb-10 text-xl font-bold sm:text-2xl">
          <UnevenText text="LOGBOOK — UPCOMING OBSERVATIONS" />
        </h2>
        <div className="fieldnotes-ruled">
          {EVENTS.map((ev, i) => (
            <div
              key={ev.name}
              className="grid grid-cols-[76px_1fr_auto] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[90px_1.2fr_1fr_auto] sm:gap-x-8"
            >
              <span className="text-[13px] font-bold" style={{ color: BRICK }}>
                {ev.date}
              </span>
              <span className="text-[14px] font-bold tracking-[0.04em] uppercase">
                {ev.name}
              </span>
              <span className="col-start-2 text-[12px] opacity-75 sm:col-start-3">
                {ev.venue}, {ev.city} — {ev.time}
              </span>
              <span className="relative col-start-3 row-start-1 sm:col-start-4 sm:row-auto">
                <button
                  type="button"
                  disabled={received[i]}
                  onClick={() => {
                    setReceived((r) => r.map((v, j) => (j === i ? true : v)));
                    toast();
                  }}
                  className={`border-2 px-4 py-2 text-[11px] font-bold tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    received[i] ? "cursor-default opacity-40" : "cursor-pointer hover:opacity-70"
                  }`}
                  style={{ borderColor: CARBON, color: CARBON, outlineColor: BRICK }}
                >
                  RSVP
                </button>
                <span
                  className="pointer-events-none absolute -top-2 -left-6"
                  aria-hidden={!received[i]}
                >
                  <Stamp show={received[i]} color={SLATE} className="!px-3 !py-1 !text-[11px]">
                    Received
                  </Stamp>
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── section 4: membership ──────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <p className="mb-2 text-[11px] tracking-[0.3em] uppercase" style={{ color: OCHRE }}>
          Section IV
        </p>
        <Typewriter
          segments={[
            { text: "Accepting members Spring 2026." },
            { text: "Applications reviewed by hand. (Really.)" },
          ]}
          speed={45}
          className="mb-12 text-lg leading-[2] sm:text-xl"
        />
        {filed ? (
          <div aria-live="polite" className="flex items-center gap-6">
            <Stamp show={filed}>Filed</Stamp>
            <span className="text-[13px] opacity-75">
              Application {email ? `for ${email} ` : ""}logged. We read every one.
            </span>
          </div>
        ) : (
          <form
            className="flex max-w-xl items-baseline gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (/.+@.+\..+/.test(email)) setFiled(true);
              else toast("A legible address, please — this is a ledger.");
            }}
          >
            <label
              htmlFor="fieldnotes-email"
              className="shrink-0 text-[13px] font-bold tracking-[0.14em]"
            >
              APPLICANT:
            </label>
            <input
              id="fieldnotes-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="type your email"
              className="font-typer w-full bg-transparent pb-1 text-[14px] tracking-[0.06em] placeholder:opacity-35 focus:outline-none"
              style={{ borderBottom: `1.5px dashed ${CARBON}88`, color: CARBON }}
            />
            <button
              type="submit"
              className="shrink-0 cursor-pointer border-2 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] uppercase hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ borderColor: BRICK, color: BRICK, outlineColor: BRICK }}
            >
              File
            </button>
          </form>
        )}
      </section>

      {/* ── footer: colophon ───────────────────────────────── */}
      <footer className="border-t" style={{ borderColor: `${CARBON}33` }}>
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-10 pb-28 text-[11px] leading-[1.9] tracking-[0.1em]">
          <span>
            Observations recorded on site in Columbus, Ohio. Set in typewriter
            face on aged paper. No filters were applied to the people.
          </span>
          <span>
            Correspondence: {BRAND.contact} · Instagram · X · LinkedIn
            {"  "}
            <a
              href="#"
              onClick={fakeClick}
              className="cursor-pointer underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ outlineColor: BRICK }}
            >
              (all fake, ask the concierge)
            </a>
          </span>
          <span style={{ color: BRICK }}>
            ENTRY 3 OF 5 — SPILT SOCIAL CONCEPTS · © 2026 SPILT SOCIAL
          </span>
        </div>
      </footer>

      <ToastHost className="font-typer pointer-events-auto border-2 px-5 py-3 text-[12px] tracking-[0.14em] [border-color:#1E1B16] bg-[#F4EFE4] text-[#1E1B16]" />
    </div>
  );
}
