"use client";

import { useId } from "react";

/* muted stamp inks per spec */
export const INK_GOLD = "#A9853F"; // deepened gold — reads as ink, not UI
export const INK_RED = "#A34A2E";
export const INK_SLATE = "#3F5877";

export type StampDef = {
  id: string;
  label: string;
  shape: "round" | "rect";
  ink: string;
  rotation: number; // deg, -8..8
  /** section anchor the stamp links to in the modal */
  target: string;
};

export const STAMPS: StampDef[] = [
  { id: "manifesto", label: "FILL YOUR CUP", shape: "round", ink: INK_GOLD, rotation: -6, target: "manifesto" },
  { id: "venues", label: "COLUMBUS OH", shape: "rect", ink: INK_SLATE, rotation: 4, target: "venues" },
  { id: "ev-0", label: "BUSINESS HOP", shape: "round", ink: INK_GOLD, rotation: 7, target: "whats-on" },
  { id: "ev-1", label: "MOVE & MINGLE", shape: "rect", ink: INK_RED, rotation: -3, target: "whats-on" },
  { id: "ev-2", label: "FOUNDERS FAIR", shape: "round", ink: INK_SLATE, rotation: 5, target: "whats-on" },
  { id: "ev-3", label: "MOVE FEST", shape: "rect", ink: INK_RED, rotation: -7, target: "whats-on" },
  { id: "subscribed", label: "SUBSCRIBED", shape: "round", ink: INK_GOLD, rotation: 3, target: "subscribe" },
];

/**
 * Visa-style ink stamp, drawn in code. Slightly irregular 2px edges via
 * a light turbulence displacement; one ink color; SEP 2026 date line.
 */
export function Stamp({
  def,
  size = 88,
  className,
}: {
  def: StampDef;
  size?: number;
  className?: string;
}) {
  const fid = useId().replace(/[:]/g, "");
  const words = def.label.split(" ");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ transform: `rotate(${def.rotation}deg)` }}
      aria-hidden
    >
      <defs>
        <filter id={`rough-${fid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" result="n" seed="7" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" />
        </filter>
      </defs>
      <g filter={`url(#rough-${fid})`} opacity="0.88">
        {def.shape === "round" ? (
          <>
            <circle cx="50" cy="50" r="44" fill="none" stroke={def.ink} strokeWidth="2.4" />
            <circle cx="50" cy="50" r="37" fill="none" stroke={def.ink} strokeWidth="1" />
          </>
        ) : (
          <>
            <rect x="7" y="20" width="86" height="60" fill="none" stroke={def.ink} strokeWidth="2.4" />
            <rect x="12" y="25" width="76" height="50" fill="none" stroke={def.ink} strokeWidth="1" />
          </>
        )}
        <text
          x="50"
          y={words.length > 1 ? 46 : 50}
          textAnchor="middle"
          fill={def.ink}
          style={{
            font: "700 11px var(--font-passport), sans-serif",
            letterSpacing: "0.12em",
          }}
        >
          {words.length > 2
            ? `${words[0]} ${words[1]}`
            : words[0]}
        </text>
        {words.length > 1 && (
          <text
            x="50"
            y="58"
            textAnchor="middle"
            fill={def.ink}
            style={{
              font: "700 11px var(--font-passport), sans-serif",
              letterSpacing: "0.12em",
            }}
          >
            {words.length > 2 ? words.slice(2).join(" ") : words[1]}
          </text>
        )}
        <text
          x="50"
          y={def.shape === "round" ? 72 : 70}
          textAnchor="middle"
          fill={def.ink}
          style={{
            font: "400 8px var(--font-geist-mono), monospace",
            letterSpacing: "0.18em",
          }}
        >
          SEP 2026
        </text>
      </g>
    </svg>
  );
}
