"use client";

import { useState } from "react";
import Link from "next/link";
import type { Copy } from "@/lib/content-store";
import { FORMATS, formatName, type FormatSlug } from "@/lib/formats";
import Sticker from "@/components/passport/Sticker";

const CREAM = "#FAF6EE";
const CHARCOAL = "#2A2620";
const GOLD = "#C69D60";
const GOLD_HI = "#E8C687";
const HAIRLINE = "rgba(42, 38, 32, 0.14)";

type FieldErrors = Partial<Record<"name" | "org" | "phone" | "email", string>>;

export default function PartnerContent({ copy }: { copy: Copy }) {
  const t = copy.partner;
  const contactEmail = copy.footer.contactEmail;
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // bots fill this; humans never see it
  const [interests, setInterests] = useState<Set<FormatSlug>>(new Set());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [received, setReceived] = useState(false);
  const [serverError, setServerError] = useState("");

  const toggle = (slug: FormatSlug) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Please tell us your name.";
    if (org.trim().length < 2) next.org = "Please tell us your organization.";
    if (!/^[\d\s()+.-]{7,}$/.test(phone.trim()))
      next.phone = "A phone number we can reach you at.";
    if (!/.+@.+\..+/.test(email.trim()))
      next.email = "That email doesn't look right.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          organization: org.trim(),
          phone: phone.trim(),
          email: email.trim(),
          interests: [...interests],
          website: honeypot, // honeypot field
        }),
      });
      if (res.status === 429) {
        setServerError(
          `We've already got a few from you — the team will be in touch. Anything urgent: ${contactEmail}.`
        );
        return;
      }
      if (!res.ok) throw new Error(`status ${res.status}`);
      setReceived(true);
    } catch {
      setServerError(`Something went sideways — try again, or email ${contactEmail}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    error: string | undefined,
    type = "text",
    autoComplete?: string
  ) => (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[12px] font-medium tracking-[0.14em] uppercase opacity-70"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full border bg-white px-4 py-3 text-[14px] focus:outline-2 focus:outline-offset-1"
        style={{
          borderColor: error ? "#A34A2E" : HAIRLINE,
          color: CHARCOAL,
          outlineColor: GOLD,
        }}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[12px]" style={{ color: "#A34A2E" }}>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="font-body min-h-dvh"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* slim nav: wordmark home + back link */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: CREAM, borderColor: HAIRLINE }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-heading cursor-pointer text-[17px] tracking-[0.16em] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: CHARCOAL, outlineColor: GOLD }}
          >
            {copy.nav.wordmark}
          </Link>
          <Link
            href="/"
            className="cursor-pointer text-[13px] transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: CHARCOAL, outlineColor: GOLD }}
          >
            ← Back to the club
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* ── left: pitch over a cover detail ─────────────── */}
        <div className="relative overflow-hidden" style={{ backgroundColor: "#14162B" }}>
          <div
            aria-hidden
            className="absolute inset-0 opacity-45"
            style={{
              backgroundImage: `url(${t.image})`,
              backgroundSize: "220%",
              backgroundPosition: "38% 22%",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(20,17,13,0.82), rgba(20,17,13,0.25))" }}
          />
          <div className="relative flex h-full min-h-[420px] flex-col justify-end p-8 sm:p-12">
            <h1 className="font-heading-xl text-4xl leading-tight text-white sm:text-5xl">
              {t.heading}
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/85">
              {t.blurb}
            </p>
          </div>
        </div>

        {/* ── right: the form ─────────────────────────────── */}
        <div className="lg:py-4">
          {received ? (
            <div aria-live="polite" className="flex h-full flex-col items-start justify-center">
              <span
                className="inline-block border-[2.5px] px-6 py-3 font-mono text-[15px] font-bold tracking-[0.16em] uppercase"
                style={{
                  color: "#A34A2E",
                  borderColor: "#A34A2E",
                  transform: "rotate(-2deg)",
                  opacity: 0.92,
                  animation: "passport-press 220ms var(--ease-spilt)",
                }}
              >
                {t.successStamp}
              </span>
              <p className="mt-6 text-lg">{t.successHeading}</p>
              <p className="mt-2 text-[14px] opacity-70">{t.successBody}</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="flex flex-col gap-6">
              <h2 className="font-heading text-2xl">{t.formHeading}</h2>
              {field("p-name", "Name", name, setName, errors.name, "text", "name")}
              {field("p-org", "Organization", org, setOrg, errors.org, "text", "organization")}
              {field("p-phone", "Phone", phone, setPhone, errors.phone, "tel", "tel")}
              {field("p-email", "Email", email, setEmail, errors.email, "email", "email")}

              {/* honeypot — visually hidden, tab-skipped; bots fill it */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
                <label htmlFor="p-website">Website</label>
                <input
                  id="p-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <fieldset>
                <legend className="mb-1 text-[12px] font-medium tracking-[0.14em] uppercase opacity-70">
                  {t.interestsLabel}
                </legend>
                <p className="mb-3 text-[12px] opacity-70">
                  {t.interestsHint}
                </p>
                <div className="flex flex-wrap gap-3">
                  {FORMATS.map((f) => {
                    const on = interests.has(f.slug);
                    return (
                      <label
                        key={f.slug}
                        className="relative cursor-pointer select-none"
                        style={{
                          transition: "transform 180ms var(--ease-spilt), opacity 180ms",
                          transform: on ? "scale(1)" : "scale(0.96)",
                          opacity: on ? 1 : 0.45,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          readOnly
                          onClick={() => toggle(f.slug)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              toggle(f.slug);
                            }
                          }}
                          className="absolute inset-0 h-full w-full cursor-pointer appearance-none focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{ outlineColor: GOLD }}
                          aria-label={formatName(copy, f.slug)}
                        />
                        <Sticker
                          format={f.slug}
                          width={128}
                          rotation={on ? -2 : 0}
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {serverError && (
                <p role="alert" className="text-[13px]" style={{ color: "#A34A2E" }}>
                  {serverError}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-max cursor-pointer px-8 py-3.5 text-[13px] font-medium tracking-[0.05em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                style={{ backgroundColor: GOLD, color: CHARCOAL, outlineColor: CHARCOAL }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_HI)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
              >
                {submitting ? "Sending…" : t.submitLabel}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t" style={{ borderColor: HAIRLINE }}>
        <div className="mx-auto max-w-7xl px-6 py-6 pb-24 text-[12px] opacity-70">
          {copy.footer.copyright} · {contactEmail}
        </div>
      </footer>
    </div>
  );
}
