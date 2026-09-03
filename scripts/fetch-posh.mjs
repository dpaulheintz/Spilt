#!/usr/bin/env node
/**
 * CLI: fetch Spilt Social's events from Posh and write data/events.json.
 * Usage: npm run fetch:events
 * Never wipes the previous file on failure — last good data survives.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fetchPoshEvents, validateEvents } from "../lib/posh-fetch.mjs";

const OUT = "data/events.json";

try {
  const { strategy, events } = await fetchPoshEvents();
  if (!validateEvents(events)) throw new Error("validation failed — refusing to write");
  const payload = {
    fetchedAt: new Date().toISOString(),
    strategy,
    events: events.sort((x, y) => x.dateISO.localeCompare(y.dateISO)),
  };
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n");
  console.log(`✓ ${events.length} events via strategy ${strategy} → ${OUT}`);
  const now = Date.now();
  for (const e of payload.events) {
    const future = Date.parse(e.dateISO) > now ? "future" : "past  ";
    console.log(`  [${future}] ${e.dateISO.slice(0, 10)}  ${e.format.padEnd(15)} ${e.title}`);
  }
} catch (err) {
  console.error("✗ fetch failed, keeping previous data:", err.message);
  try {
    const prev = JSON.parse(await readFile(OUT, "utf8"));
    console.error(`  last good: ${prev.events?.length ?? 0} events from ${prev.fetchedAt}`);
  } catch {
    console.error("  (no previous data file exists — the site will use data/events-fallback.json)");
  }
  process.exit(1);
}
