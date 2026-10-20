"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { Copy } from "@/lib/content-store";
import { FORMATS, formatName } from "@/lib/formats";
import SocialsPanel from "./SocialsPanel";

const CREAM = "#FAF6EE";
const CHARCOAL = "#2A2620";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";
const HAIRLINE = "rgba(42, 38, 32, 0.14)";

export default function PassportNav({ copy }: { copy: Copy }) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const links: { label: string; target: string }[] = [
    { label: "Social", target: "top" },
    { label: "Events", target: "events" },
    ...FORMATS.map((f) => ({ label: formatName(copy, f.slug), target: f.slug })),
  ];

  const go = (target: string) => {
    if (target === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ backgroundColor: CREAM, borderColor: HAIRLINE }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <button
          type="button"
          onClick={() => go("top")}
          className="font-heading cursor-pointer text-[17px] tracking-[0.16em] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: CHARCOAL, outlineColor: GOLD }}
        >
          {copy.nav.wordmark}
        </button>

        {/* desktop links */}
        <div className="hidden items-center gap-7 text-[13px] lg:flex">
          {links.map((l) => (
            <button
              key={l.target}
              type="button"
              onClick={() => go(l.target)}
              className="cursor-pointer whitespace-nowrap transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: CHARCOAL, outlineColor: GOLD }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* phones get the partner button inside the socials panel */}
          <Link
            href="/partner"
            className="hidden cursor-pointer px-5 py-2.5 text-[13px] font-medium tracking-[0.04em] whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 sm:inline-block"
            style={{ backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HI)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
          >
            {copy.nav.partnerButton}
          </Link>
          {/* under lg: opens the full-screen socials panel */}
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="socials-panel"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
            style={{ outlineColor: GOLD }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                className="block h-[1.5px] w-5"
                style={{ backgroundColor: CHARCOAL }}
              />
            ))}
          </button>
        </div>
      </nav>

      <SocialsPanel
        open={open}
        onClose={close}
        returnFocusTo={menuButtonRef}
        heading={copy.socials.menuHeading}
        wordmark={copy.nav.wordmark}
        partnerLabel={copy.nav.partnerButton}
        links={copy.socials}
      />
    </header>
  );
}
