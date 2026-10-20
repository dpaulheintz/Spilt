import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCopy } from "@/lib/content-store";
import { sendEmail, emailConfigured, type EmailAttachment } from "@/lib/email";
import { renderEmail } from "@/lib/email-templates";
import { FORMATS, formatName, type FormatSlug } from "@/lib/formats";

/**
 * Partner inquiry endpoint.
 *
 * 1. validate + honeypot + per-IP rate limit
 * 2. branded thank-you to the submitter, with the sponsorship deck PDF
 *    for each checked format attached (decks/<format>.pdf; missing
 *    files are skipped silently)
 * 3. internal notification to the contact address with every field
 *
 * Without RESEND_API_KEY (demo mode) nothing is sent and the full
 * submission is logged. If a real send fails, the visitor still sees
 * success and the full submission is logged so nothing is lost.
 */

type PartnerSubmission = {
  name: string;
  organization: string;
  phone: string;
  email: string;
  interests: string[];
  website?: string; // honeypot
};

const VALID_INTERESTS = new Set<string>(FORMATS.map((f) => f.slug));

/* Best-effort rate limit: 5 submissions per IP per 10 minutes. In-memory,
   so it's per server instance — enough to blunt a script hammering the
   form, not a guarantee. TODO(supabase): move to a shared store. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // bound memory on a long-lived instance
  return recent.length > MAX_PER_WINDOW;
}

async function loadDecks(
  interests: string[],
  nameOf: (slug: string) => string
): Promise<EmailAttachment[]> {
  const decks: EmailAttachment[] = [];
  for (const slug of interests) {
    try {
      const content = await readFile(path.join(process.cwd(), "decks", `${slug}.pdf`));
      decks.push({ filename: `Spilt Social — ${nameOf(slug)}.pdf`, content });
    } catch {
      /* no deck for this format yet — skip silently */
    }
  }
  return decks;
}

export async function POST(request: Request) {
  let body: PartnerSubmission;
  try {
    body = (await request.json()) as PartnerSubmission;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // honeypot: bots fill the hidden "website" field — pretend success
  if (body.website && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = str(body.name, 120);
  const organization = str(body.organization, 160);
  const phone = str(body.phone, 40);
  const email = str(body.email, 200);
  const interests = Array.isArray(body.interests)
    ? [...new Set(body.interests.filter((i) => typeof i === "string" && VALID_INTERESTS.has(i)))]
    : [];

  const errors: string[] = [];
  if (name.length < 2) errors.push("name");
  if (organization.length < 2) errors.push("organization");
  if (!/^[\d\s()+.-]{7,}$/.test(phone)) errors.push("phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email");
  if (errors.length > 0) {
    return NextResponse.json({ error: "validation", fields: errors }, { status: 422 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }

  const submission = {
    receivedAt: new Date().toISOString(),
    name,
    organization,
    phone,
    email,
    interests,
  };

  if (!emailConfigured()) {
    console.log("[partner] DEMO MODE — inquiry received (no email sent):", submission);
    return NextResponse.json({ ok: true });
  }

  try {
    const copy = await getCopy();
    const t = copy.partnerEmail;
    const notifyTo = copy.footer.contactEmail || "business@spiltsocial.com";
    const interestNames = interests.map((s) => formatName(copy, s as FormatSlug));
    const decks = await loadDecks(interests, (s) => formatName(copy, s as FormatSlug));

    const thankYou = renderEmail({
      preheader: t.heading,
      blocks: [
        { type: "heading", text: t.heading },
        { type: "text", text: `Hi ${name.split(/\s+/)[0]},\n\n${t.body}` },
        { type: "text", text: t.signoff },
      ],
    });
    const internal = renderEmail({
      preheader: `${organization} · ${interestNames.join(", ") || "no formats picked"}`,
      blocks: [
        { type: "heading", text: "New partner inquiry" },
        {
          type: "fields",
          rows: [
            ["Name", name],
            ["Organization", organization],
            ["Phone", phone],
            ["Email", email],
            ["Interested in", interestNames.join(", ")],
            ["Decks sent", decks.map((d) => d.filename).join(", ") || "none on file"],
            ["Received", new Date(submission.receivedAt).toLocaleString("en-US", { timeZone: "America/New_York" })],
          ],
        },
        { type: "text", text: "Reply to this email to reach them directly." },
      ],
    });

    const [toSubmitter, toTeam] = await Promise.all([
      // replies to the thank-you reach the team, not the sending address
      sendEmail({ to: email, subject: t.subject, ...thankYou, attachments: decks, replyTo: notifyTo }),
      sendEmail({
        to: notifyTo,
        subject: `New partner inquiry — ${organization}`,
        ...internal,
        replyTo: email,
      }),
    ]);

    if (!toSubmitter.ok || !toTeam.ok) {
      console.error("[partner] email delivery failed — full submission preserved here:", {
        submission,
        toSubmitter,
        toTeam,
      });
    } else {
      console.log("[partner] inquiry delivered:", { organization, receivedAt: submission.receivedAt });
    }
  } catch (err) {
    console.error("[partner] unexpected failure — full submission preserved here:", {
      submission,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // the visitor sees success no matter what happened downstream
  return NextResponse.json({ ok: true });
}
