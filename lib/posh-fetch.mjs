/**
 * Posh event fetcher — shared by scripts/fetch-posh.mjs (CLI) and
 * /api/refresh-events (cron route).
 *
 * Strategy, in order:
 *  (a) Posh's underlying JSON API. The group page's frontend calls
 *      GET https://posh.vip/api/web/v2/util/group_url/<slug>
 *      which returns { group, events: [...] } — unauthenticated, plain
 *      fetch. ← THIS IS THE ONE THAT WORKS.
 *  (b) Individual event pages (posh.vip/e/<slug>) server-render their
 *      data inside the RSC flight payload (self.__next_f.push chunks);
 *      we parse name/startUtc/venue out of known slugs as a fallback.
 *  (c) Headless chromium (playwright-core + @sparticuz/chromium) —
 *      intentionally NOT implemented: (a) is a stable JSON endpoint and
 *      (b) covers the regression case without a 50MB browser binary.
 */

const GROUP_SLUG = "spilt-social-1";
const API_URL = `https://posh.vip/api/web/v2/util/group_url/${GROUP_SLUG}`;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/** Keyword classification — mirror of lib/formats.ts (kept in plain JS
 *  so the CLI script can run without a TS toolchain). */
export function classifyFormat(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("move") && t.includes("mingle")) return "move-and-mingle";
  if (t.includes("move fest") || t.includes("movefest")) return "move-fest";
  if (t.includes("business hop")) return "business-hop";
  if (t.includes("founders fair") || t.includes("founder's fair"))
    return "founders-fair";
  if (t.includes("tapt")) return "tapt";
  return "other";
}

function normalizeEvent(e) {
  const venueObj = e.venue || {};
  const address = venueObj.address || "";
  const cityMatch = address.match(/,\s*([A-Za-z .'-]+),\s*[A-Z]{2}\b/);
  const start = new Date(e.startUtc);
  const timeDisplay = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: e.timezone || "America/New_York",
  });
  return {
    id: e.id || e.url,
    title: e.name,
    format: classifyFormat(e.name),
    dateISO: e.startUtc,
    timeDisplay,
    venue: venueObj.name || "Location revealed after approval",
    city: cityMatch ? cityMatch[1].trim() : "",
    poshUrl: `https://posh.vip/e/${e.url}`,
    imageUrl: e.flyer || "",
  };
}

/** (a) primary: group JSON API */
async function fetchViaApi() {
  const res = await fetch(API_URL, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`group API ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.events)) throw new Error("group API: no events array");
  return data.events
    .filter((e) => e && e.name && e.startUtc)
    .map(normalizeEvent);
}

/** (b) fallback: parse a server-rendered event page's flight payload */
export async function fetchEventPage(slug) {
  const res = await fetch(`https://posh.vip/e/${slug}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`event page ${slug}: ${res.status}`);
  const html = await res.text();
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/gs)];
  const text = chunks
    .map((m) => {
      try {
        return JSON.parse(`"${m[1]}"`);
      } catch {
        return "";
      }
    })
    .join("");
  const name = text.match(/"name":"([^"]+)","flyer"/)?.[1];
  const startUtc = text.match(/"startUtc":"([^"]+)"/)?.[1];
  const venueName = text.match(/"venueName":"([^"]*)"/)?.[1];
  const timezone = text.match(/"timezone":"([^"]+)"/)?.[1];
  if (!name || !startUtc) throw new Error(`event page ${slug}: no data in flight payload`);
  return normalizeEvent({
    id: slug,
    url: slug,
    name,
    startUtc,
    timezone,
    venue: { name: venueName || "", address: "" },
  });
}

const KNOWN_SLUGS = [
  "the-columbus-business-hop-at-the-ohio-statehouse",
  "founders-fair-columbus",
  "move-fest-2026",
  "the-cincinnati-business-hop-at-prim",
  "tapt-social",
];

/** Fetch + normalize. Throws only if every strategy fails. */
export async function fetchPoshEvents() {
  try {
    const events = await fetchViaApi();
    return { strategy: "a (group JSON API)", events };
  } catch (err) {
    console.error("[posh] strategy (a) failed:", err.message);
  }
  const events = [];
  for (const slug of KNOWN_SLUGS) {
    try {
      events.push(await fetchEventPage(slug));
    } catch (err) {
      console.error(`[posh] strategy (b) ${slug}:`, err.message);
    }
  }
  if (events.length === 0)
    throw new Error("all fetch strategies failed (a: API, b: event pages)");
  return { strategy: "b (event-page flight payloads)", events };
}

/** Basic sanity validation before persisting a refresh. */
export function validateEvents(events) {
  return (
    Array.isArray(events) &&
    events.every(
      (e) =>
        e &&
        typeof e.title === "string" &&
        e.title.length > 0 &&
        !Number.isNaN(Date.parse(e.dateISO)) &&
        typeof e.poshUrl === "string" &&
        e.poshUrl.startsWith("https://posh.vip/")
    )
  );
}
