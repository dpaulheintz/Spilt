export type SocialKey = "instagram" | "linkedin" | "tiktok" | "posh";

export const SOCIAL_ORDER: SocialKey[] = ["instagram", "linkedin", "tiktok", "posh"];

export const SOCIAL_NAMES: Record<SocialKey, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  posh: "Posh",
};

/** Secondary line under each social: the handle when the URL has one. */
export function socialDetail(key: SocialKey, url: string): string {
  const handle = url.match(/(?:instagram\.com|tiktok\.com)\/@?([^/?#]+)/i)?.[1];
  if (handle) return `@${handle}`;
  if (key === "linkedin") return "Company page";
  if (key === "posh") return "Tickets & events";
  return "";
}

/** Monochrome brand marks, 24×24 viewBox, drawn in currentColor. */
export default function SocialIcon({
  name,
  size = 22,
}: {
  name: SocialKey;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: false,
  } as const;
  switch (name) {
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common} fill="currentColor">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3v-11zm6.5 0h3.83v1.5h.06c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.66 4.8 6.13v5.42h-4v-4.8c0-1.15-.02-2.62-1.6-2.62-1.6 0-1.84 1.25-1.84 2.54v4.88h-4v-11z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.6 3c.37 2.07 1.6 3.36 3.66 3.5v3.04a7.3 7.3 0 0 1-3.6-1.06v5.86c0 3.6-2.6 6.16-5.9 6.16A5.92 5.92 0 0 1 4.8 14.6c0-3.6 3.04-6.1 6.6-5.66v3.13c-1.7-.4-3.47.7-3.47 2.55 0 1.5 1.13 2.66 2.6 2.66 1.6 0 2.73-1.1 2.73-3.03V3h3.34z" />
        </svg>
      );
    case "posh":
      /* Posh has no public mark license — a neutral ticket glyph */
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5v2.25a2.25 2.25 0 0 0 0 4.5v2.25A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5v-2.25a2.25 2.25 0 0 0 0-4.5V7.5z" />
          <path d="M14.5 6v12" strokeDasharray="1.6 1.8" />
        </svg>
      );
  }
}
