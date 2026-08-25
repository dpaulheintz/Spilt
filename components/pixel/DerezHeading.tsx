"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "▓▒░█#<>/*+";

/**
 * Heading that "de-rezzes" in on scroll: characters resolve from
 * scrambled glyphs to crisp over ~400ms, staggered per character.
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
  const [display, setDisplay] = useState(text);
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
          const out = chars.map((c, i) => {
            if (c === " ") return c;
            const lt = t - i * STAGGER;
            if (lt < 0) {
              done = false;
              return " ";
            }
            if (lt < DUR) {
              done = false;
              return GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            return c;
          });
          setDisplay(out.join(""));
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
      <span aria-hidden>{display}</span>
    </h2>
  );
}
