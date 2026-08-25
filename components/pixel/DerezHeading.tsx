"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "▓▒░█#<>/*+";

type Cell = { ch: string; scrambling: boolean };

/**
 * Heading that "de-rezzes" in on scroll: characters resolve from
 * scrambled pixel-font glyphs to crisp serif over ~400ms, staggered.
 * The pixel face appears ONLY during the scramble; settled text
 * inherits the heading's display face (Italiana).
 */
export default function DerezHeading({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [cells, setCells] = useState<Cell[]>(() =>
    text.split("").map((ch) => ({ ch, scrambling: false }))
  );
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        io.disconnect();

        const chars = text.split("");
        const DUR = 400;
        const STAGGER = 26;
        const start = performance.now() + delay;

        const iv = setInterval(() => {
          const t = performance.now() - start;
          let done = true;
          const out: Cell[] = chars.map((c, i) => {
            if (c === " ") return { ch: c, scrambling: false };
            const lt = t - i * STAGGER;
            if (lt < 0) {
              done = false;
              return { ch: " ", scrambling: false };
            }
            if (lt < DUR) {
              done = false;
              return {
                ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
                scrambling: true,
              };
            }
            return { ch: c, scrambling: false };
          });
          setCells(out);
          if (done) clearInterval(iv);
        }, 40);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text, delay]);

  return (
    <h2 ref={ref} aria-label={text} className={className}>
      <span aria-hidden>
        {cells.map((cell, i) => (
          <span key={i} className={cell.scrambling ? "font-pixel" : undefined}>
            {cell.ch}
          </span>
        ))}
      </span>
    </h2>
  );
}
