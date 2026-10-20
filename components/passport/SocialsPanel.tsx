"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import SocialIcon, {
  SOCIAL_NAMES,
  SOCIAL_ORDER,
  socialDetail,
} from "./SocialIcon";

const CREAM = "#FAF6EE";
const CHARCOAL = "#2A2620";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";
const HAIRLINE = "rgba(42, 38, 32, 0.14)";
const DURATION = 300;

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen socials panel for phones and tablets (<1024px).
 * Dialog semantics, focus trap, Esc/X/link-tap to close, body scroll
 * lock, focus returns to the button that opened it.
 */
export default function SocialsPanel({
  open,
  onClose,
  returnFocusTo,
  heading,
  wordmark,
  partnerLabel,
  links,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusTo: React.RefObject<HTMLButtonElement | null>;
  heading: string;
  wordmark: string;
  partnerLabel: string;
  links: Record<string, string>;
}) {
  // mounted lags `open` on close so the exit transition can play
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setShown(true))
      );
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), DURATION);
    return () => clearTimeout(t);
  }, [open]);

  /* scroll lock + focus management while open */
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => closeRef.current?.focus(), 30);
    const returnTarget = returnFocusTo.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [
        ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    // the panel is lg:hidden — rotating a tablet past 1024px would hide
    // it while the scroll lock and focus trap stayed on, so close instead
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = () => desktop.matches && onClose();
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
      html.style.overflow = prevOverflow;
      document.body.style.overflow = prevBodyOverflow;
      returnTarget?.focus();
    };
  }, [open, onClose, returnFocusTo]);

  if (!mounted || typeof document === "undefined") return null;

  // portaled to <body>: the sticky header is its own stacking context,
  // so rendering inline would let higher-z page elements sit on top
  return createPortal(
    <div
      ref={panelRef}
      id="socials-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="socials-panel-heading"
      className="fixed inset-0 z-[150] flex flex-col overflow-y-auto lg:hidden"
      style={{
        backgroundColor: CREAM,
        color: CHARCOAL,
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(-12px)",
        transition: `opacity ${DURATION}ms var(--ease-spilt), transform ${DURATION}ms var(--ease-spilt)`,
      }}
    >
      {/* top bar mirrors the site header so the X sits where the ☰ was */}
      <div
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: HAIRLINE }}
      >
        <span className="font-heading text-[17px] tracking-[0.16em]">
          {wordmark}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-11 w-11 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: GOLD }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
            <path d="M4 4l12 12M16 4L4 16" stroke={CHARCOAL} strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-12 pb-10">
        <h2
          id="socials-panel-heading"
          className="font-heading text-4xl"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? "translateY(0)" : "translateY(8px)",
            transition: `opacity ${DURATION}ms var(--ease-spilt) 60ms, transform ${DURATION}ms var(--ease-spilt) 60ms`,
          }}
        >
          {heading}
        </h2>

        <ul className="mt-8 border-t" style={{ borderColor: HAIRLINE }}>
          {SOCIAL_ORDER.filter((k) => links[k]).map((key) => (
            <li key={key} className="border-b" style={{ borderColor: HAIRLINE }}>
              <a
                href={links[key]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex min-h-[68px] cursor-pointer items-center gap-4 py-3 transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: GOLD }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
                  style={{ borderColor: HAIRLINE }}
                >
                  <SocialIcon name={key} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[17px]">{SOCIAL_NAMES[key]}</span>
                  <span className="truncate text-[13px] opacity-70">
                    {socialDetail(key, links[key])}
                  </span>
                </span>
                <span aria-hidden className="text-lg opacity-50">
                  ↗
                </span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>

        {/* pinned to the bottom of the panel, never closer than 40px */}
        <div className="mt-auto pt-10">
          <Link
            href="/partner"
            onClick={onClose}
            className="flex min-h-[52px] cursor-pointer items-center justify-center text-[15px] font-medium tracking-[0.04em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HI)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
          >
            {partnerLabel}
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
