"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getStripe } from "./server";
import {
  packagePriceId,
  membershipPriceId,
  checkoutMode,
  assertPartyAvailable,
  type PlanKey,
} from "./config";
import { createClient } from "@/lib/supabase/server";
import { getPendingDiscount } from "@/lib/entitlements.server";
import { clientEnv } from "@/lib/env";
import type { PackageKey, PartyType } from "@/lib/pricing";

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : clientEnv.NEXT_PUBLIC_SITE_URL;
}

/** Create a Stripe Checkout session for a plan and redirect to it. */
export async function startCheckoutAction(formData: FormData): Promise<void> {
  const plan = String(formData.get("plan")) as PlanKey;
  // Reject the disabled couples tier up front — server actions are HTTP
  // endpoints, so hiding the buttons is not enough to prevent a crafted POST.
  const party: PartyType = assertPartyAvailable(
    String(formData.get("party") || "individual"),
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const priceId =
    plan === "membership"
      ? membershipPriceId()
      : packagePriceId(plan as PackageKey, party);
  // Stripe not configured yet (pre-launch/test phase): fail gracefully to a
  // notice rather than a 500. The UI already renders these CTAs disabled.
  if (!priceId) {
    redirect("/gate?checkout=unavailable");
  }

  const origin = await getOrigin();
  const mode = checkoutMode(plan);
  const stripe = getStripe();

  // If the user redeemed a partner DISCOUNT code for this package, apply it as a
  // one-time coupon. (Comp codes never reach checkout — they unlock directly.)
  let discountParam:
    | { discounts: { coupon: string }[] }
    | { allow_promotion_codes: true } = { allow_promotion_codes: true };
  if (plan === "will" || plan === "trust") {
    const pending = await getPendingDiscount();
    if (
      pending &&
      pending.package === plan &&
      pending.discountPct > 0 &&
      pending.discountPct < 100
    ) {
      const coupon = await stripe.coupons.create({
        percent_off: pending.discountPct,
        duration: "once",
        name: `Partner ${pending.discountPct}% off`,
      });
      discountParam = { discounts: [{ coupon: coupon.id }] };
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    metadata: { user_id: user.id, plan, party },
    ...(mode === "subscription"
      ? { subscription_data: { metadata: { user_id: user.id, plan } } }
      : {}),
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/gate?checkout=cancel`,
    ...discountParam,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

/** Open the Stripe billing portal for managing the membership. */
export async function openBillingPortalAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  const customerId = (sub as { stripe_customer_id: string | null } | null)
    ?.stripe_customer_id;
  if (!customerId) {
    redirect("/dashboard?portal=unavailable");
  }

  const origin = await getOrigin();
  const portal = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard`,
  });

  redirect(portal.url);
}
