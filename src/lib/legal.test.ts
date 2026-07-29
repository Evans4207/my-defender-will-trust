import { describe, it, expect } from "vitest";
import {
  assertDisclaimerVersionApproved,
  isDisclaimerVersionApproved,
  DISCLAIMER_VERSION_PLACEHOLDER,
} from "./legal";

describe("isDisclaimerVersionApproved", () => {
  it("accepts a real version string", () => {
    expect(isDisclaimerVersionApproved("2026-09-01")).toBe(true);
  });

  it("rejects the placeholder", () => {
    expect(isDisclaimerVersionApproved(DISCLAIMER_VERSION_PLACEHOLDER)).toBe(false);
  });

  it("rejects anything still containing 'placeholder'", () => {
    expect(isDisclaimerVersionApproved("2026-07-placeholder")).toBe(false);
  });

  it("rejects an empty or whitespace value", () => {
    expect(isDisclaimerVersionApproved("")).toBe(false);
    expect(isDisclaimerVersionApproved("   ")).toBe(false);
  });
});

describe("assertDisclaimerVersionApproved", () => {
  // The test phase deliberately runs on the placeholder, so non-production
  // environments must not throw.
  it("allows a placeholder outside production", () => {
    expect(() => assertDisclaimerVersionApproved("development")).not.toThrow();
    expect(() => assertDisclaimerVersionApproved("test")).not.toThrow();
  });

  it("throws in production while the version is unapproved", () => {
    const saved = process.env.DISCLAIMER_VERSION;
    delete process.env.DISCLAIMER_VERSION;
    try {
      // DISCLAIMER_VERSION is resolved at module load, so with nothing set it is
      // the placeholder and production must refuse.
      expect(() => assertDisclaimerVersionApproved("production")).toThrow(
        /DISCLAIMER_VERSION/,
      );
    } finally {
      if (saved === undefined) delete process.env.DISCLAIMER_VERSION;
      else process.env.DISCLAIMER_VERSION = saved;
    }
  });
});
