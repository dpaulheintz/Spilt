export type Concept = {
  slug: string;
  number: string; // "01".."04"
  name: string;
  /** page background — also the color transitions fade through */
  bg: string;
  /** primary foreground/type color */
  fg: string;
  /** single accent used by the switcher's active state */
  accent: string;
};

export const CONCEPTS: Concept[] = [
  {
    slug: "pixel",
    number: "01",
    name: "The Shatter",
    bg: "#F2EDE3", // ivory
    fg: "#0B0A08", // warm ink
    accent: "#C69D60", // champagne gold
  },
  {
    slug: "toile",
    number: "02",
    name: "Cobalt Engraving",
    bg: "#F5E1C4", // cream
    fg: "#16276B", // cobalt
    accent: "#0E1B4D", // deep cobalt
  },
  {
    slug: "fieldnotes",
    number: "03",
    name: "Field Notes",
    bg: "#F4EFE4", // warm paper
    fg: "#1E1B16", // carbon black
    accent: "#A34A2E", // brick red
  },
  {
    slug: "dither",
    number: "04",
    name: "The Transmission",
    bg: "#F5E1C4", // cream
    fg: "#16276B", // cobalt
    accent: "#C13B2A", // brick red (screaming)
  },
  {
    slug: "still",
    number: "05",
    name: "The Table",
    bg: "#070503", // near-black — fades through darkness
    fg: "#C69D60", // champagne gold
    accent: "#E8C687", // highlight gold
  },
];

export function conceptIndexFromPath(pathname: string): number {
  const seg = pathname.split("/")[1] ?? "";
  return CONCEPTS.findIndex((c) => c.slug === seg);
}
