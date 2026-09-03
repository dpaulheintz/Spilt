/** Spilt Social event formats — shared by the passport book, the
 *  experiences section, the partner form, and event classification. */

export type FormatSlug =
  | "move-and-mingle"
  | "move-fest"
  | "business-hop"
  | "founders-fair"
  | "tapt"
  | "other";

export type Format = {
  slug: FormatSlug;
  name: string;
  ink: string;
  cta: "buy" | "apply";
  copy: string;
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
  {
    slug: "move-and-mingle",
    name: "Move & Mingle",
    ink: FORMAT_INKS["move-and-mingle"],
    cta: "buy",
    copy: "Sweat first, socialize second. A free-flowing workout and social at spots like Bridge Park — meet your next gym buddy, cofounder, or both, at resting heart rate and then well above it.",
  },
  {
    slug: "move-fest",
    name: "Move Fest",
    ink: FORMAT_INKS["move-fest"],
    cta: "buy",
    copy: "Our biggest day of the year. Movement, music, and community taking over Huntington Park — part festival, part group workout, all Columbus.",
  },
  {
    slug: "business-hop",
    name: "Business Hop",
    ink: FORMAT_INKS["business-hop"],
    cta: "apply",
    copy: "The signature. A curated mentorship crawl across the city's most distinguished venues — dozens of Columbus's sharpest mentors and operators, now hopping through Cleveland and Cincinnati too.",
  },
  {
    slug: "founders-fair",
    name: "Founders Fair",
    ink: FORMAT_INKS["founders-fair"],
    cta: "apply",
    copy: "100 student founders. Top investors and operators. One day at The Loom built around real feedback, real connections, and real chances.",
  },
  {
    slug: "tapt",
    name: "Tapt",
    ink: FORMAT_INKS.tapt,
    cta: "apply",
    copy: "A curated community for meaningful connections. That's all we can say for now — the rest, you find out in the room.",
  },
];

export const TAPT_URL = "https://posh.vip/e/tapt-social";
export const POSH_GROUP_URL = "https://posh.vip/g/spilt-social-1";

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
