# Launch guide

From "runs on my laptop" to a public site with sign-in, a working paywall, and Pro for friends. Do the steps in order; each one leaves the site working.

| Step                       | What you get                    | Cost                                                 |
| -------------------------- | ------------------------------- | ---------------------------------------------------- |
| 1. Vercel                  | The site online at a public URL | Free while non-commercial                            |
| 2. Supabase                | Accounts, sign-in, cloud sync   | Free tier                                            |
| 3. Sign-in email or Google | People can actually log in      | Free tiers                                           |
| 4. Admin                   | You can give friends Pro        | Free                                                 |
| 5. Stripe (test mode)      | Paywall working with test cards | Free                                                 |
| 6. Go live                 | Real payments                   | Stripe fees per payment, Vercel Pro, optional domain |

Every setting the app reads is listed in [`.env.example`](../.env.example). Variables starting with `NEXT_PUBLIC_` are built into the site, so **redeploy after changing them** (Vercel → Deployments → ⋯ → Redeploy).

---

## 1. Put the site online (Vercel)

1. Go to [vercel.com](https://vercel.com), sign up with GitHub.
2. **Add New → Project**, pick `nils2830/Pomodoro`, click **Deploy**. Next.js is detected automatically.
3. You get a URL like `https://pomodoro-abc.vercel.app`. Every push to `main` redeploys it.
4. In **Settings → Environment Variables**, add:

   | Name                         | Value                             |
   | ---------------------------- | --------------------------------- |
   | `NEXT_PUBLIC_SITE_URL`       | your Vercel URL (or domain later) |
   | `NEXT_PUBLIC_ALLOW_DEMO_PRO` | `false`                           |
   | `NEXT_PUBLIC_LEGAL_NAME`     | your full name                    |
   | `NEXT_PUBLIC_LEGAL_COUNTRY`  | `Denmark`                         |
   | `NEXT_PUBLIC_CONTACT_EMAIL`  | an email people can reach you at  |

   Redeploy. The site now works for everyone in local mode (no accounts yet).

> Vercel's free Hobby plan is for non-commercial use, and taking payments counts as commercial ([fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). Stay on Hobby while testing; upgrade to Pro before step 6.

## 2. Accounts (Supabase)

1. Create a project at [supabase.com](https://supabase.com). Choose an **EU region** (e.g. Frankfurt); the privacy policy says data is hosted in the EU.
2. **SQL Editor → New query**: paste and run [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql), then [`0002_pro_grants.sql`](../supabase/migrations/0002_pro_grants.sql).
3. **Authentication → URL Configuration**
   - Site URL: your Vercel URL
   - Redirect URLs: `https://YOUR-URL/**` and `http://localhost:3000/**`
4. **Project Settings → API** (or **API Keys**): copy the project URL, the public key (`anon` / publishable) and the secret key (`service_role` / secret). Never put the secret key in a `NEXT_PUBLIC_` variable.
5. Add to Vercel and redeploy:

   | Name                            | Value       |
   | ------------------------------- | ----------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public key  |
   | `SUPABASE_SERVICE_ROLE_KEY`     | secret key  |

A **Sign in** button now appears in the top bar.

> Free Supabase projects pause after a period without activity. Upgrade when you have real users.

## 3. Make sign-in work for other people

Supabase's built-in email sender only delivers to members of your Supabase team and only a couple of messages an hour ([docs](https://supabase.com/docs/guides/auth/auth-smtp)), so friends won't receive login links until you do one of these. Doing both is best.

**A. Google sign-in (no email needed)**

1. In [Google Cloud Console](https://console.cloud.google.com): create a project → **APIs & Services → OAuth consent screen** (External, add your app name and email) → **Credentials → Create credentials → OAuth client ID → Web application**.
2. Authorized redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` (Supabase shows the exact value under Authentication → Providers → Google).
3. Paste the client ID and secret into Supabase → **Authentication → Providers → Google** and enable it.

**B. Email links through your own email provider**

1. Create an account with an email service such as [Resend](https://resend.com) or Brevo. These need a domain you own (see step 6) to send to other people.
2. Verify your domain with them, then copy their SMTP details.
3. Supabase → **Authentication → Emails → SMTP Settings**: enable custom SMTP and paste the details (for Resend: host `smtp.resend.com`, port `465`, user `resend`, password = API key). Sender e.g. `login@yourdomain.dk`.

## 4. Become admin and give friends Pro

1. Add `ADMIN_EMAILS` in Vercel with your own email (several admins: comma-separated). Redeploy.
2. Sign in on the site with that email. A shield icon appears in the top bar; it opens **/admin**.
3. Give yourself Pro first: enter your email, choose **Forever**, click **Give Pro**.
4. Give friends Pro the same way, with or without an end date. It works **before they sign up**: Pro switches on the first time they log in with that address.

How it's protected: the admin list lives only on the server, every admin request is checked server-side, and the database itself only accepts Pro features (cloud sync) from people with a paid plan or an active gift. Supabase verifies that people own the email they sign in with, so nobody can claim a gift sent to someone else's address.

## 5. The paywall (Stripe, test mode)

Keep Stripe in **test mode** (toggle in the dashboard) for this whole step.

1. Create an account at [stripe.com](https://stripe.com).
2. **Product catalog → Add product**: "Cadence Pro" with two **recurring** prices: monthly and yearly. The app shows $4 and $36; if you want other prices or DKK, change `PRICING` in [`src/core/billing/plans.ts`](../src/core/billing/plans.ts) to match. Copy both price IDs (`price_…`).
3. **Developers → API keys**: copy the secret key (`sk_test_…`).
4. **Developers → Webhooks → Add endpoint**
   - URL: `https://YOUR-URL/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret (`whsec_…`).
5. **Settings → Billing → Customer portal**: activate it and allow cancelling and updating payment methods. This is what the **Billing** button on the Account page opens.
6. Add to Vercel and redeploy:

   | Name                          | Value             |
   | ----------------------------- | ----------------- |
   | `STRIPE_SECRET_KEY`           | `sk_test_…`       |
   | `STRIPE_WEBHOOK_SECRET`       | `whsec_…`         |
   | `STRIPE_PRICE_PRO_MONTHLY`    | monthly `price_…` |
   | `STRIPE_PRICE_PRO_YEARLY`     | yearly `price_…`  |
   | `NEXT_PUBLIC_BILLING_ENABLED` | `true`            |

**Test it** with a second account (not your gifted one):

- [ ] Click **Go Pro → Upgrade**, pay with card `4242 4242 4242 4242`, any future date, any CVC ([test cards](https://docs.stripe.com/testing)).
- [ ] You land on Account and the plan shows **Pro** within a few seconds. If not, check the webhook's delivery log in Stripe.
- [ ] Open **Billing**, cancel, and confirm Pro ends at the end of the period.
- [ ] Sign in on a second browser and check that sessions sync.

## 6. Go live

**Payments**

1. In Stripe, **activate your account**: your details as an individual or business, and a bank account for payouts.
2. Switch to **live mode** and recreate the product, both prices, the webhook and the customer portal there (test-mode objects don't carry over).
3. Replace the four Stripe values in Vercel with the live ones (`sk_live_…`, new `whsec_…`, new price IDs). Redeploy.
4. Upgrade Vercel to Pro (commercial use).

**A domain (optional but recommended)**

Buy one (e.g. a `.dk` from a Danish registrar, or through Vercel), add it under Vercel → **Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL`, the Supabase Site URL and redirect URLs, the Google redirect settings if used, and the Stripe webhook URL.

**VAT (moms)**

- In Denmark you must register for VAT once your expected sales pass **50,000 kr. in any rolling 12 months** ([BDO](https://www.bdo.dk/da-dk/faglig-info/depechen/depechen-artikler-2023/ivarksatter-hvornar-skal-du-momsregistreres), [Dinero](https://dinero.dk/tips/hvornaar-skal-jeg-momsregistreres/); confirm on [skat.dk](https://skat.dk)).
- Selling digital services to consumers in other EU countries: above €10,000 a year in such sales, you charge each customer's local VAT, usually reported through the EU [One-Stop-Shop](https://vat-one-stop-shop.ec.europa.eu/).
- Two ways to handle it:
  - **Stripe Tax**: turn it on in Stripe, set your prices to include tax, and set `STRIPE_AUTOMATIC_TAX=true`. Checkout then asks for the customer's country and adds the right VAT. You still file the returns.
  - **A merchant of record** (Paddle, Lemon Squeezy) sells on your behalf and handles VAT for you, for a higher fee. That would mean swapping the Stripe code for theirs.

**Before you announce it**

- [ ] `NEXT_PUBLIC_ALLOW_DEMO_PRO` is `false`
- [ ] Your name and contact email show correctly on /terms and /privacy
- [ ] You've read the terms and privacy policy and they match how you run things (refund promise, data, contact)
- [ ] A friend has signed in from their own device
- [ ] One real payment works end to end (you can refund yourself from Stripe)

## Day to day

| Task                                 | Where                                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Give or remove Pro                   | /admin                                                                                         |
| See sign-ups and paying members      | /admin                                                                                         |
| Refunds, invoices, failed payments   | Stripe dashboard → Payments / Customers                                                        |
| Someone asks to delete their account | Supabase → Authentication → Users → delete (their profile and synced data are removed with it) |
| Change prices                        | New prices in Stripe, update the env vars and `PRICING` in `plans.ts`                          |
