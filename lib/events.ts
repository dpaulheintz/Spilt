import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { classifyFormat, type FormatSlug } from "./formats";

export type SpiltEvent = {
  id: string;
  title: string;
  format: FormatSlug;
  dateISO: string;
  timeDisplay: string;
  venue: string;
  city: string;
  poshUrl: string;
  imageUrl: string;
};

type EventsFile = { fetchedAt?: string; events: SpiltEvent[] };

async function readLocal(name: string): Promise<EventsFile | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", name), "utf8");
    return JSON.parse(raw) as EventsFile;
  } catch {
    return null;
  }
}

/** Latest refreshed data from Vercel Blob (written by /api/refresh-events). */
async function readBlob(): Promise<EventsFile | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "spilt/events.json", limit: 1 });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as EventsFile;
  } catch (err) {
    console.error("[events] blob read failed:", err);
    return null;
  }
}

/**
 * Load events for rendering: freshest store wins, then the committed
 * data file, then the hand-editable fallback. Only FUTURE events are
 * returned — past events drop automatically at render time, so expired
 * entries disappear even between refreshes.
 */
export async function loadEvents(): Promise<SpiltEvent[]> {
  const source =
    (await readBlob()) ?? (await readLocal("events.json")) ?? { events: [] };

  const now = Date.now();
  let future = (source.events ?? [])
    .filter((e) => e && e.title && !Number.isNaN(Date.parse(e.dateISO)))
    .map((e) => ({ ...e, format: e.format ?? classifyFormat(e.title) }))
    .filter((e) => Date.parse(e.dateISO) > now)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  if (future.length === 0) {
    const fallback = await readLocal("events-fallback.json");
    future = (fallback?.events ?? []).filter(
      (e) => Date.parse(e.dateISO) > now
    );
    // a stale fallback beats an empty book — keep even past fallback
    // entries if literally nothing else exists
    if (future.length === 0) future = fallback?.events ?? [];
  }
  return future;
}
