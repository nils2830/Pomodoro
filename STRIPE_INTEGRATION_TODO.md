# Stripe integration: remaining steps

Steen sells **Steen Pro** as a subscription ($4/month or $36/year) through Stripe's **embedded form** (`ui_mode: "form"`): the payment form opens in a dialog on Steen instead of on a Stripe page.

## Values to Replace

No placeholders are left in the code. `mode` is `subscription` and `line_items[].price` reads the real Price IDs from environment variables:

**Files containing these values:**

- [src/app/api/billing/checkout/route.ts](src/app/api/billing/checkout/route.ts)
- [src/core/billing/stripe.server.ts](src/core/billing/stripe.server.ts)

| Field              | Current Value                                                   | What to Set                                                                                 |
| ------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| mode               | subscription                                                    | Correct for Steen Pro. Nothing to change.                                                   |
| line_items[].price | `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_PRO_YEARLY` (Vercel) | Already set to the test-mode prices. Replace with the live-mode Price IDs when you go live. |

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**

- [src/app/api/billing/checkout/route.ts](src/app/api/billing/checkout/route.ts) (server)
- [src/core/billing/CheckoutDialog.tsx](src/core/billing/CheckoutDialog.tsx) (appearance, client)

| Parameter                  | Value                                                     |
| -------------------------- | --------------------------------------------------------- |
| ui_mode                    | form                                                      |
| billing_address_collection | auto                                                      |
| phone_number_collection    | `{ enabled: false }`                                      |
| automatic_tax              | `{ enabled: false }`                                      |
| payment_method_collection  | always                                                    |
| submit_type                | auto                                                      |
| name_collection            | `{ individual: { enabled: true, optional: true } }`       |
| integration_identifier     | custom_embedded_web_0001                                  |
| appearance                 | stripe theme, spaced inputs, Noto Sans, `#0570de` primary |

Kept from Steen's existing call because the rest of the app depends on them: `customer` (reuses the account's Stripe customer), `client_reference_id`, `subscription_data.metadata.user_id` (lets the webhook find the account), and `return_url` (required by the embedded form; it returns to `/account?checkout=success`). Removed: `allow_promotion_codes`, `success_url`/`cancel_url` (not used by the embedded form) and the `STRIPE_AUTOMATIC_TAX` switch (tax is off, as configured).

## Setup

### Already done

- **Product and prices** (test mode): Steen Pro, $4/month and $36/year.
- **Webhook** `we_1UTMWJRvNFQfSZ9h70xHnTBC` → `https://www.steen.fit/api/billing/webhook`. It sends `checkout.session.completed` and `customer.subscription.created`, `.updated` and `.deleted`. Its signing secret is stored on Vercel as `STRIPE_WEBHOOK_SECRET`.
- **Customer portal**: active, with cancel at period end, card update and invoice history.
- **Vercel**: `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`.
- **Stripe API version**: pinned to `2026-09-30.endive` in [stripe.server.ts](src/core/billing/stripe.server.ts). The embedded form needs Dahlia (`2026-03-25.dahlia`) or later.

### Still to do (you)

Add these in **Vercel → pomodoro → Settings → Environment Variables → Production**. Don't paste keys into chats or code. Find them at https://dashboard.stripe.com/test/apikeys.

| Variable                             | Value                           |
| ------------------------------------ | ------------------------------- |
| `STRIPE_SECRET_KEY`                  | `sk_test_…` (mark as Sensitive) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…`                     |
| `NEXT_PUBLIC_BILLING_ENABLED`        | `true`                          |

Then redeploy (Vercel → Deployments → ⋯ → Redeploy). **/admin → Launch checklist** then shows whether everything is green.

## How it works

1. **Go Pro** → `POST /api/billing/checkout` creates a Checkout Session (`ui_mode: "form"`) and returns its `clientSecret`.
2. [CheckoutDialog](src/core/billing/CheckoutDialog.tsx) loads Stripe.js from `https://js.stripe.com/dahlia/stripe.js` (never bundled, for PCI) and calls `initCheckoutFormSdk`. It then mounts the form and confirms the payment on the form's `confirm` event.
3. Stripe sends the customer back to `/account?checkout=success`.
4. The [webhook](src/app/api/billing/webhook/route.ts) verifies Stripe's signature, reads the subscription and sets `profiles.plan = 'pro'`. That unlocks Pro.

**New files:** `src/core/billing/CheckoutDialog.tsx`, `STRIPE_INTEGRATION_TODO.md`.

## Testing

Use a test account that doesn't already have Pro (admins get Pro automatically).

| Card                  | Result                             |
| --------------------- | ---------------------------------- |
| `4242 4242 4242 4242` | Succeeds                           |
| `4000 0025 0000 3155` | Asks for 3-D Secure authentication |
| `4000 0000 0000 9995` | Declined (insufficient funds)      |

Use any future expiry date and any CVC. Then check:

- The plan shows Pro within a few seconds.
- Stripe → Webhooks shows successful deliveries.
- Account → Billing opens the portal.

## Going live

1. Activate your Stripe account (business details and bank account).
2. In **live mode**, recreate the product and both prices, the webhook (same URL and events) and the customer portal.
3. Replace these on Vercel with the live values: `STRIPE_SECRET_KEY` (`sk_live_…`), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`), `STRIPE_WEBHOOK_SECRET` and both `STRIPE_PRICE_*`. Then redeploy.
4. **VAT:** in Denmark you must register for VAT once sales pass 50,000 kr. a year. To have Stripe add VAT, turn on Stripe Tax and set `automatic_tax: { enabled: true }` in the checkout route.

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
- https://docs.stripe.com/payments/checkout/build-subscriptions?payment-ui=checkout-form
