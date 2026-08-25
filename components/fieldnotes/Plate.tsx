"use client";

import { useEffect, useRef, useState } from "react";
import Typewriter from "./Typewriter";

const PAPER = "#F4EFE4";
const CARBON = "#1E1B16";
const BRICK = "#A34A2E";
const SLATE = "#3F5877";
const OCHRE = "#C08A3E";

export type PlateSpec = {
  n: number; // 1..4
  location: string; // COLUMBUS / CINCINNATI
  keywords: string; // "hop / mentors / statehouse"
  stamp: "statehouse" | "loom" | "park" | "prim";
};

/* ── tiny hand-carved stamp marks (rough strokes, 2 spot inks) ── */
function StampArt({ kind }: { kind: PlateSpec["stamp"] }) {
  const rough = {
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  switch (kind) {
    case "statehouse":
      return (
        <svg viewBox="0 0 120 80" className="h-20 w-auto" aria-hidden>
          {/* drum + low dome */}
          <path d="M48 22 h24 M50 22 v-8 h20 v8" stroke={BRICK} strokeWidth="2.5" {...rough} />
          {/* pediment + columns */}
          <path d="M30 30 h60 M34 30 v26 M46 30 v26 M58 30 v26 M70 30 v26 M82 30 v26" stroke={BRICK} strokeWidth="2.5" {...rough} />
          <path d="M26 58 h68" stroke={CARBON} strokeWidth="2.5" {...rough} />
          {/* ground */}
          <path d="M18 66 q30 4 84 0" stroke={SLATE} strokeWidth="2" {...rough} strokeDasharray="6 4" />
        </svg>
      );
    case "loom":
      return (
        <svg viewBox="0 0 120 80" className="h-20 w-auto" aria-hidden>
          {/* sawtooth factory roof */}
          <path d="M22 40 l12 -12 v12 l12 -12 v12 l12 -12 v12 l12 -12 v12 h12" stroke={OCHRE} strokeWidth="2.5" {...rough} />
          <path d="M22 40 v22 h76 v-22" stroke={CARBON} strokeWidth="2.5" {...rough} />
          {/* threads */}
          <path d="M34 48 h52 M34 54 h52" stroke={SLATE} strokeWidth="1.6" {...rough} strokeDasharray="4 5" />
          <path d="M14 68 q46 5 92 0" stroke={SLATE} strokeWidth="2" {...rough} strokeDasharray="6 4" />
        </svg>
      );
    case "park":
      return (
        <svg viewBox="0 0 120 80" className="h-20 w-auto" aria-hidden>
          {/* bandshell arch */}
          <path d="M38 58 a22 22 0 0 1 44 0" stroke={BRICK} strokeWidth="2.5" {...rough} />
          <path d="M46 58 a14 14 0 0 1 28 0" stroke={BRICK} strokeWidth="1.8" {...rough} />
          {/* flag + trees */}
          <path d="M60 36 v-14 M60 22 l10 3 -10 3" stroke={CARBON} strokeWidth="2" {...rough} />
          <path d="M22 58 q4 -12 8 0 M90 58 q4 -12 8 0" stroke={SLATE} strokeWidth="2.2" {...rough} />
          <path d="M14 64 q46 5 92 0" stroke={SLATE} strokeWidth="2" {...rough} strokeDasharray="6 4" />
        </svg>
      );
    case "prim":
      return (
        <svg viewBox="0 0 120 80" className="h-20 w-auto" aria-hidden>
          {/* townhouse row */}
          <path d="M26 60 v-26 h20 v26 M46 60 v-32 h22 v32 M68 60 v-24 h20 v24" stroke={BRICK} strokeWidth="2.5" {...rough} />
          <path d="M46 28 l11 -8 11 8" stroke={CARBON} strokeWidth="2.2" {...rough} />
          {/* coupe in a window */}
          <path d="M53 42 h8 M57 42 v6 M54 50 h6" stroke={OCHRE} strokeWidth="1.8" {...rough} />
          <path d="M18 66 q46 5 92 0" stroke={SLATE} strokeWidth="2" {...rough} strokeDasharray="6 4" />
        </svg>
      );
  }
}

/**
 * Archival plate: pre-composed image if present; else CSS composition
 * (photo left 58% / paper + stamp right 42%). Never a broken image.
 */
export default function Plate({ spec, flip }: { spec: PlateSpec; flip: boolean }) {
  const nn = String(spec.n).padStart(2, "0");
  const composed = `/assets/fieldnotes/plate-${nn}.png`;
  const raw = `/assets/fieldnotes/raw-${nn}.jpg`;

  const [hasComposed, setHasComposed] = useState<boolean | null>(null);
  const [hasRaw, setHasRaw] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const probe = (src: string, set: (v: boolean) => void) => {
      const img = new Image();
      img.onload = () => set(true);
      img.onerror = () => set(false);
      img.src = src;
    };
    probe(composed, setHasComposed);
    probe(raw, setHasRaw);
  }, [composed, raw]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const caption = `No. ${nn} — ${spec.keywords} — 2026`;

  return (
    <div
      ref={ref}
      className="w-full"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition:
          "opacity 800ms var(--ease-spilt), transform 800ms var(--ease-spilt)",
      }}
    >
      <div className="aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: PAPER }}>
        {hasComposed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={composed}
            alt={`Plate ${nn}: ${spec.location} — ${spec.keywords}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          /* CSS-composed plate: photo 58% / aged paper + stamp 42% */
          <div className={`flex h-full w-full ${flip ? "flex-row-reverse" : ""}`}>
            <div className="h-full w-[58%]">
              {hasRaw ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={raw}
                  alt={`${spec.location} — ${spec.keywords}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                /* photo placeholder: quiet slate panel, no broken image */
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-3"
                  style={{ backgroundColor: SLATE }}
                >
                  <span
                    className="font-typer text-[11px] tracking-[0.3em] uppercase"
                    style={{ color: PAPER, opacity: 0.85 }}
                  >
                    Photograph {nn}
                  </span>
                  <span
                    className="font-typer text-[10px] tracking-[0.2em]"
                    style={{ color: PAPER, opacity: 0.55 }}
                  >
                    assets/fieldnotes/raw-{nn}.jpg
                  </span>
                </div>
              )}
            </div>
            <div
              className="fieldnotes-paper relative flex h-full w-[42%] flex-col items-center justify-end pb-[12%]"
              style={{ backgroundColor: PAPER }}
            >
              <StampArt kind={spec.stamp} />
              <div
                className="font-typer mt-6 text-left text-[11px] leading-[1.8] sm:text-[12px]"
                style={{ color: CARBON }}
              >
                <span className="block">{spec.location}</span>
                <span className="block">No. {nn}</span>
                <span className="block">{spec.keywords}</span>
                <span className="block">2026</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* typed caption beneath the plate */}
      <div className="mt-3 min-h-[1.6em]">
        {inView && (
          <Typewriter
            autoStart
            segments={[{ text: caption }]}
            speed={40}
            className="font-typer text-[12px] tracking-[0.12em]"
          />
        )}
      </div>
    </div>
  );
}
