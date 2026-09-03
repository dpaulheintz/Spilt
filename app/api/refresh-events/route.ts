import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;

/**
 * Nightly event refresh, hit by Vercel Cron (see vercel.json — 07:00 UTC
 * ≈ 2–3am Eastern year-round). Protected by CRON_SECRET.
 *
 * Resilience contract: a failed or garbage scrape NEVER overwrites the
 * last good data — we validate before writing, and on any error we
 * return 500 while the previous blob/file stays untouched.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const provided = auth?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { fetchPoshEvents, validateEvents } = await import(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — shared plain-JS module, also used by the CLI script
      "../../../lib/posh-fetch.mjs"
    );
    const { strategy, events } = await fetchPoshEvents();
    if (!validateEvents(events) || events.length === 0) {
      throw new Error(`scrape returned invalid data (${events?.length ?? 0} events)`);
    }

    const payload = JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        strategy,
        events: [...events].sort((a: { dateISO: string }, b: { dateISO: string }) =>
          a.dateISO.localeCompare(b.dateISO)
        ),
      },
      null,
      2
    );

    let store = "none";
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      await put("spilt/events.json", payload, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      store = "vercel-blob";
    } else {
      // local/dev: write the repo data file directly
      const { writeFile } = await import("node:fs/promises");
      const path = await import("node:path");
      await writeFile(path.join(process.cwd(), "data", "events.json"), payload);
      store = "local-fs";
    }

    revalidatePath("/passport");
    return NextResponse.json({ ok: true, strategy, count: events.length, store });
  } catch (err) {
    // last good data is preserved by construction — nothing was written
    console.error("[refresh-events] failed, keeping last good data:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
