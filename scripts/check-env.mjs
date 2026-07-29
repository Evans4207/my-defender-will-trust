// Pre-launch readiness check: reports which environment variables are still
// unset, grouped by subsystem. Prints names only, never values.
//
// Exit code 0 means every group is configured; 1 means something is missing, so
// this is safe to call from CI or a deploy gate.
//
// Usage: node scripts/check-env.mjs [--couples]
//        npm run check:env
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// Load .env.local so this reflects what `next dev` would see locally.
try {
  const text = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // No .env.local — read the ambient environment only.
}

const couples = process.argv.includes("--couples");

const GROUPS = [
  {
    group: "Supabase (client)",
    names: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SITE_URL",
    ],
  },
  { group: "Supabase (server)", names: ["SUPABASE_SERVICE_ROLE_KEY"] },
  {
    group: "Stripe",
    names: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_WILL_INDIVIDUAL",
      "STRIPE_PRICE_TRUST_INDIVIDUAL",
      "STRIPE_PRICE_MEMBERSHIP",
      ...(couples
        ? ["STRIPE_PRICE_WILL_COUPLES", "STRIPE_PRICE_TRUST_COUPLES"]
        : []),
    ],
  },
  { group: "Email (Resend)", names: ["RESEND_API_KEY", "EMAIL_FROM"] },
  { group: "Cron", names: ["CRON_SECRET"] },
  { group: "Legal", names: ["DISCLAIMER_VERSION"] },
];

let missingCount = 0;
for (const { group, names } of GROUPS) {
  const missing = names.filter((n) => !process.env[n]);
  missingCount += missing.length;
  if (missing.length === 0) {
    console.log(`  ok      ${group}`);
  } else {
    console.log(`  MISSING ${group}: ${missing.join(", ")}`);
  }
}

if (!couples) {
  console.log(
    "\n  note    Couples price IDs not checked (tier closed — see src/lib/features.ts).",
  );
  console.log("          Re-run with --couples once that tier reopens.");
}

if (missingCount > 0) {
  console.log(`\n  ${missingCount} variable(s) still unset.`);
  process.exit(1);
}
console.log("\n  All groups configured.");
