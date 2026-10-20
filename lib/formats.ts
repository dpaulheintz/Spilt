import type { Copy } from "./content-store";

/** Spilt Social event formats — shared by the passport book, the
 *  experiences section, the partner form, and event classification.
 *  Names and descriptions are editable content (content/defaults.json,
 *  section "experiences"); structure and ink colors live here. */

export type FormatSlug =
  | "move-and-mingle"
  | "move-fest"
  | "business-hop"
  | "founders-fair"
  | "tapt"
  | "other";

export type Format = {
  slug: Exclude<FormatSlug, "other">;
  ink: string;
  cta: "buy" | "apply";
};

export const FORMAT_INKS: Record<FormatSlug, string> = {
  "move-and-mingle": "#3F5877",
  "move-fest": "#3F5877",
  "business-hop": "#C69D60",
  "founders-fair": "#A34A2E",
  tapt: "#1B1F3B",
  other: "#2A2620",
};

export const FORMATS: Format[] = [
  { slug: "move-and-mingle", ink: FORMAT_INKS["move-and-mingle"], cta: "buy" },
  { slug: "move-fest", ink: FORMAT_INKS["move-fest"], cta: "buy" },
  { slug: "business-hop", ink: FORMAT_INKS["business-hop"], cta: "apply" },
  { slug: "founders-fair", ink: FORMAT_INKS["founders-fair"], cta: "apply" },
  { slug: "tapt", ink: FORMAT_INKS.tapt, cta: "apply" },
];

/** "move-and-mingle" → "moveAndMingle" (prefix for experiences.* keys) */
export function formatKey(slug: FormatSlug): string {
  return slug.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
}

export function formatName(copy: Copy, slug: FormatSlug): string {
  return copy.experiences?.[`${formatKey(slug)}Name`] ?? slug;
}

export function formatCopy(copy: Copy, slug: FormatSlug): string {
  return copy.experiences?.[`${formatKey(slug)}Copy`] ?? "";
}

export function formatPhoto(copy: Copy, slug: FormatSlug): string {
  return copy.experiences?.[`${formatKey(slug)}Photo`] ?? "";
}

/** Classify an event title into a format by keywords. */
export function classifyFormat(title: string): FormatSlug {
  const t = title.toLowerCase();
  if (t.includes("move") && t.includes("mingle")) return "move-and-mingle";
  if (t.includes("move fest") || t.includes("movefest")) return "move-fest";
  if (t.includes("business hop")) return "business-hop";
  if (t.includes("founders fair") || t.includes("founder's fair"))
    return "founders-fair";
  if (t.includes("tapt")) return "tapt";
  return "other";
}

export function ctaForFormat(slug: FormatSlug): { label: string; kind: "buy" | "apply" } {
  if (slug === "move-and-mingle" || slug === "move-fest")
    return { label: "Buy tickets", kind: "buy" };
  if (slug === "other") return { label: "Tickets", kind: "buy" };
  return { label: "Apply", kind: "apply" };
}
