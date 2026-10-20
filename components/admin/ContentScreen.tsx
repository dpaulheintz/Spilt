"use client";

import { useMemo, useState } from "react";
import type { ContentField, SiteContent } from "@/lib/content-store";
import {
  Button,
  Card,
  CHARCOAL,
  GOLD,
  HAIRLINE,
  MUTED,
  PageHeader,
  TextField,
  Toggle,
  pickLocalFile,
  previewOnly,
} from "./ui";

const PAGE_LABEL = { home: "Homepage", partner: "Partner page" } as const;

function MediaField({
  field,
  value,
  onChange,
}: {
  field: ContentField;
  value: string;
  onChange: (v: string) => void;
}) {
  const isVideo = field.type === "video";
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium">{field.label}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden border sm:w-48"
          style={{ borderColor: HAIRLINE, backgroundColor: "#F4EEE2" }}
        >
          {value ? (
            isVideo ? (
              <video src={value} muted loop autoPlay playsInline className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="px-3 text-center text-[12px]" style={{ color: MUTED }}>
              No photo yet — the site shows a styled placeholder
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() =>
              pickLocalFile(isVideo ? "video/*" : "image/*", (url, file) => {
                onChange(url);
                setFileName(file.name);
              })
            }
          >
            {value ? "Replace" : "Add"} {isVideo ? "video" : "photo"}
          </Button>
          <p className="max-w-[16rem] truncate text-[12px]" style={{ color: MUTED }}>
            {fileName ?? (value ? value.split("/").pop() : "")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ContentScreen({ content }: { content: SiteContent }) {
  // in-memory working copy; a reload throws it away
  const [sections, setSections] = useState(() => structuredClone(content.sections));

  const original = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of content.sections) for (const f of s.fields) m.set(`${s.key}.${f.key}`, f.value);
    return m;
  }, [content]);

  const changed = sections.reduce(
    (n, s) => n + s.fields.filter((f) => original.get(`${s.key}.${f.key}`) !== f.value).length,
    0
  );

  const update = (sectionKey: string, fieldKey: string, value: string) =>
    setSections((prev) =>
      prev.map((s) =>
        s.key !== sectionKey
          ? s
          : { ...s, fields: s.fields.map((f) => (f.key === fieldKey ? { ...f, value } : f)) }
      )
    );

  const pages = (["home", "partner"] as const).map((page) => ({
    page,
    sections: sections.filter((s) => s.page === page),
  }));

  return (
    <div>
      <PageHeader
        title="Site Content"
        description="Every word and photo on the website, in the order it appears. Edit anything, then save."
      />

      {/* jump list */}
      <nav aria-label="Jump to section" className="mb-10 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.key}
            href={`#section-${s.key}`}
            className="border px-3 py-1.5 text-[13px] transition-colors hover:bg-white"
            style={{ borderColor: HAIRLINE }}
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-12">
        {pages.map(({ page, sections: list }) => (
          <section key={page} aria-labelledby={`page-${page}`}>
            <h2
              id={`page-${page}`}
              className="mb-4 text-[12px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: MUTED }}
            >
              {PAGE_LABEL[page]}
            </h2>
            <div className="flex flex-col gap-6">
              {list.map((s) => (
                <Card key={s.key}>
                  <div id={`section-${s.key}`} className="scroll-mt-28">
                    <h3 className="font-heading mb-5 text-xl">{s.label}</h3>
                    <div className="flex flex-col gap-5">
                      {s.fields.map((f) => {
                        const key = `${s.key}.${f.key}`;
                        const edited = original.get(key) !== f.value;
                        return (
                          <div key={key} className="relative">
                            {edited && (
                              <span
                                aria-label="Edited"
                                className="absolute top-1.5 -left-3 h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: GOLD }}
                              />
                            )}
                            {f.type === "image" || f.type === "video" ? (
                              <MediaField field={f} value={f.value} onChange={(v) => update(s.key, f.key, v)} />
                            ) : f.type === "toggle" ? (
                              <Toggle
                                label={f.label}
                                checked={f.value !== "false"}
                                onChange={(v) => update(s.key, f.key, v ? "true" : "false")}
                              />
                            ) : (
                              <TextField
                                label={f.label}
                                value={f.value}
                                multiline={f.type === "textarea"}
                                type={f.type === "url" ? "url" : f.type === "email" ? "email" : "text"}
                                onChange={(v) => update(s.key, f.key, v)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* save bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t px-4 py-3 transition-transform duration-300 lg:left-60"
        style={{
          borderColor: HAIRLINE,
          backgroundColor: "rgba(250,246,238,0.96)",
          transform: changed > 0 ? "translateY(0)" : "translateY(110%)",
        }}
        inert={changed === 0}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <p className="text-[14px]" style={{ color: CHARCOAL }}>
            {changed} unsaved {changed === 1 ? "change" : "changes"}
          </p>
          <div className="flex gap-2">
            <Button variant="quiet" onClick={() => setSections(structuredClone(content.sections))}>
              Discard
            </Button>
            <Button variant="gold" onClick={previewOnly}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
