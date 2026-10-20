"use client";

import { useId } from "react";
import { toast } from "@/lib/toast";

/* Admin preview primitives. Everything here is in-memory only: any
   action that would persist, send, sync, import, or export calls
   previewOnly() instead. Reloading the page restores the originals. */

export const CREAM = "#FAF6EE";
export const PANEL = "#FFFDF8";
export const CHARCOAL = "#2A2620";
export const GOLD = "#C69D60";
export const GOLD_HI = "#E8C687";
export const HAIRLINE = "rgba(42, 38, 32, 0.14)";
export const MUTED = "rgba(42, 38, 32, 0.62)";

export const PREVIEW_MESSAGE = "Preview only — nothing was changed.";
export const previewOnly = () => toast(PREVIEW_MESSAGE);

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed" style={{ color: MUTED }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`border ${padded ? "p-5 sm:p-6" : ""} ${className ?? ""}`}
      style={{ borderColor: HAIRLINE, backgroundColor: PANEL }}
    >
      {children}
    </div>
  );
}

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "gold" | "ghost" | "quiet";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  "aria-label"?: string;
};

/** Defaults to the preview toast — a button with no onClick changes nothing. */
export function Button({
  children,
  onClick = previewOnly,
  variant = "ghost",
  disabled,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const styles: Record<string, React.CSSProperties> = {
    gold: { backgroundColor: GOLD, color: CHARCOAL, border: `1px solid ${GOLD}` },
    ghost: { backgroundColor: "transparent", color: CHARCOAL, border: `1px solid ${HAIRLINE}` },
    quiet: { backgroundColor: "transparent", color: CHARCOAL, border: "1px solid transparent" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={rest["aria-label"]}
      className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 px-5 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      style={{ ...styles[variant], outlineColor: GOLD }}
      onMouseEnter={(e) => {
        if (e.currentTarget.disabled) return;
        if (variant === "gold") e.currentTarget.style.backgroundColor = GOLD_HI;
        else e.currentTarget.style.backgroundColor = "rgba(198,157,96,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = variant === "gold" ? GOLD : "transparent";
      }}
    >
      {children}
    </button>
  );
}

const inputClass =
  "w-full border bg-white px-3.5 py-2.5 text-[15px] leading-relaxed focus:outline-2 focus:outline-offset-1";

export function TextField({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  hint?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={Math.min(8, Math.max(3, Math.ceil(value.length / 70)))}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} resize-y`}
          style={{ borderColor: HAIRLINE, color: CHARCOAL, outlineColor: GOLD }}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          style={{ borderColor: HAIRLINE, color: CHARCOAL, outlineColor: GOLD }}
        />
      )}
      {hint && (
        <p className="mt-1.5 text-[12px]" style={{ color: MUTED }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-[14px] font-medium">{label}</span>
        {description && (
          <span className="block text-[12px]" style={{ color: MUTED }}>
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ backgroundColor: checked ? GOLD : "rgba(42,38,32,0.18)", outlineColor: GOLD }}
      >
        <span
          className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </label>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "sample" | "good" | "warn";
}) {
  const tones: Record<string, React.CSSProperties> = {
    neutral: { backgroundColor: "rgba(42,38,32,0.07)", color: CHARCOAL },
    gold: { backgroundColor: "rgba(198,157,96,0.18)", color: "#7A5A26" },
    sample: { backgroundColor: "transparent", color: MUTED, border: `1px dashed ${HAIRLINE}` },
    good: { backgroundColor: "rgba(63,88,119,0.12)", color: "#3F5877" },
    warn: { backgroundColor: "rgba(163,74,46,0.1)", color: "#A34A2E" },
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium tracking-[0.06em] uppercase"
      style={tones[tone]}
    >
      {children}
    </span>
  );
}

/** Local-only file picker: returns an object URL for on-screen preview. */
export function pickLocalFile(
  accept: string,
  onPicked: (url: string, file: File) => void
) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) onPicked(URL.createObjectURL(file), file);
  };
  input.click();
}
