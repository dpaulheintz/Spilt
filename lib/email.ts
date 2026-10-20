import "server-only";
import { Resend } from "resend";

/**
 * The ONE module every email on the site goes through. Provider today:
 * Resend (RESEND_API_KEY, EMAIL_FROM). To swap providers later, only
 * sendEmail() below changes — callers pass a provider-neutral message.
 *
 * DEMO MODE: without RESEND_API_KEY nothing is sent; the message is
 * logged and the call reports { ok: false, mode: "demo" }. Callers are
 * expected to keep the visitor's experience identical either way.
 * Setup steps: SETUP-EMAIL.md.
 */

export type EmailAttachment = { filename: string; content: Buffer };

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; mode: "demo" }
  | { ok: false; mode: "error"; error: string };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Default sender until EMAIL_FROM is set (Resend's shared test domain
 *  only delivers to the account owner, so set EMAIL_FROM for real use). */
function fromAddress(): string {
  return process.env.EMAIL_FROM || "Spilt Social <onboarding@resend.dev>";
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (!emailConfigured()) {
    console.log("[email] DEMO MODE — not sent:", {
      to: message.to,
      subject: message.subject,
      attachments: message.attachments?.map((a) => a.filename) ?? [],
    });
    return { ok: false, mode: "demo" };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    if (error) throw new Error(`${error.name}: ${error.message}`);
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] send failed:", { to: message.to, subject: message.subject, error: msg });
    return { ok: false, mode: "error", error: msg };
  }
}
