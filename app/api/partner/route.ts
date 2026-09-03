import { NextResponse } from "next/server";

/**
 * Partner inquiry endpoint — DEMO MODE.
 *
 * Validates, logs the submission server-side, and returns success.
 * No email is sent yet: Gmail credentials and the sponsorship deck PDFs
 * don't exist. When they do, the integration slots into the TODO block
 * below — see SETUP-EMAIL.md for the Google Cloud Console steps.
 */

type PartnerSubmission = {
  name: string;
  organization: string;
  phone: string;
  email: string;
  interests: string[];
  website?: string; // honeypot
};

const VALID_INTERESTS = new Set([
  "move-and-mingle",
  "move-fest",
  "business-hop",
  "founders-fair",
  "tapt",
]);

export async function POST(request: Request) {
  let body: PartnerSubmission;
  try {
    body = (await request.json()) as PartnerSubmission;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  // honeypot: bots fill the hidden "website" field — pretend success
  if (body.website && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const errors: string[] = [];
  if (!body.name || body.name.trim().length < 2) errors.push("name");
  if (!body.organization || body.organization.trim().length < 2)
    errors.push("organization");
  if (!body.phone || !/^[\d\s()+.-]{7,}$/.test(body.phone.trim()))
    errors.push("phone");
  if (!body.email || !/.+@.+\..+/.test(body.email.trim())) errors.push("email");
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((i) => VALID_INTERESTS.has(i))
    : [];
  if (errors.length > 0) {
    return NextResponse.json({ error: "validation", fields: errors }, { status: 422 });
  }

  // DEMO MODE: log server-side so submissions are visible in Vercel logs
  console.log("[partner] inquiry received", {
    at: new Date().toISOString(),
    name: body.name.trim(),
    organization: body.organization.trim(),
    phone: body.phone.trim(),
    email: body.email.trim(),
    interests,
  });

  /*
   * ────────────────────────────────────────────────────────────
   * TODO — REAL EMAIL INTEGRATION (when credentials arrive):
   *
   * 1. Gmail API OAuth2 send. Read GMAIL_CLIENT_ID,
   *    GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER from
   *    env; build an OAuth2 client (googleapis), mint an access
   *    token, and send via gmail.users.messages.send with a
   *    base64url-encoded RFC 2822 message. Full console setup steps
   *    live in SETUP-EMAIL.md.
   *
   * 2. Deck attachments. For each checked interest, attach the
   *    matching PDF from /decks/<interest>.pdf (e.g.
   *    decks/business-hop.pdf) to the outbound email to the
   *    prospect. Skip silently if a deck file is missing.
   *
   * 3. Internal notification. Send a second message summarizing the
   *    submission to business@spiltsocial.com so the team can follow
   *    up personally.
   * ────────────────────────────────────────────────────────────
   */

  return NextResponse.json({ ok: true, mode: "demo" });
}
