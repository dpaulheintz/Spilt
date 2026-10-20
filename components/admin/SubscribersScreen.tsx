"use client";

import { useState } from "react";
import type { SampleSubscriber } from "@/lib/admin-samples";
import { Badge, Button, Card, CHARCOAL, GOLD, HAIRLINE, MUTED, PageHeader } from "./ui";

type ListKey = "main" | "donors";
type Lists = Record<ListKey, { label: string; count: number; rows: SampleSubscriber[] }>;

/** Small CSV parser: quoted fields, escaped quotes, CRLF. Preview only. */
function parseCsv(text: string, maxRows: number): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length && rows.length <= maxRows; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    if (row.some((c) => c.trim())) rows.push(row);
  }
  return rows;
}

function ImportPanel({ lists, onDone }: { lists: Lists; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [target, setTarget] = useState<ListKey>("main");

  const pick = async (f: File) => {
    setFile(f);
    setPreview(parseCsv(await f.slice(0, 64_000).text(), 6));
  };

  const header = preview?.[0] ?? [];
  const body = preview?.slice(1) ?? [];
  const emailCol = header.findIndex((h) => /e-?mail/i.test(h));

  return (
    <Card className="mb-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-heading text-xl">Import subscribers from a spreadsheet</h2>
        <Button variant="quiet" onClick={onDone}>
          Close
        </Button>
      </div>
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-1 border border-dashed py-8 text-center hover:bg-white"
        style={{ borderColor: "rgba(198,157,96,0.7)" }}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pick(f);
          }}
        />
        <span className="text-[15px] font-medium">{file ? file.name : "Choose a CSV file"}</span>
        <span className="text-[12px]" style={{ color: MUTED }}>
          Export from Posh, Mailchimp, or a spreadsheet. Needs a column with email addresses.
        </span>
      </label>

      {preview && (
        <div className="mt-6">
          <p className="mb-3 text-[14px]">
            Found <strong>{header.length}</strong> columns:{" "}
            {header.map((h, i) => (
              <span key={i} className="mr-1.5 inline-block">
                <Badge tone={i === emailCol ? "gold" : "neutral"}>{h || `Column ${i + 1}`}</Badge>
              </span>
            ))}
          </p>
          {emailCol === -1 && (
            <p className="mb-3 text-[13px]" style={{ color: "#A34A2E" }}>
              No email column found — the import needs one.
            </p>
          )}
          <div className="overflow-x-auto border" style={{ borderColor: HAIRLINE }}>
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr style={{ backgroundColor: "rgba(42,38,32,0.04)" }}>
                  {header.map((h, i) => (
                    <th key={i} className="px-3 py-2 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((r, ri) => (
                  <tr key={ri} className="border-t" style={{ borderColor: HAIRLINE }}>
                    {header.map((_, ci) => (
                      <td key={ci} className="px-3 py-2 whitespace-nowrap">
                        {r[ci] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
            Showing the first {body.length} rows.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="text-[14px]">
              Add to{" "}
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as ListKey)}
                className="ml-1 min-h-[44px] cursor-pointer border bg-white px-3"
                style={{ borderColor: HAIRLINE, color: CHARCOAL, outlineColor: GOLD }}
              >
                <option value="main">{lists.main.label}</option>
                <option value="donors">{lists.donors.label}</option>
              </select>
            </label>
            <Button variant="gold" disabled={emailCol === -1}>
              Import
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SubscribersScreen({ lists }: { lists: Lists }) {
  const [tab, setTab] = useState<ListKey>("main");
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const list = lists[tab];
  const q = query.trim().toLowerCase();
  const rows = q
    ? list.rows.filter((r) => r.email.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
    : list.rows;

  return (
    <div>
      <PageHeader
        title="Subscribers"
        description="People who signed up on the website or came over from an import. Two lists: everyone, and donors."
        actions={
          <>
            <Button onClick={() => setImporting(true)}>Import CSV</Button>
            <Button>Export CSV</Button>
          </>
        }
      />

      {importing && <ImportPanel lists={lists} onDone={() => setImporting(false)} />}

      <div role="tablist" aria-label="Subscriber lists" className="mb-5 flex gap-2">
        {(["main", "donors"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className="min-h-[44px] cursor-pointer border px-4 text-[14px] focus-visible:outline-2"
            style={{
              borderColor: tab === k ? CHARCOAL : HAIRLINE,
              backgroundColor: tab === k ? CHARCOAL : "transparent",
              color: tab === k ? "#FAF6EE" : CHARCOAL,
              outlineColor: GOLD,
            }}
          >
            {lists[k].label} · {lists[k].count.toLocaleString()}
          </button>
        ))}
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: HAIRLINE }}>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Search subscribers</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className="w-full border bg-white px-3.5 py-2.5 text-[14px] focus:outline-2"
              style={{ borderColor: HAIRLINE, outlineColor: GOLD }}
            />
          </label>
          <Badge tone="sample">Sample rows</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr style={{ color: MUTED }}>
                <th className="px-5 py-3 text-[12px] font-medium tracking-[0.1em] uppercase">Name</th>
                <th className="px-5 py-3 text-[12px] font-medium tracking-[0.1em] uppercase">Email</th>
                <th className="px-5 py-3 text-[12px] font-medium tracking-[0.1em] uppercase">Joined</th>
                <th className="px-5 py-3 text-[12px] font-medium tracking-[0.1em] uppercase">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email} className="border-t" style={{ borderColor: HAIRLINE }}>
                  <td className="px-5 py-3 whitespace-nowrap">{r.name}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{r.email}</td>
                  <td className="px-5 py-3 whitespace-nowrap tabular-nums" style={{ color: MUTED }}>
                    {new Date(`${r.joined}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap" style={{ color: MUTED }}>
                    {r.source}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center" style={{ color: MUTED }}>
                    No one matches “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t px-5 py-3 text-[12px]" style={{ borderColor: HAIRLINE, color: MUTED }}>
          Showing {rows.length} of {list.count.toLocaleString()} (sample)
        </p>
      </Card>
    </div>
  );
}
