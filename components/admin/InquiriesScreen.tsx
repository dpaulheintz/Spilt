"use client";

import { useId, useState } from "react";
import type { InquiryStatus, SampleInquiry } from "@/lib/admin-samples";
import Sticker from "@/components/passport/Sticker";
import type { FormatSlug } from "@/lib/formats";
import { Badge, Button, Card, CHARCOAL, GOLD, HAIRLINE, MUTED, PageHeader } from "./ui";

const STATUSES: InquiryStatus[] = ["New", "Contacted", "In talks", "Signed", "Passed"];

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });

function StatusPill({ status }: { status: InquiryStatus }) {
  const tone = status === "New" ? "gold" : status === "Signed" ? "good" : status === "Passed" ? "warn" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export default function InquiriesScreen({
  inquiries,
  formatNames,
}: {
  inquiries: SampleInquiry[];
  formatNames: Record<string, string>;
}) {
  const [items, setItems] = useState(inquiries);
  const [openId, setOpenId] = useState<string | null>(inquiries[0]?.id ?? null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const selectId = useId();
  const open = items.find((i) => i.id === openId) ?? null;

  const setStatus = (id: string, status: InquiryStatus) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));

  return (
    <div>
      <PageHeader
        title="Partner Inquiries"
        description="Everyone who fills out the Become a Partner form. Each one is also emailed to business@spiltsocial.com."
        actions={<Button>Export CSV</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* inbox */}
        <Card padded={false} className={mobileDetail ? "hidden lg:block" : ""}>
          <ul>
            {items.map((i) => {
              const active = i.id === openId;
              return (
                <li key={i.id} className="border-b last:border-b-0" style={{ borderColor: HAIRLINE }}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(i.id);
                      setMobileDetail(true);
                    }}
                    aria-current={active ? "true" : undefined}
                    className="flex w-full cursor-pointer flex-col gap-1 border-l-2 px-5 py-4 text-left transition-colors hover:bg-white"
                    style={{
                      borderLeftColor: active ? GOLD : "transparent",
                      backgroundColor: active ? "rgba(198,157,96,0.08)" : undefined,
                    }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-[15px] font-medium">{i.organization}</span>
                      <span className="shrink-0 text-[12px]" style={{ color: MUTED }}>
                        {when(i.receivedAt)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-[13px]" style={{ color: MUTED }}>
                        {i.name}
                      </span>
                      <span className="flex shrink-0 gap-1.5">
                        <Badge tone="sample">Sample</Badge>
                        <StatusPill status={i.status} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* detail */}
        {open && (
          <Card className={mobileDetail ? "" : "hidden lg:block"}>
            <button
              type="button"
              onClick={() => setMobileDetail(false)}
              className="mb-4 inline-flex min-h-[44px] cursor-pointer items-center text-[14px] lg:hidden"
            >
              ← All inquiries
            </button>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge tone="sample">Sample inquiry</Badge>
                <h2 className="font-heading mt-2 text-2xl">{open.organization}</h2>
                <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
                  Received {when(open.receivedAt)}
                </p>
              </div>
              <div>
                <label htmlFor={selectId} className="mb-1 block text-[12px] font-medium">
                  Status
                </label>
                <select
                  id={selectId}
                  value={open.status}
                  onChange={(e) => setStatus(open.id, e.target.value as InquiryStatus)}
                  className="min-h-[44px] cursor-pointer border bg-white px-3 text-[14px] focus:outline-2"
                  style={{ borderColor: HAIRLINE, color: CHARCOAL, outlineColor: GOLD }}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <dl className="mt-6 grid gap-x-8 gap-y-4 border-t pt-6 sm:grid-cols-2" style={{ borderColor: HAIRLINE }}>
              {(
                [
                  ["Name", open.name],
                  ["Organization", open.organization],
                  ["Email", open.email],
                  ["Phone", open.phone],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[12px] tracking-[0.12em] uppercase" style={{ color: MUTED }}>
                    {k}
                  </dt>
                  <dd className="mt-1 text-[15px] break-words">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6">
              <p className="mb-3 text-[12px] tracking-[0.12em] uppercase" style={{ color: MUTED }}>
                Interested in
              </p>
              <div className="flex flex-wrap gap-3">
                {open.interests.map((s) => (
                  <span key={s} title={formatNames[s]}>
                    <Sticker format={s as FormatSlug} label={formatNames[s]} width={120} rotation={0} />
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
                Decks for these were attached to their thank-you email.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t pt-6" style={{ borderColor: HAIRLINE }}>
              <Button variant="gold">Reply by email</Button>
              <Button>Save status</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
