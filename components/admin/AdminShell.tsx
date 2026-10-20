"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ToastHost from "@/components/ToastHost";
import { CHARCOAL, CREAM, GOLD, HAIRLINE, MUTED } from "./ui";

export const ADMIN_NAV = [
  { href: "/admin/content", label: "Site Content" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/sponsors", label: "Sponsors" },
  { href: "/admin/shop", label: "Shop" },
  { href: "/admin/inquiries", label: "Partner Inquiries" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/newsletter", label: "Newsletter" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-0.5">
      {ADMIN_NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className="flex min-h-[44px] items-center border-l-2 px-4 text-[15px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
              style={{
                borderColor: active ? GOLD : "transparent",
                backgroundColor: active ? "rgba(198,157,96,0.12)" : "transparent",
                fontWeight: active ? 600 : 400,
                outlineColor: GOLD,
              }}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const current = ADMIN_NAV.find((n) => n.href === pathname)?.label ?? "Admin";

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="font-body min-h-dvh" style={{ backgroundColor: CREAM, color: CHARCOAL }}>
      {/* slim preview banner on every admin page */}
      <div
        role="note"
        className="px-4 py-2 text-center text-[13px] font-medium"
        style={{ backgroundColor: GOLD, color: CHARCOAL }}
      >
        Preview — this is what your admin will look like. Changes here aren&apos;t saved yet.
      </div>

      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6"
        style={{ backgroundColor: CREAM, borderColor: HAIRLINE }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={menuOpen}
            className="flex h-11 w-11 cursor-pointer items-center justify-center lg:hidden"
          >
            <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden>
              <path d="M0 1h20M0 7h20M0 13h20" stroke={CHARCOAL} strokeWidth="1.5" />
            </svg>
          </button>
          <Link href="/admin/content" className="font-heading text-[16px] tracking-[0.16em]">
            SPILT SOCIAL
          </Link>
          <span className="hidden text-[13px] sm:inline" style={{ color: MUTED }}>
            Admin
          </span>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] underline-offset-4 hover:underline"
        >
          View live site <span aria-hidden>↗</span>
        </a>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* desktop sidebar */}
        <nav
          aria-label="Admin sections"
          className="sticky top-[61px] hidden h-[calc(100dvh-61px)] w-60 shrink-0 border-r py-6 lg:block"
          style={{ borderColor: HAIRLINE }}
        >
          <NavLinks />
        </nav>

        <main className="min-w-0 flex-1 px-4 py-8 pb-32 sm:px-8 lg:px-12">
          <p className="mb-1 text-[12px] tracking-[0.18em] uppercase lg:hidden" style={{ color: MUTED }}>
            {current}
          </p>
          {children}
        </main>
      </div>

      {/* phone menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 cursor-default"
            style={{ backgroundColor: "rgba(42,38,32,0.4)" }}
            onClick={() => setMenuOpen(false)}
          />
          <nav
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto py-4"
            style={{ backgroundColor: CREAM }}
          >
            <div className="mb-4 flex items-center justify-between px-4">
              <span className="font-heading tracking-[0.16em]">SPILT SOCIAL</span>
              <button
                type="button"
                autoFocus
                onClick={() => setMenuOpen(false)}
                aria-label="Close admin menu"
                className="flex h-11 w-11 cursor-pointer items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
                  <path d="M4 4l12 12M16 4L4 16" stroke={CHARCOAL} strokeWidth="1.5" />
                </svg>
              </button>
            </div>
            <NavLinks onNavigate={() => setMenuOpen(false)} />
          </nav>
        </div>
      )}

      <ToastHost className="pointer-events-auto border px-5 py-3 text-[14px] [border-color:#C69D6055] bg-[#2A2620] text-[#FAF6EE]" />
    </div>
  );
}
