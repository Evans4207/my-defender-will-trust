# Stripe setup (Phase 1)

Needed to verify the payments path end-to-end. ~15 minutes. Use **test mode**
first (toggle in the Stripe dashboard); switch to live keys only at launch.

## 1. Create the account
Sign up at <https://stripe.com>. Stay in **Test mode** while building.

## 2. Create products + prices
Products → Add product. Create these and copy each **Price ID** (`price_...`):

| Product | Price | Recurring? | Env var |
|---|---|---|---|
| Will Package — Individual | $159.00 | one-time | `STRIPE_PRICE_WILL_INDIVIDUAL` |
| Will Package — Couples | $249.00 | one-time | `STRIPE_PRICE_WILL_COUPLES` |
| Trust Package — Individual | $449.00 | one-time | `STRIPE_PRICE_TRUST_INDIVIDUAL` |
| Trust Package — Couples | $579.00 | one-time | `STRIPE_PRICE_TRUST_COUPLES` |
| Annual Membership | $49.00 | yearly | `STRIPE_PRICE_MEMBERSHIP` |

## 3. Get API keys
Developers → API keys:
- **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Secret key** → `STRIPE_SECRET_KEY`

Put all of the above into `.env.local`.

## 4. Webhooks
### Local testing (Stripe CLI)
```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
The CLI prints a webhook signing secret (`whsec_...`) → set `STRIPE_WEBHOOK_SECRET`.
Trigger a test event: `stripe trigger checkout.session.completed`.

### Production
Developers → Webhooks → Add endpoint → `https://YOUR-DOMAIN/api/stripe/webhook`.
Subscribe to: `checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`. Copy the
endpoint's signing secret → `STRIPE_WEBHOOK_SECRET` (per environment).

## 5. Billing portal
Settings → Billing → Customer portal → activate it (enables "Manage billing").

## 6. Verify
1. `npm run dev`, create an account, verify email, log in.
2. On the gate screen choose a package → complete Stripe test checkout
   (card `4242 4242 4242 4242`, any future expiry/CVC).
3. The webhook should upsert a `subscriptions` row; you land on `/dashboard`
   with the package unlocked. Redelivering the same event must NOT double-write
   (idempotency via `stripe_events`).

## Access codes vs. Stripe
Partner **access codes** unlock entitlement directly (no Stripe charge) via
`redeem_access_code()`. Stripe is only for direct subscribers and the annual
membership. Both paths converge on the same dashboard entitlement.
