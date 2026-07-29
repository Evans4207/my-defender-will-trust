import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { describeEnvGaps, stripeEnv, emailEnv, cronEnv } from "./env";

const MANAGED = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_WILL_INDIVIDUAL",
  "STRIPE_PRICE_TRUST_INDIVIDUAL",
  "STRIPE_PRICE_MEMBERSHIP",
  "STRIPE_PRICE_WILL_COUPLES",
  "STRIPE_PRICE_TRUST_COUPLES",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CRON_SECRET",
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const key of MANAGED) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of MANAGED) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function setAll(keys: readonly string[]): void {
  for (const k of keys) process.env[k] = `test_${k}`;
}

describe("stripeEnv", () => {
  it("names every missing variable in one error", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test";
    try {
      stripeEnv();
      throw new Error("expected stripeEnv to throw");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain("STRIPE_WEBHOOK_SECRET");
      expect(message).toContain("STRIPE_PRICE_MEMBERSHIP");
      // The one that IS set must not be reported.
      expect(message).not.toContain("STRIPE_SECRET_KEY,");
    }
  });

  it("returns the values once all are set", () => {
    setAll([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_WILL_INDIVIDUAL",
      "STRIPE_PRICE_TRUST_INDIVIDUAL",
      "STRIPE_PRICE_MEMBERSHIP",
    ]);
    expect(stripeEnv().STRIPE_SECRET_KEY).toBe("test_STRIPE_SECRET_KEY");
  });

  it("does not require the couples price IDs while the tier is closed", () => {
    setAll([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_WILL_INDIVIDUAL",
      "STRIPE_PRICE_TRUST_INDIVIDUAL",
      "STRIPE_PRICE_MEMBERSHIP",
    ]);
    expect(() => stripeEnv()).not.toThrow();
  });
});

describe("emailEnv and cronEnv", () => {
  it("throws naming the email variables", () => {
    expect(() => emailEnv()).toThrow(/RESEND_API_KEY/);
    expect(() => emailEnv()).toThrow(/EMAIL_FROM/);
  });

  it("throws naming the cron secret", () => {
    expect(() => cronEnv()).toThrow(/CRON_SECRET/);
  });

  it("uses the singular wording for a single missing variable", () => {
    expect(() => cronEnv()).toThrow(/Missing environment variable: CRON_SECRET/);
  });
});

describe("describeEnvGaps", () => {
  it("reports every group when nothing is configured", () => {
    const gaps = describeEnvGaps();
    expect(gaps.map((g) => g.group).sort()).toEqual([
      "Cron",
      "Email (Resend)",
      "Stripe",
      "Supabase (server)",
    ]);
  });

  it("reports nothing once every variable is set", () => {
    setAll(MANAGED);
    expect(describeEnvGaps()).toEqual([]);
  });

  it("omits a group that is fully configured", () => {
    setAll(["CRON_SECRET"]);
    expect(describeEnvGaps().map((g) => g.group)).not.toContain("Cron");
  });

  it("includes the couples price IDs only when asked", () => {
    setAll([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_WILL_INDIVIDUAL",
      "STRIPE_PRICE_TRUST_INDIVIDUAL",
      "STRIPE_PRICE_MEMBERSHIP",
    ]);
    expect(describeEnvGaps().map((g) => g.group)).not.toContain("Stripe");
    const withCouples = describeEnvGaps({ couplesTierOpen: true });
    expect(withCouples.find((g) => g.group === "Stripe")?.missing).toEqual([
      "STRIPE_PRICE_WILL_COUPLES",
      "STRIPE_PRICE_TRUST_COUPLES",
    ]);
  });
});
