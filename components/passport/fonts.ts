import { Inter, Libre_Caslon_Display, Libre_Caslon_Text } from "next/font/google";

/* Brand heading face — Libre Caslon Text, Display for the largest sizes */
export const heading = Libre_Caslon_Text({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-heading",
});

export const headingXL = Libre_Caslon_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading-xl",
});

/*
 * ─────────────────────────────────────────────────────────────
 * SWAP TO NEUE HAAS UNICA PRO — replace this one font definition.
 * Inter is a temporary stand-in until the licensed font arrives.
 * When it does: swap this for a next/font/local call pointing at
 * the Unica Pro woff2 files, keep the same `--font-body` variable,
 * and nothing else in the codebase needs to change.
 * ─────────────────────────────────────────────────────────────
 */
export const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const passportFontVars = `${heading.variable} ${headingXL.variable} ${body.variable}`;
