"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SpiltEvent } from "@/lib/events";
import { renderEmail, type EmailBlock } from "@/lib/email-templates";
import {
  Button,
  Card,
  CHARCOAL,
  GOLD,
  HAIRLINE,
  MUTED,
  PageHeader,
  TextField,
  pickLocalFile,
  previewOnly,
} from "./ui";

type Draft =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; src: string; alt: string }
  | { id: string; type: "button"; label: string; href: string }
  | { id: string; type: "divider" }
  | { id: string; type: "events"; limit: number };

const BLOCK_LABELS: Record<Draft["type"], string> = {
  heading: "Heading",
  text: "Text",
  image: "Image",
  button: "Button",
  divider: "Divider",
  events: "Upcoming events",
};

let seq = 0;
const nid = () => `b${++seq}`;

function blank(type: Draft["type"]): Draft {
  switch (type) {
    case "heading":
      return { id: nid(), type, text: "A new heading" };
    case "text":
      return { id: nid(), type, text: "Write something worth reading." };
    case "image":
      return { id: nid(), type, src: "", alt: "" };
    case "button":
      return { id: nid(), type, label: "Get tickets", href: "https://posh.vip/g/spilt-social-1" };
    case "divider":
      return { id: nid(), type };
    case "events":
      return { id: nid(), type, limit: 3 };
  }
}

