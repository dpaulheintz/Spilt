"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FORMATS } from "@/lib/formats";

const CREAM = "#FAF6EE";
const CHARCOAL = "#2A2620";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";
const HAIRLINE = "rgba(42, 38, 32, 0.14)";

const LINKS: { label: string; target: string }[] = [
  { label: "Social", target: "top" },
  { label: "Events", target: "events" },
  ...FORMATS.map((f) => ({ label: f.name, target: f.slug })),
];

export default function PassportNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (target: string) => {
    setOpen(false);
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
          SPILT SOCIAL
        </button>

        {/* desktop links */}
        <div className="hidden items-center gap-7 text-[13px] lg:flex">
          {LINKS.map((l) => (
            <button
              key={l.label}
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
          <Link
            href="/partner"
            className="cursor-pointer px-5 py-2.5 text-[13px] font-medium tracking-[0.04em] whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HI)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
          >
            Become a Partner
          </Link>
          {/* hamburger under lg */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
            style={{ outlineColor: GOLD }}
          >
            <span
              className="block h-[1.5px] w-5 transition-transform duration-300"
              style={{
                backgroundColor: CHARCOAL,
                transform: open ? "translateY(6.5px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block h-[1.5px] w-5 transition-opacity duration-200"
              style={{ backgroundColor: CHARCOAL, opacity: open ? 0 : 1 }}
            />
            <span
              className="block h-[1.5px] w-5 transition-transform duration-300"
              style={{
                backgroundColor: CHARCOAL,
                transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {/* mobile menu */}
      {open && (
        <div
          className="border-t lg:hidden"
          style={{ backgroundColor: CREAM, borderColor: HAIRLINE }}
        >
          <div className="mx-auto flex max-w-7xl flex-col px-6 py-3">
            {LINKS.map((l) => (
              <button
                key={l.label}
                type="button"
                onClick={() => go(l.target)}
                className="cursor-pointer border-b py-3.5 text-left text-[15px] last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: CHARCOAL, borderColor: HAIRLINE, outlineColor: GOLD }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
