# Partner-form email setup (future — do when Gmail credentials exist)

The `/api/partner` route currently runs in **demo mode**: it validates,
logs the submission to the server console, and returns success. This
document is the runbook for wiring real email when the Google account
and sponsorship deck PDFs are ready.

## 1 · Google Cloud Console

1. console.cloud.google.com → create project **spilt-social-site**.
2. **APIs & Services → Library** → enable **Gmail API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: External (or Internal if the sender is on a Workspace org).
   - Scopes: `https://www.googleapis.com/auth/gmail.send` (send-only —
     never request broader mail scopes).
   - Add the sending address (e.g. `business@spiltsocial.com`) as a test
     user while in testing mode.
4. **Credentials → Create credentials → OAuth client ID**:
   - Type: Web application.
   - Authorized redirect URI: `https://developers.google.com/oauthplayground`
     (used once, below).
   - Save the **Client ID** and **Client Secret**.

## 2 · Mint the refresh token (one time)

1. Open https://developers.google.com/oauthplayground → gear icon →
   check *Use your own OAuth credentials* → paste client ID + secret.
2. Authorize the `gmail.send` scope while signed in as the sending
   address.
3. Exchange the code → copy the **Refresh token**.

## 3 · Vercel environment variables

| Variable              | Value                                  |
| --------------------- | -------------------------------------- |
| `GMAIL_CLIENT_ID`     | from step 1.4                          |
| `GMAIL_CLIENT_SECRET` | from step 1.4                          |
| `GMAIL_REFRESH_TOKEN` | from step 2                            |
| `GMAIL_SENDER`        | `business@spiltsocial.com`             |

(`CRON_SECRET` for the events refresh is separate and already documented
in `vercel.json` / `/api/refresh-events`.)

## 4 · Decks

Drop the per-format sponsorship PDFs into a repo-root `decks/` folder,
named by format slug so the route can match checked interests:

```
decks/move-and-mingle.pdf
decks/move-fest.pdf
decks/business-hop.pdf
decks/founders-fair.pdf
decks/tapt.pdf
```

## 5 · Code changes (all inside the TODO block in `app/api/partner/route.ts`)

1. `npm install googleapis`
2. Build the OAuth2 client from the env vars, set the refresh token,
   and send via `gmail.users.messages.send` with a base64url-encoded
   RFC 2822 multipart message.
3. Outbound email to the prospect: brand-voiced thank-you + the deck
   PDFs for each checked format (skip missing files silently).
4. Second email to `business@spiltsocial.com` with the submission
   summary for personal follow-up.
5. Delete the `console.log` demo block and the `mode: "demo"` response
   field.

Nothing outside that route needs to change — the form already posts the
full submission shape.
