import { NextResponse } from "next/server";
import { getCopy } from "@/lib/content-store";
import { sendEmail } from "@/lib/email";
import { renderEmail } from "@/lib/email-templates";
import { rateLimited } from "@/lib/rate-limit";

/**
 * "Hear about events first" signup.
 *
 * There's no database yet, so every signup is (1) logged — searchable
 * in Vercel's logs — and (2) emailed to the team through lib/email.ts
 * once Resend is configured. The visitor sees success either way.
 * TODO(supabase): insert into a subscribers table (Main list).
 */
export async function POST(request: Request) {
  let email = "";
  let honeypot = "";
  try {
    const body = (await request.json()) as { email?: unknown; website?: unknown };
    if (typeof body.email === "string") email = body.email.trim().slice(0, 200);
    if (typeof body.website === "string") honeypot = body.website;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (honeypot) return NextResponse.json({ ok: true });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }
  if (rateLimited("subscribe", request, { max: 5, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }

  const subscribedAt = new Date().toISOString();
  console.log("[subscribe] new signup:", { email, subscribedAt });

  try {
    const copy = await getCopy();
    const notify = renderEmail({
      preheader: email,
      blocks: [
        { type: "heading", text: "New subscriber" },
        {
          type: "fields",
          rows: [
            ["Email", email],
            ["Signed up", new Date(subscribedAt).toLocaleString("en-US", { timeZone: "America/New_York" })],
            ["Where", "Homepage — “Hear about events first.”"],
          ],
        },
      ],
    });
    // demo mode logs inside sendEmail; failures are logged there too
    await sendEmail({
      to: copy.footer.contactEmail || "business@spiltsocial.com",
      subject: `New subscriber — ${email}`,
      ...notify,
    });
  } catch (err) {
    console.error("[subscribe] notification failed — signup preserved above:", err);
  }

  return NextResponse.json({ ok: true });
}
