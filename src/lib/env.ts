import { z } from "zod";

/**
 * Environment validation.
 *
 * Client vars (NEXT_PUBLIC_*) are safe to import anywhere and are required at
 * boot. Server-only secrets are read lazily so they are never bundled into
 * client code.
 *
 * Deliberately NOT all-or-nothing at boot. The app is designed to run during the
 * pre-launch test phase with Stripe, Resend and the PDF converter unconfigured —
 * `stripeConfigured()` renders disabled CTAs rather than throwing. So each
 * subsystem validates its own variables at the point of use, and reports every
 * missing name at once instead of failing on whichever one is read first.
 *
 * `describeEnvGaps()` gives the launch checklist a single place to ask "what is
 * still unset?" without throwing.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

// Each value is a direct static reference so Next can inline NEXT_PUBLIC_* vars.
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
});

function assertServerSide(caller: string): void {
  if (typeof window !== "undefined") {
    throw new Error(`${caller} must not be called in the browser`);
  }
}

/**
 * Read a group of required variables, naming every one that is missing. A single
 * error listing all of them beats three deploys that each surface one.
 */
function readGroup<K extends string>(
  group: string,
  names: readonly K[],
): Record<K, string> {
  const missing: string[] = [];
  const out = {} as Record<K, string>;
  for (const name of names) {
    const value = process.env[name];
    if (!value) missing.push(name);
    else out[name] = value;
  }
  if (missing.length) {
    throw new Error(
      `${group} is not configured. Missing environment variable${
        missing.length > 1 ? "s" : ""
      }: ${missing.join(", ")}`,
    );
  }
  return out;
}

const SUPABASE_SERVER_VARS = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

const STRIPE_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_WILL_INDIVIDUAL",
  "STRIPE_PRICE_TRUST_INDIVIDUAL",
  "STRIPE_PRICE_MEMBERSHIP",
] as const;

/**
 * Couples price IDs are only required while the couples tier is open. See
 * lib/features.ts — it is currently closed, so these are optional.
 */
const STRIPE_COUPLES_VARS = [
  "STRIPE_PRICE_WILL_COUPLES",
  "STRIPE_PRICE_TRUST_COUPLES",
] as const;

const EMAIL_VARS = ["RESEND_API_KEY", "EMAIL_FROM"] as const;

const CRON_VARS = ["CRON_SECRET"] as const;

let cachedServerEnv: Record<
  (typeof SUPABASE_SERVER_VARS)[number],
  string
> | null = null;

/** Server-only Supabase secrets. Never call from a Client Component. */
export function serverEnv() {
  assertServerSide("serverEnv()");
  if (!cachedServerEnv) {
    cachedServerEnv = readGroup("Supabase (server)", SUPABASE_SERVER_VARS);
  }
  return cachedServerEnv;
}

/**
 * Stripe configuration. Call at the point of use — creating a Checkout session,
 * verifying a webhook — so the pre-launch phase can run without it.
 */
export function stripeEnv() {
  assertServerSide("stripeEnv()");
  return readGroup("Stripe", STRIPE_VARS);
}

/** Outbound email configuration (Resend). */
export function emailEnv() {
  assertServerSide("emailEnv()");
  return readGroup("Email (Resend)", EMAIL_VARS);
}

/** Shared secret protecting the scheduled cron routes. */
export function cronEnv() {
  assertServerSide("cronEnv()");
  return readGroup("Cron", CRON_VARS);
}

export type EnvGap = { group: string; missing: string[] };

/**
 * Every unset variable, grouped by subsystem, without throwing. Intended for the
 * launch checklist and a deploy-time readiness log: it answers "is this
 * environment ready to take money?" in one call.
 */
export function describeEnvGaps(
  options: { couplesTierOpen?: boolean } = {},
): EnvGap[] {
  assertServerSide("describeEnvGaps()");
  const stripeVars = options.couplesTierOpen
    ? [...STRIPE_VARS, ...STRIPE_COUPLES_VARS]
    : STRIPE_VARS;

  const groups: { group: string; names: readonly string[] }[] = [
    { group: "Supabase (server)", names: SUPABASE_SERVER_VARS },
    { group: "Stripe", names: stripeVars },
    { group: "Email (Resend)", names: EMAIL_VARS },
    { group: "Cron", names: CRON_VARS },
  ];

  return groups
    .map(({ group, names }) => ({
      group,
      missing: names.filter((n) => !process.env[n]),
    }))
    .filter((g) => g.missing.length > 0);
}
