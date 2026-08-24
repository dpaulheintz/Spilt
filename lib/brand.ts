/** Shared Spilt Social brand data — every concept draws from this. */

export const BRAND = {
  name: "SPILT SOCIAL",
  tagline: "Fill Your Cup.",
  positioning: "A private social club · Columbus, Ohio",
  membership: "Accepting members Spring 2026.",
  contact: "business@spiltsocial.com",
} as const;

export type SpiltEvent = {
  date: string; // MM/DD
  name: string;
  venue: string;
  city: string;
  time: string;
};

export const EVENTS: SpiltEvent[] = [
  {
    date: "09/16",
    name: "The Business Hop",
    venue: "Ohio Statehouse",
    city: "Columbus",
    time: "4:00 PM",
  },
  {
    date: "10/02",
    name: "Columbus Founders Fair",
    venue: "The Loom",
    city: "Columbus",
    time: "10:00 AM",
  },
  {
    date: "10/03",
    name: "MOVE Fest",
    venue: "Huntington Park",
    city: "Columbus",
    time: "2:00 PM",
  },
  {
    date: "10/05",
    name: "The Cincinnati Business Hop",
    venue: "Prim on 5th",
    city: "Cincinnati",
    time: "4:00 PM",
  },
];

/** Voice: edgy SF/NYC entrepreneurial; cocky but warm. Each page picks 3–5. */
export const COPY_BANK = [
  "Serendipity is a system.",
  "We manufacture luck.",
  "Your network is the moat.",
  "Get in the room.",
  "Columbus is early. That's the point.",
  "No name tags. No pitch decks. No small talk.",
  "The future shows up here first.",
  "Coffee is for closers. Cocktails are for cofounders.",
  "The rooms where Columbus actually gets built.",
] as const;

export const EVENTS_GATE_LINE = "Want to see the future?";
