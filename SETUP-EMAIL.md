# Turning on email (Resend)

Until these steps are done, the partner form still works for visitors: they see
the "Received" thank-you, and each submission is written to the site's logs in
Vercel. It just doesn't send any email yet.

Once connected, every partner inquiry sends two emails:

- a branded **thank-you** to the person who filled out the form, with the
  sponsorship deck attached for each experience they checked (see `decks/`)
- a **notification** to business@spiltsocial.com with every field, titled
  "New partner inquiry — {their organization}". Hit Reply to answer them
  directly.

All site email goes through Resend, a sending service. You'll need about 20
minutes, the GoDaddy login for spiltsocial.com, and the Vercel login. DNS
changes can take up to a few hours to be recognized (usually minutes).

---

## Part 1 · Create the Resend account

1. Go to **resend.com** and sign up. Use a shared team address, such as
   business@spiltsocial.com, so the account doesn't belong to one person.
2. In the left menu, open **Domains** and click **Add Domain**.
3. Type `spiltsocial.com` and choose the region closest to Ohio
   (**North Virginia, us-east-1**). Click **Add**.
4. Resend now shows a short list of **DNS records**. Leave this page open:
   you'll copy from it in Part 2.

## Part 2 · Add the DNS records in GoDaddy

These records prove to email providers that Resend may send on behalf of
spiltsocial.com, so your emails land in inboxes and not spam. They use the
`send` sub-name, so they **don't affect your existing email inbox**.

1. Go to **godaddy.com**, sign in, and open **My Products**.
2. Next to **spiltsocial.com**, click **DNS** (or **Manage DNS**).
3. For each record Resend shows, click **Add New Record** and copy it over
   exactly:

   | Type  | Name (in GoDaddy)   | Value                                                   | Priority |
   | ----- | ------------------- | ------------------------------------------------------- | -------- |
   | `MX`  | `send`              | copy from Resend (like `feedback-smtp.us-east-1.amazonses.com`) | `10` |
   | `TXT` | `send`              | copy from Resend (like `v=spf1 include:amazonses.com ~all`)     | —    |
   | `TXT` | `resend._domainkey` | copy from Resend: a long code starting with `p=`                | —    |

   Tips:
   - In GoDaddy's **Name** box, type only the part shown above (`send`, not
     `send.spiltsocial.com`). GoDaddy adds the domain itself.
   - Copy values with Resend's copy buttons. The long `p=` code must be exact.
   - Leave **TTL** on the default.
   - **Don't edit or delete** any existing records, especially the MX records
     whose Name is `@`. Those run your current inbox.
4. Recommended, if GoDaddy doesn't already list a TXT record named `_dmarc`:
   add one more record with Type `TXT`, Name `_dmarc`, and Value
   `v=DMARC1; p=none;`. This helps Gmail and Yahoo trust the mail.
5. Back in Resend, click **Verify DNS Records**. When each row shows
   **Verified**, you're done. If it's still pending, wait 15 minutes and try
   again.

## Part 3 · Create the API key

1. In Resend, open **API Keys** and click **Create API Key**.
2. Name it `Spilt Social Website`, set **Permission** to **Sending access**,
   and limit it to the `spiltsocial.com` domain.
3. Click **Add**, then **copy the key now** (it starts with `re_`). Resend only
   shows it once. Treat it like a password.

## Part 4 · Paste the values into Vercel

1. Go to **vercel.com**, open the Spilt Social project, then **Settings →
   Environment Variables**.
2. Add these two, with all three environment checkboxes on:

   | Name             | Value                                          |
   | ---------------- | ---------------------------------------------- |
   | `RESEND_API_KEY` | the `re_…` key from Part 3                     |
   | `EMAIL_FROM`     | `Spilt Social <hello@spiltsocial.com>`         |

   `EMAIL_FROM` can be any address ending in `@spiltsocial.com`, even one with
   no inbox behind it. Replies always go to business@spiltsocial.com.
3. **Redeploy.** Vercel doesn't pick up new values until you do. Open the
   **Deployments** tab, click **⋯** on the top deployment, choose
   **Redeploy**, and wait for it to finish.

## Part 5 · Check it

1. Open the website's **/partner** page and send yourself an inquiry using your
   own email address. Check one or two experiences.
2. Within a minute you should get the thank-you email, and
   business@spiltsocial.com should get the notification.
3. Not there? Check spam first. Then open Resend's **Emails** page, which lists
   every send and why it failed. In Vercel, **Logs** keeps the full text of
   every submission, so nothing is ever lost.

## Adding the sponsorship decks

Put one PDF per experience in the `decks/` folder of the website's code, named
exactly as listed in `decks/README.md` (for example `business-hop.pdf`), then
redeploy. Any deck that isn't there yet is skipped, and the email still goes
out.
