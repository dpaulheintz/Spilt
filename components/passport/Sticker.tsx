"use client";

import { useId } from "react";
import { FORMAT_INKS, type FormatSlug } from "@/lib/formats";

/**
 * Passport-sticker badge, drawn in code: rounded-rect with a 1px
 * slightly-irregular ink edge, format name in letterspaced small caps
 * (document mono), one ink color, slight rotation, soft sticker shadow.
 */
export default function Sticker({
  format,
  label,
  width = 170,
  rotation = -3,
  className,
}: {
  format: FormatSlug;
  label?: string;
  width?: number;
  rotation?: number;
  className?: string;
}) {
  const fid = useId().replace(/[:]/g, "");
  const ink = FORMAT_INKS[format];
  const text = (label ?? format.replace(/-/g, " ")).toUpperCase();
  const words = text.split(" ");
  const isLong = text.length > 11 && words.length > 1;
  // balanced two-line break for long names
  let split = 1;
  if (isLong) {
    let best = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ").length;
      const b = words.slice(i).join(" ").length;
      const d = Math.abs(a - b);
      if (d < best) {
        best = d;
        split = i;
      }
    }
  }
  const line1 = isLong ? words.slice(0, split).join(" ") : text;
  const line2 = isLong ? words.slice(split).join(" ") : "";
  return (
    <svg
      width={width}
      height={width * 0.42}
      viewBox="0 0 170 72"
      className={className}
      style={{
        transform: `rotate(${rotation}deg)`,
        filter: "drop-shadow(0 2px 5px rgba(42,38,32,0.22))",
      }}
      aria-hidden
    >
      <defs>
        <filter id={`stk-${fid}`} x="-8%" y="-15%" width="116%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" />
        </filter>
      </defs>
      {/* sticker paper */}
      <rect x="3" y="3" width="164" height="66" rx="9" fill="#FDFAF3" />
      <g filter={`url(#stk-${fid})`}>
        <rect x="3.5" y="3.5" width="163" height="65" rx="9" fill="none" stroke={ink} strokeWidth="1.4" />
        <rect x="8.5" y="8.5" width="153" height="55" rx="6" fill="none" stroke={ink} strokeWidth="0.7" opacity="0.65" />
      </g>
      <text
        x="85"
        y={isLong ? 34 : 41}
        textAnchor="middle"
        fill={ink}
        style={{
          font: `700 ${isLong ? 13 : 15}px var(--font-geist-mono), monospace`,
          letterSpacing: "0.18em",
        }}
      >
        {line1}
      </text>
      {isLong && (
        <text
          x="85"
          y="50"
          textAnchor="middle"
          fill={ink}
          style={{
            font: "700 13px var(--font-geist-mono), monospace",
            letterSpacing: "0.18em",
          }}
        >
          {line2}
        </text>
      )}
      {!isLong && (
        <text
          x="85"
          y="56"
          textAnchor="middle"
          fill={ink}
          opacity="0.7"
          style={{
            font: "400 8px var(--font-geist-mono), monospace",
            letterSpacing: "0.3em",
          }}
        >
          SPILT SOCIAL
        </text>
      )}
    </svg>
  );
}
