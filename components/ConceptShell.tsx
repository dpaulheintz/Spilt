"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CONCEPTS, conceptIndexFromPath } from "@/lib/concepts";

const FADE_MS = 175; // half of the 350ms fade-through

/**
 * The floating concept switcher + page-transition overlay.
 * Identical geometry on every page; colors adapt to the active concept.
 */
export default function ConceptShell() {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = conceptIndexFromPath(pathname);
  const active = activeIndex >= 0 ? CONCEPTS[activeIndex] : CONCEPTS[0];

  const [overlay, setOverlay] = useState<{ color: string; visible: boolean }>({
    color: active.bg,
    visible: false,
  });
  const busyRef = useRef(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  // Fade the overlay back out once the new route has rendered.
  useEffect(() => {
    if (!busyRef.current) return;
    const t = setTimeout(() => {
      setOverlay((o) => ({ ...o, visible: false }));
      busyRef.current = false;
    }, 30); // let the new page paint first
    return () => clearTimeout(t);
  }, [pathname]);

  const go = useCallback(
    (index: number) => {
      const i = ((index % CONCEPTS.length) + CONCEPTS.length) % CONCEPTS.length;
      if (i === activeIndex || busyRef.current) return;
      const target = CONCEPTS[i];
      if (reducedMotion.current) {
        router.push(`/${target.slug}`);
        return;
      }
      busyRef.current = true;
      // fade through the target concept's paper color
      setOverlay({ color: target.bg, visible: true });
      setTimeout(() => router.push(`/${target.slug}`), FADE_MS);
    },
    [activeIndex, router]
  );

  // keyboard: ← → and 1–4
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") go(activeIndex - 1);
      else if (e.key === "ArrowRight") go(activeIndex + 1);
      else if (["1", "2", "3", "4"].includes(e.key)) go(Number(e.key) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, go]);

  // touch swipe anywhere on the page
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        go(activeIndex + (dx < 0 ? 1 : -1));
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [activeIndex, go]);

  if (activeIndex < 0) return null; // not on a concept route

  return (
    <>
      {/* transition overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100]"
        style={{
          backgroundColor: overlay.color,
          opacity: overlay.visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms var(--ease-spilt)`,
        }}
      />

      {/* switcher */}
      <div className="fixed inset-x-0 bottom-5 z-[110] flex flex-col items-center gap-1.5">
        <span
          className="text-[10px] tracking-[0.22em] uppercase select-none"
          style={{ color: active.fg, opacity: 0.75 }}
        >
          № {active.number} — {active.name}
        </span>
        <nav
          aria-label="Concept switcher"
          className="flex items-center gap-1 rounded-full px-2 py-1.5 backdrop-blur-sm"
          style={{
            backgroundColor: `color-mix(in srgb, ${active.bg} 82%, transparent)`,
            border: `1px solid color-mix(in srgb, ${active.fg} 30%, transparent)`,
            boxShadow: `0 2px 14px color-mix(in srgb, ${active.fg} 12%, transparent)`,
          }}
        >
          <button
            type="button"
            aria-label="Previous concept"
            onClick={() => go(activeIndex - 1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-sm transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{ color: active.fg, opacity: 0.65, outlineColor: active.accent }}
          >
            ←
          </button>
          {CONCEPTS.map((c, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={c.slug}
                type="button"
                aria-label={`Concept ${c.number} — ${c.name}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => go(i)}
                className="cursor-pointer rounded-full px-2.5 py-1 font-mono text-[11px] tracking-wider transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1"
                style={
                  isActive
                    ? {
                        backgroundColor: active.fg,
                        color: active.bg,
                        outlineColor: active.accent,
                      }
                    : {
                        color: active.fg,
                        opacity: 0.55,
                        outlineColor: active.accent,
                      }
                }
              >
                {c.number}
              </button>
            );
          })}
          <button
            type="button"
            aria-label="Next concept"
            onClick={() => go(activeIndex + 1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-sm transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{ color: active.fg, opacity: 0.65, outlineColor: active.accent }}
          >
            →
          </button>
        </nav>
      </div>
    </>
  );
}
