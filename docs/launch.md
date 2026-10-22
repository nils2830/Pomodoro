# Launch guide

From "runs on my laptop" to a public site with sign-in, a working paywall, and Pro for friends. Do the steps in order; each one leaves the site working.

| Step                       | What you get                    | Cost                                                 |
| -------------------------- | ------------------------------- | ---------------------------------------------------- |
| 1. Vercel                  | The site online at a public URL | Free while non-commercial                            |
| 2. Supabase                | Accounts, sign-in, saved data   | Free tier                                            |
| 3. Google, Apple and email | People can actually log in      | Free tiers; Apple needs a $99/yr developer account   |
| 4. Admin                   | You can give friends Pro        | Free                                                 |
| 5. Stripe (test mode)      | Paywall working with test cards | Free                                                 |
| 6. Go live                 | Real payments                   | Stripe fees per payment, Vercel Pro, optional domain |

Every setting the app reads is listed in [`.env.example`](../.env.example). Variables starting with `NEXT_PUBLIC_` are built into the site, so **redeploy after changing them** (Vercel → Deployments → ⋯ → Redeploy).

Once you're signed in as admin, **/admin → Launch checklist** shows which of these steps are done and what is still missing.

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

   Redeploy. Until step 2 is done the site runs in local mode (no accounts, data in the browser).

> Vercel's free Hobby plan is for non-commercial use, and taking payments counts as commercial ([fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). Stay on Hobby while testing; upgrade to Pro before step 6.

## 2. Accounts (Supabase)

1. Create a project at [supabase.com](https://supabase.com), or add it from Vercel → **Storage → Supabase** (this is how Steen is connected today; Vercel then fills in the variables below for you). An EU region such as Frankfurt keeps data close to Danish users.
2. **Database tables are created automatically.** Every Vercel build runs `scripts/migrate.mjs`, which applies the files in [`supabase/migrations`](../supabase/migrations) that haven't run yet (it uses `POSTGRES_URL_NON_POOLING`, which the Vercel integration sets). Without that variable, paste the files into **SQL Editor** in order instead.
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

Visitors who aren't signed in now land on the welcome page (`/welcome`), and the app opens after they create a free account. Their sessions, tasks and settings are saved to that account.

> Free Supabase projects pause after a period without activity. Upgrade when you have real users.

## 3. Make sign-in work for other people

The sign-in page offers Apple, Google and an email link. A button for a provider that isn't switched on yet tells people to use another one, so you can add them one at a time. Supabase's built-in email sender only delivers to members of your Supabase team and only a couple of messages an hour ([docs](https://supabase.com/docs/guides/auth/auth-smtp)), so do at least A or C before inviting people.

**A. Google**

1. In [Google Cloud Console](https://console.cloud.google.com): create a project → **APIs & Services → OAuth consent screen** (External, app name "Steen", your email, add your site's domain) → **Credentials → Create credentials → OAuth client ID → Web application**.
2. Authorized JavaScript origin: your site URL. Authorized redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` (Supabase shows the exact value under Authentication → Providers → Google).
3. Paste the client ID and secret into Supabase → **Authentication → Providers → Google** and enable it.
4. While the consent screen is in "Testing", only test users you list can sign in. Click **Publish app** when you launch.

If Google sign-in fails, the error from Google or Supabase is shown on the sign-in page; the two usual causes are the provider being disabled in Supabase and a redirect URI that doesn't match exactly.

**B. Apple** ([Supabase guide](https://supabase.com/docs/guides/auth/social-login/auth-apple))

1. Join the [Apple Developer Program](https://developer.apple.com/programs/) ($99 a year). You'll need it for the iPhone app anyway.
2. **Certificates, Identifiers & Profiles → Identifiers**: create an **App ID** with "Sign in with Apple" ticked (e.g. `app.steen`).
3. Create a **Services ID** (e.g. `app.steen.web`), enable Sign in with Apple, and configure it: primary App ID from step 2, domain `YOUR-PROJECT-REF.supabase.co`, return URL `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`.
4. **Keys**: create a key with Sign in with Apple, download the `.p8` file, and note the Key ID and your Team ID.
5. Turn those into a client secret (Supabase's Apple provider page links a generator), then in Supabase → **Authentication → Providers → Apple**: enable it, put the Services ID under Client IDs and paste the secret.
6. **The secret expires after six months.** Put a reminder in your calendar to generate a new one; the launch checklist reminds you too.

**C. Email links through your own email provider**

1. Create an account with an email service such as [Resend](https://resend.com) or Brevo. These need a domain you own (see step 6) to send to other people.
2. Verify your domain with them, then copy their SMTP details.
3. Supabase → **Authentication → Emails → SMTP Settings**: enable custom SMTP and paste the details (for Resend: host `smtp.resend.com`, port `465`, user `resend`, password = API key). Sender e.g. `login@yourdomain.dk`.

## 4. Become admin and give friends Pro

1. `ADMIN_EMAILS` in Vercel holds your email (several admins: comma-separated). Redeploy after changing it.
2. Sign in on the site with that email. A shield icon appears in the top bar; it opens **/admin**. Admins get Pro for life automatically (an "Owner" gift is written the first time you sign in).
3. Give friends Pro with or without an end date. It works **before they sign up**: Pro switches on the first time they log in with that address.

How it's protected: the admin list lives only on the server, every admin request is checked server-side, and the database only lets people write their own rows and never their own plan. Supabase verifies that people own the email they sign in with, so nobody can claim a gift sent to someone else's address.

## 5. The paywall (Stripe, test mode)

Keep Stripe in **test mode** (toggle in the dashboard) for this whole step.

1. Create an account at [stripe.com](https://stripe.com).
2. **Product catalog → Add product**: "Steen Pro" with two **recurring** prices: monthly and yearly. The app shows $4 and $36; if you want other prices or DKK, change `PRICING` in [`src/core/billing/plans.ts`](../src/core/billing/plans.ts) to match. Copy both price IDs (`price_…`).
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
- [ ] Delete a test account from Account → Delete account and check that its subscription is cancelled in Stripe.

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
  - **Stripe Tax**: turn it on in Stripe, set your prices to include tax, and change `automatic_tax` to `{ enabled: true }` in `src/app/api/billing/checkout/route.ts` (it is off, as configured in Checkout Studio). Checkout then asks for the customer's country and adds the right VAT. You still file the returns.
  - **A merchant of record** (Paddle, Lemon Squeezy) sells on your behalf and handles VAT for you, for a higher fee. That would mean swapping the Stripe code for theirs.

**Before you announce it**

- [ ] `NEXT_PUBLIC_ALLOW_DEMO_PRO` is `false`
- [ ] Your name and contact email show correctly on /terms and /privacy
- [ ] You've read the terms and privacy policy and they match how you run things (refund promise, data, contact)
- [ ] A friend has signed in from their own device, with Google or Apple
- [ ] The Google consent screen is published, not in testing
- [ ] /admin → Launch checklist is all green
- [ ] One real payment works end to end (you can refund yourself from Stripe)

## Day to day

| Task                                 | Where                                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Give or remove Pro                   | /admin                                                                                         |
| See sign-ups and paying members      | /admin                                                                                         |
| Refunds, invoices, failed payments   | Stripe dashboard → Payments / Customers                                                        |
| Someone asks to delete their account | They can do it themselves: Account → Delete account (ends the subscription, erases their data) |
| Renew the Apple sign-in secret       | Every six months, Supabase → Authentication → Providers → Apple                                |
| Change prices                        | New prices in Stripe, update the env vars and `PRICING` in `plans.ts`                          |