function emailDate(iso: string) {
  const p = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    timeZone: "America/New_York",
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("weekday")} · ${g("month")} ${g("day")}`.toUpperCase();
}

export default function NewsletterScreen({
  events,
  counts,
}: {
  events: SpiltEvent[];
  counts: { main: number; donors: number };
}) {
  const [subject, setSubject] = useState("What's on at Spilt this month");
  const [preheader, setPreheader] = useState("New rooms, new people, and a few seats left.");
  const [blocks, setBlocks] = useState<Draft[]>(() => [
    { id: nid(), type: "heading", text: "This month at Spilt" },
    {
      id: nid(),
      type: "text",
      text: "The calendar's filling up. Here's where we'll be — come find your people, and bring someone who should meet them.",
    },
    { id: nid(), type: "events", limit: 3 },
    { id: nid(), type: "button", label: "See every event", href: "https://posh.vip/g/spilt-social-1" },
    { id: nid(), type: "divider" },
    { id: nid(), type: "text", text: "See you in the room,\nThe Spilt Social team" },
  ]);
  const [audience, setAudience] = useState<"main" | "donors" | "both">("main");
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");
  const [scheduling, setScheduling] = useState(false);
  const [frameH, setFrameH] = useState(900);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const recipients =
    audience === "main" ? counts.main : audience === "donors" ? counts.donors : counts.main + counts.donors;

  const rendered = useMemo(() => {
    const emailBlocks: EmailBlock[] = blocks.map((b): EmailBlock => {
      if (b.type === "events")
        return {
          type: "events",
          events: events.slice(0, b.limit).map((e) => ({
            title: e.title,
            date: `${emailDate(e.dateISO)} · ${e.timeDisplay}`,
            venue: [e.venue, e.city].filter(Boolean).join(", "),
            url: e.poshUrl,
          })),
        };
      const { id: _id, ...rest } = b;
      return rest as EmailBlock;
    });
    const { html } = renderEmail({
      blocks: emailBlocks,
      preheader,
      footer: "Spilt Social · Columbus, Ohio · You're getting this because you joined the list at spiltsocial.com. Unsubscribe",
    });
    // preview only: links are inert so clicks don't navigate the frame
    return html.replace("</head>", "<style>a{pointer-events:none;cursor:default}</style></head>");
  }, [blocks, events, preheader]);

  const update = (id: string, patch: Partial<Draft>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Draft) : b)));
  const remove = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const move = (i: number, d: -1 | 1) =>
    setBlocks((prev) => {
      const j = i + d;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const fitFrame = () => {
    const doc = frameRef.current?.contentDocument;
    if (doc?.body) setFrameH(Math.max(400, doc.documentElement.scrollHeight + 4));
  };

  // width change reflows the email without a reload — re-measure after
  // the 300ms width transition settles
  useEffect(() => {
    const t = setTimeout(fitFrame, 340);
    return () => clearTimeout(t);
  }, [view]);

  const editor = (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-col gap-4">
          <TextField label="Subject" value={subject} onChange={setSubject} />
          <TextField
            label="Preview text"
            hint="The grey line inboxes show after the subject."
            value={preheader}
            onChange={setPreheader}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {blocks.map((b, i) => (
          <Card key={b.id}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold tracking-[0.16em] uppercase" style={{ color: MUTED }}>
                {BLOCK_LABELS[b.type]}
              </span>
              <span className="flex">
                <Button variant="quiet" aria-label="Move block up" onClick={() => move(i, -1)} disabled={i === 0} className="!px-3">
                  ▲
                </Button>
                <Button
                  variant="quiet"
                  aria-label="Move block down"
                  onClick={() => move(i, 1)}
                  disabled={i === blocks.length - 1}
                  className="!px-3"
                >
                  ▼
                </Button>
                <Button variant="quiet" aria-label="Remove block" onClick={() => remove(b.id)} className="!px-3">
                  ✕
                </Button>
              </span>
            </div>
            {b.type === "heading" && (
              <TextField label="Heading text" value={b.text} onChange={(text) => update(b.id, { text })} />
            )}
            {b.type === "text" && (
              <TextField
                label="Text"
                multiline
                hint="Leave a blank line to start a new paragraph."
                value={b.text}
                onChange={(text) => update(b.id, { text })}
              />
            )}
            {b.type === "image" && (
              <div className="flex flex-col gap-3">
                {b.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.src} alt="" className="max-h-48 w-auto border" style={{ borderColor: HAIRLINE }} />
                ) : (
                  <p className="text-[13px]" style={{ color: MUTED }}>
                    No image chosen yet.
                  </p>
                )}
                <div>
                  <Button onClick={() => pickLocalFile("image/*", (src) => update(b.id, { src }))}>
                    {b.src ? "Replace image" : "Choose image"}
                  </Button>
                </div>
                <TextField
                  label="Describe the image"
                  hint="Shown if the image doesn't load, and read aloud to screen readers."
                  value={b.alt}
                  onChange={(alt) => update(b.id, { alt })}
                />
              </div>
            )}
            {b.type === "button" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Button text" value={b.label} onChange={(label) => update(b.id, { label })} />
                <TextField label="Link" type="url" value={b.href} onChange={(href) => update(b.id, { href })} />
              </div>
            )}
            {b.type === "divider" && (
              <p className="text-[13px]" style={{ color: MUTED }}>
                A thin gold line.
              </p>
            )}
            {b.type === "events" && (
              <div>
                <p className="text-[14px]">Filled in automatically from the passport.</p>
                <label className="mt-3 flex items-center gap-2 text-[14px]">
                  Show the next
                  <select
                    value={b.limit}
                    onChange={(e) => update(b.id, { limit: Number(e.target.value) })}
                    className="min-h-[44px] cursor-pointer border bg-white px-3"
                    style={{ borderColor: HAIRLINE, color: CHARCOAL, outlineColor: GOLD }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {b.limit === 1 ? "event" : "events"}
                </label>
                <ul className="mt-3 text-[13px]" style={{ color: MUTED }}>
                  {events.slice(0, b.limit).map((e) => (
                    <li key={e.id}>· {e.title}</li>
                  ))}
                  {events.length === 0 && <li>No upcoming events right now — this block will be left out.</li>}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium">Add a block</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BLOCK_LABELS) as Draft["type"][]).map((t) => (
            <Button key={t} onClick={() => setBlocks((prev) => [...prev, blank(t)])}>
              + {BLOCK_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const preview = (
    <div className="xl:sticky xl:top-24">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div role="group" aria-label="Preview size" className="flex">
          {(["desktop", "mobile"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className="min-h-[40px] cursor-pointer border px-4 text-[13px] capitalize"
              style={{
                borderColor: view === v ? CHARCOAL : HAIRLINE,
                backgroundColor: view === v ? CHARCOAL : "transparent",
                color: view === v ? "#FAF6EE" : CHARCOAL,
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="text-[12px]" style={{ color: MUTED }}>
          Live preview
        </span>
      </div>

      {/* inbox row */}
      <div className="border border-b-0 bg-white px-4 py-3" style={{ borderColor: HAIRLINE }}>
        <p className="truncate text-[14px]">
          <strong className="font-semibold">Spilt Social</strong>
          <span className="mx-2" style={{ color: MUTED }}>
            ·
          </span>
          {subject || "(no subject)"}
        </p>
        <p className="truncate text-[13px]" style={{ color: MUTED }}>
          {preheader}
        </p>
      </div>
      <div
        className="flex justify-center overflow-hidden border"
        style={{ borderColor: HAIRLINE, backgroundColor: "#E9E1D2" }}
      >
        <iframe
          ref={frameRef}
          title="Email preview"
          srcDoc={rendered}
          sandbox="allow-same-origin"
          onLoad={fitFrame}
          className="block border-0 bg-white transition-[width] duration-300"
          style={{ width: view === "mobile" ? 375 : "100%", maxWidth: "100%", height: frameH }}
        />
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Newsletter"
        description="Write an email, see exactly how it'll look, and send it to your lists."
      />

      {/* phones: switch between editing and preview */}
      <div role="tablist" aria-label="Composer view" className="mb-5 flex xl:hidden">
        {(["edit", "preview"] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={mobilePane === p}
            onClick={() => setMobilePane(p)}
            className="min-h-[44px] flex-1 cursor-pointer border text-[14px] capitalize"
            style={{
              borderColor: mobilePane === p ? CHARCOAL : HAIRLINE,
              backgroundColor: mobilePane === p ? CHARCOAL : "transparent",
              color: mobilePane === p ? "#FAF6EE" : CHARCOAL,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className={mobilePane === "edit" ? "" : "hidden xl:block"}>{editor}</div>
        <div className={mobilePane === "preview" ? "" : "hidden xl:block"}>{preview}</div>
      </div>

      {/* send bar */}
      <Card className="mt-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium">Send to</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["main", `Main · ${counts.main.toLocaleString()}`],
                  ["donors", `Donors · ${counts.donors.toLocaleString()}`],
                  ["both", "Both lists"],
                ] as const
              ).map(([k, label]) => (
                <label
                  key={k}
                  className="flex min-h-[44px] cursor-pointer items-center gap-2 border px-4 text-[14px]"
                  style={{ borderColor: audience === k ? CHARCOAL : HAIRLINE }}
                >
                  <input
                    type="radio"
                    name="audience"
                    checked={audience === k}
                    onChange={() => setAudience(k)}
                    style={{ accentColor: CHARCOAL }}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
              {audience === "both"
                ? `Up to ${recipients.toLocaleString()} people — anyone on both lists gets it once.`
                : `${recipients.toLocaleString()} people.`}
            </p>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            {scheduling && (
              <label className="flex items-center gap-2 text-[14px]">
                <span className="sr-only">Send at</span>
                <input
                  type="datetime-local"
                  className="min-h-[44px] border bg-white px-3"
                  style={{ borderColor: HAIRLINE, outlineColor: GOLD }}
                />
              </label>
            )}
            <Button onClick={previewOnly}>Send test to me</Button>
            <Button onClick={() => (scheduling ? previewOnly() : setScheduling(true))}>
              {scheduling ? "Confirm schedule" : "Schedule"}
            </Button>
            <Button variant="gold" onClick={previewOnly}>
              Send now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
