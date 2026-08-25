"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TypeSegment = {
  text: string;
  /** ms pause after this segment finishes */
  pauseAfter?: number;
};

/**
 * Typewriter effect: 60ms/char, blinking block cursor, pauses between
 * segments. Click completes instantly. Reduced-motion renders pre-typed.
 * Starts when scrolled into view (or immediately with `autoStart`).
 */
export default function Typewriter({
  segments,
  className,
  speed = 60,
  autoStart = false,
  showCursor = true,
  onDone,
}: {
  segments: TypeSegment[];
  className?: string;
  speed?: number;
  autoStart?: boolean;
  showCursor?: boolean;
  onDone?: () => void;
}) {
  const full = segments.map((s) => s.text);
  const totalChars = full.reduce((a, t) => a + t.length, 0);

  const ref = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(0); // chars revealed across all segments
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneFired = useRef(false);

  const finish = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTyped(totalChars);
    setDone(true);
  }, [totalChars]);

  useEffect(() => {
    if (done && !doneFired.current) {
      doneFired.current = true;
      onDone?.();
    }
  }, [done, onDone]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      let count = 0;
      let seg = 0;
      let inSeg = 0;
      const tick = () => {
        count++;
        inSeg++;
        setTyped(count);
        let pause = 0;
        if (inSeg >= full[seg].length) {
          pause = segments[seg].pauseAfter ?? 0;
          seg++;
          inSeg = 0;
        }
        if (count >= totalChars) {
          setDone(true);
          return;
        }
        timerRef.current = setTimeout(tick, speed + pause);
      };
      timerRef.current = setTimeout(tick, speed);
    };

    if (autoStart) {
      start();
    } else {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            start();
            io.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      io.observe(el);
      return () => {
        io.disconnect();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* build display text from `typed` count; cursor sits at the write head */
  const lines: React.ReactNode[] = [];
  let remaining = typed;
  for (let s = 0; s < full.length; s++) {
    const t = full[s];
    const show = Math.max(0, Math.min(t.length, remaining));
    remaining -= show;
    const cursorHere =
      !done && showCursor && (remaining === 0 || s === full.length - 1);
    lines.push(
      <span key={s} className="block">
        {t.slice(0, show)}
        {cursorHere && (
          <span className="fieldnotes-cursor" aria-hidden>
            ▮
          </span>
        )}
      </span>
    );
    if (!done && show < t.length) break; // future lines stay hidden
    if (cursorHere) break;
  }

  return (
    <div
      ref={ref}
      className={`${className ?? ""} ${done ? "" : "cursor-pointer"}`}
      onClick={finish}
      aria-label={full.join(" ")}
      title={done ? undefined : "Click to skip"}
    >
      <span aria-hidden>{lines}</span>
    </div>
  );
}
