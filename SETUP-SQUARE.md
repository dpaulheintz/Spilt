# Turning on the shop (Square)

Until these steps are done, the website shows three sample shirts and the
**Buy** button says "Shop opens soon." Nothing breaks in the meantime.

Once connected, Square runs everything: you add shirts, sizes, photos, prices,
and stock in your normal Square dashboard. The website picks up changes within
about 10 minutes. When someone taps **Buy**, they go to Square's own checkout
page, and the order shows up in Square like any other sale, with the receipt
sent by Square.

You'll need about 20 minutes and the login for Spilt's Square account.

---

## Part 1 · Put the shirts in a "Website" category

Only items in a category named exactly **Website** show up on the site. That way
you can sell things at events without them appearing online.

1. Go to **squareup.com** and sign in to the Spilt Social account.
2. Open **Items & services → Item library**.
3. Open the **Categories** tab and click **Create category**. Name it `Website`
   and save.
4. For each shirt, open the item and:
   - add it to the **Website** category
   - add a photo (the first photo is the one the website uses)
   - add each size as a **variation** (S, M, L, XL, XXL), each with its price
   - turn on **Track stock** and enter how many you have of each size. Sizes with
     0 in stock show as "Sold out" on the website automatically.
5. Make sure the items are available at the location you'll sell from.

## Part 2 · Create the Square app and copy two codes

1. Go to **developer.squareup.com** and sign in with the same Square account.
2. Click **+** (or **Create an application**). Name it `Spilt Social Website` and
   save.
3. Open the app. At the top, switch the toggle from **Sandbox** to
   **Production**.
4. Open **Credentials**. Next to **Production Access token**, click **Show** and
   copy it. Keep it private: it works like a password.
5. In the left menu, open **Locations**. Copy the **Location ID** for the
   location that holds the shirts' stock (it looks like `L1A2B3C4D5E6F`).

## Part 3 · Paste the codes into Vercel

1. Go to **vercel.com**, open the Spilt Social project, then **Settings →
   Environment Variables**.
2. Add these, one at a time. Leave the environment checkboxes on all three
   (Production, Preview, Development):

   | Name                  | Value                                   |
   | --------------------- | --------------------------------------- |
   | `SQUARE_ACCESS_TOKEN` | the Production Access token from Part 2 |
   | `SQUARE_LOCATION_ID`  | the Location ID from Part 2             |
   | `SQUARE_ENVIRONMENT`  | `production`                            |

3. Optional: to charge a flat shipping fee, add `SQUARE_SHIPPING_FEE_CENTS` with
   the fee in cents. For example, `600` means $6.00. Leave it out for no
   shipping charge.
4. **Redeploy.** Vercel doesn't pick up new values until you do this. Open the
   **Deployments** tab, click **⋯** on the top deployment, choose
   **Redeploy**, and wait for it to finish.

## Part 4 · Check it

1. Open the website and scroll to **The shop.** You should see your real shirts
   and photos instead of the samples.
2. Pick a size and tap **Buy**. You should land on a Square checkout page. You
   can close it without paying.

If the shop section disappears entirely, the site reached Square but couldn't
read the catalog. Check that the access token is the **Production** one, that the
category is spelled exactly `Website`, and that you redeployed. The site never
shows visitors an error, so the section simply hides until it works.

## Trying it without real money (optional)

On developer.squareup.com, keep the toggle on **Sandbox** and copy the Sandbox
access token and a Sandbox location ID instead, then set `SQUARE_ENVIRONMENT` to
`sandbox`. Square's test card numbers work there. Remember to switch all three
values to Production when you're done.
