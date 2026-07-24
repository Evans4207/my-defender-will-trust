import { describe, it, expect, afterEach } from "vitest";
import { assertPartyAvailable, stripeConfigured } from "./config";

// Guards the checkout action: the couples tier is intentionally disabled until
// mirror-document generation ships and counsel clears it. If someone re-enables
// couples without also restoring generation, these fail first.
describe("assertPartyAvailable (couples tier disabled)", () => {
  it("allows the individual party", () => {
    expect(assertPartyAvailable("individual")).toBe("individual");
  });

  it("rejects couples — cannot be fulfilled yet", () => {
    expect(() => assertPartyAvailable("couples")).toThrow(/couples/i);
  });

  it("rejects any other value (crafted POST)", () => {
    expect(() => assertPartyAvailable("family")).toThrow();
  });
});

describe("stripeConfigured", () => {
  const original = process.env.STRIPE_SECRET_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = original;
  });

  it("is false when the secret key is unset", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(stripeConfigured()).toBe(false);
  });

  it("is true when the secret key is set", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
    expect(stripeConfigured()).toBe(true);
  });
});
