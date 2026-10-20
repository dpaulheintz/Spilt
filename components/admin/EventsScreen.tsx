"use client";

import { useState } from "react";
import type { SpiltEvent } from "@/lib/events";
import Sticker from "@/components/passport/Sticker";
import { Badge, Button, Card, MUTED, PageHeader, Toggle } from "./ui";

function fmtDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    });
}

export default function EventsScreen({ events }: { events: SpiltEvent[] }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [featured, setFeatured] = useState<Set<string>>(new Set());

  const flip = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  // simulated — does NOT call /api/refresh-events
  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync(`Found ${events.length} ${events.length === 1 ? "event" : "events"} · last synced just now`);
    }, 1500);
  };

  return (
    <div>
      <PageHeader
        title="Events"
        description="Events come straight from Posh. The site checks for new ones every night — or pull them in now."
      />

      <Card className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-medium">Posh — Spilt Social group</p>
            <p className="mt-1 text-[13px]" style={{ color: MUTED }} aria-live="polite">
              {syncing ? "Checking Posh for new events…" : lastSync ?? "Synced automatically every night, around 2–3am"}
            </p>
          </div>
          <Button variant="gold" onClick={sync} disabled={syncing} className="sm:min-w-[180px]">
            {syncing ? (
              <>
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
                Syncing…
              </>
            ) : (
              "Sync with Posh"
            )}
          </Button>
        </div>
      </Card>

      <p className="mb-4 text-[13px]" style={{ color: MUTED }}>
        {events.length} upcoming {events.length === 1 ? "event" : "events"} in the passport, in the order they appear.
        Past events drop off on their own.
      </p>

      <div className="flex flex-col gap-4">
        {events.map((ev) => {
          const isHidden = hidden.has(ev.id);
          return (
            <Card key={ev.id}>
              <div
                className="flex flex-col gap-5 transition-opacity duration-200 md:flex-row md:items-center"
                style={{ opacity: isHidden ? 0.45 : 1 }}
              >
                <div className="w-[120px] shrink-0">
                  <Sticker format={ev.format} width={120} rotation={-2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {featured.has(ev.id) && <Badge tone="gold">Featured</Badge>}
                    {isHidden && <Badge>Hidden</Badge>}
                  </div>
                  <h2 className="font-heading mt-1 text-xl leading-snug">{ev.title}</h2>
                  <p className="mt-1 font-mono text-[12px] tracking-[0.06em]" style={{ color: MUTED }}>
                    {fmtDate(ev.dateISO).toUpperCase()} · {ev.timeDisplay}
                  </p>
                  <p className="mt-0.5 text-[14px]" style={{ color: MUTED }}>
                    {ev.venue}
                    {ev.city ? `, ${ev.city}` : ""}
                  </p>
                  <a
                    href={ev.poshUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[13px] underline underline-offset-4"
                  >
                    Open on Posh ↗
                  </a>
                </div>
                <div className="flex shrink-0 flex-col gap-3 md:w-56">
                  <Toggle
                    label="Show on site"
                    checked={!isHidden}
                    onChange={() => setHidden((s) => flip(s, ev.id))}
                  />
                  <Toggle
                    label="Feature"
                    description="Pin to the front of the passport"
                    checked={featured.has(ev.id)}
                    onChange={() => setFeatured((s) => flip(s, ev.id))}
                  />
                </div>
              </div>
            </Card>
          );
        })}
        {events.length === 0 && (
          <Card>
            <p className="text-[15px]">No upcoming events right now.</p>
            <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
              New events published on Posh show up here after the next sync.
            </p>
          </Card>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="gold">Save changes</Button>
      </div>
    </div>
  );
}
