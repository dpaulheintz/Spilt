/**
 * Branded email renderer — pure string functions, safe on server and
 * client. The partner emails and the admin newsletter preview both go
 * through renderEmail(), so what the team previews is what gets sent.
 *
 * Email clients ignore web fonts unreliably, so headings ask for Libre
 * Caslon but fall back to Georgia/Times; layout is table-based with
 * inline styles for Outlook and Gmail.
 */

export type EmailBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "button"; label: string; href: string }
  | { type: "divider" }
  | {
      type: "events";
      events: { title: string; date: string; venue: string; url: string }[];
    }
  | { type: "fields"; rows: [string, string][] };

const C = {
  page: "#F4EEE2",
  card: "#FAF6EE",
  ink: "#2A2620",
  muted: "#6E665B",
  gold: "#C69D60",
  rule: "#E3D6BE",
};
const SERIF = "'Libre Caslon Text', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, monospace";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** only http(s) and mailto survive; anything else becomes "#" */
function safeHref(href: string): string {
  return /^(https?:|mailto:)/i.test(href.trim()) ? escapeHtml(href.trim()) : "#";
}

/** images: absolute http(s), site-relative paths, and local previews
 *  (blob:/data:image from the admin's file picker); anything else drops */
function safeSrc(src: string): string {
  return /^(https?:|blob:|data:image\/|\/)/i.test(src.trim()) ? escapeHtml(src.trim()) : "";
}

/** plain text → paragraphs; blank lines split paragraphs, single newlines break */
function paragraphs(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.ink};">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
    )
    .join("");
}

function goldRule(): string {
  return `<tr><td style="padding:8px 0 24px;"><div style="height:1px;line-height:1px;font-size:0;background:${C.gold};">&nbsp;</div></td></tr>`;
}

function renderBlock(b: EmailBlock): string {
  switch (b.type) {
    case "heading":
      return `<tr><td style="padding:4px 0 14px;"><h1 style="margin:0;font-family:${SERIF};font-weight:400;font-size:28px;line-height:1.25;color:${C.ink};">${escapeHtml(b.text)}</h1></td></tr>`;
    case "text":
      return `<tr><td>${paragraphs(b.text)}</td></tr>`;
    case "image":
      return safeSrc(b.src)
        ? `<tr><td style="padding:4px 0 20px;"><img src="${safeSrc(b.src)}" alt="${escapeHtml(b.alt)}" width="520" style="display:block;width:100%;max-width:520px;height:auto;border:0;"></td></tr>`
        : "";
    case "button":
      return `<tr><td style="padding:8px 0 24px;"><a href="${safeHref(b.href)}" style="display:inline-block;background:${C.gold};color:${C.ink};font-family:${SANS};font-size:14px;font-weight:600;letter-spacing:0.04em;text-decoration:none;padding:14px 28px;">${escapeHtml(b.label)}</a></td></tr>`;
    case "divider":
      return goldRule();
    case "events":
      if (b.events.length === 0) return "";
      return `<tr><td style="padding:0 0 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${b.events
        .map(
          (e) =>
            `<tr><td style="padding:14px 0;border-top:1px solid ${C.rule};"><p style="margin:0 0 4px;font-family:${MONO};font-size:11px;letter-spacing:0.12em;color:${C.muted};">${escapeHtml(e.date)}</p><p style="margin:0 0 4px;font-family:${SERIF};font-size:18px;color:${C.ink};">${escapeHtml(e.title)}</p><p style="margin:0 0 8px;font-family:${SANS};font-size:13px;color:${C.muted};">${escapeHtml(e.venue)}</p><a href="${safeHref(e.url)}" style="font-family:${SANS};font-size:13px;color:${C.ink};text-decoration:underline;">Details &amp; tickets</a></td></tr>`
        )
        .join("")}</table></td></tr>`;
    case "fields":
      return `<tr><td style="padding:0 0 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${b.rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 12px 8px 0;border-top:1px solid ${C.rule};font-family:${SANS};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:8px 0;border-top:1px solid ${C.rule};font-family:${SANS};font-size:14px;color:${C.ink};">${escapeHtml(v).replace(/\n/g, "<br>") || "—"}</td></tr>`
        )
        .join("")}</table></td></tr>`;
  }
}

function blockText(b: EmailBlock): string {
  switch (b.type) {
    case "heading":
      return b.text.toUpperCase();
    case "text":
      return b.text;
    case "image":
      return b.alt ? `[${b.alt}]` : "";
    case "button":
      return `${b.label}: ${b.href}`;
    case "divider":
      return "———";
    case "events":
      return b.events.map((e) => `${e.date} — ${e.title}, ${e.venue}\n${e.url}`).join("\n\n");
    case "fields":
      return b.rows.map(([k, v]) => `${k}: ${v || "—"}`).join("\n");
  }
}

export type RenderedEmail = { html: string; text: string };

export function renderEmail({
  blocks,
  preheader = "",
  footer = "Spilt Social · Columbus, Ohio",
}: {
  blocks: EmailBlock[];
  preheader?: string;
  footer?: string;
}): RenderedEmail {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Spilt Social</title></head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}&#8203;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};">
<tr><td style="padding:40px 40px 0;" class="px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:0 0 18px;font-family:${SERIF};font-size:15px;letter-spacing:0.22em;color:${C.ink};">SPILT SOCIAL</td></tr>
${goldRule()}
${blocks.map(renderBlock).join("\n")}
</table></td></tr>
<tr><td style="padding:8px 40px 36px;">
<div style="height:1px;line-height:1px;font-size:0;background:${C.gold};">&nbsp;</div>
<p style="margin:16px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};">${escapeHtml(footer)}</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

  const text = [
    "SPILT SOCIAL",
    "",
    ...blocks.map(blockText).filter(Boolean).flatMap((t) => [t, ""]),
    "—",
    footer,
  ].join("\n");

  return { html, text };
}
