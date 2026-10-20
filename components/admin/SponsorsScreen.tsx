"use client";

import { useState } from "react";
import { sponsorName } from "@/components/passport/SponsorMarquee";
import SortableList from "./SortableList";
import { Badge, Button, Card, HAIRLINE, MUTED, PageHeader, Toggle, pickLocalFile } from "./ui";

type Row = { key: string; name: string; src: string; active: boolean; isNew?: boolean };

export default function SponsorsScreen({ logos }: { logos: string[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    logos.map((file) => ({
      key: file,
      name: sponsorName(file),
      src: `/assets/passport/sponsors/${file}`,
      active: true,
    }))
  );
  const activeCount = rows.filter((r) => r.active).length;

  const add = () =>
    pickLocalFile("image/*", (url, file) =>
      setRows((prev) => [
        {
          key: `new-${Date.now()}`,
          name: sponsorName(file.name),
          src: url,
          active: true,
          isNew: true,
        },
        ...prev,
      ])
    );

  return (
    <div>
      <PageHeader
        title="Sponsors"
        description="The logos that scroll across the black band on the homepage. Drag to change the order; switch one off to take it out of the band."
        actions={<Button variant="gold">Save order</Button>}
      />

      {/* live strip preview */}
      <Card padded={false} className="mb-8 overflow-hidden">
        <p className="px-5 pt-4 pb-3 text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: MUTED }}>
          Preview · {activeCount} showing
        </p>
        <div
          className="flex gap-8 overflow-x-auto px-5 py-4"
          style={{ backgroundColor: "#000", borderTop: "1px solid #C69D60", borderBottom: "1px solid #C69D60" }}
        >
          {rows
            .filter((r) => r.active)
            .map((r) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={r.key} src={r.src} alt={r.name} className="h-10 w-auto shrink-0" />
            ))}
        </div>
      </Card>

      <button
        type="button"
        onClick={add}
        className="mb-6 flex w-full cursor-pointer flex-col items-center justify-center gap-1 border border-dashed py-8 text-center transition-colors hover:bg-white focus-visible:outline-2"
        style={{ borderColor: "rgba(198,157,96,0.7)" }}
      >
        <span className="text-[15px] font-medium">+ Add a sponsor logo</span>
        <span className="text-[12px]" style={{ color: MUTED }}>
          PNG or JPG. Logos should sit on a black background so they blend into the band.
        </span>
      </button>

      <SortableList
        items={rows}
        getKey={(r) => r.key}
        onReorder={setRows}
        renderItem={(r) => (
          <div
            className="flex items-center gap-4 border px-4 py-3"
            style={{ borderColor: HAIRLINE, backgroundColor: "#FFFDF8", opacity: r.active ? 1 : 0.5 }}
          >
            <div className="flex h-12 w-28 shrink-0 items-center justify-center overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.src} alt="" className="max-h-12 w-auto" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px]">{r.name}</p>
              {r.isNew && <Badge tone="gold">New — not saved</Badge>}
            </div>
            <div className="w-36 shrink-0">
              <Toggle
                label="Active"
                checked={r.active}
                onChange={(v) =>
                  setRows((prev) => prev.map((x) => (x.key === r.key ? { ...x, active: v } : x)))
                }
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
