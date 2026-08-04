import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { generateInviteToken, hashInviteToken } from "./token";

describe("household invite tokens", () => {
  it("hashes deterministically as sha256 hex (and trims)", () => {
    const token = "abc123_TOKEN-value";
    const expected = createHash("sha256").update(token).digest("hex");
    expect(hashInviteToken(token)).toBe(expected);
    expect(hashInviteToken(`  ${token}  `)).toBe(expected); // trimmed
    expect(hashInviteToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates URL-safe, high-entropy, unique tokens", () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/); // base64url: no +, /, =
    expect(a.length).toBeGreaterThanOrEqual(24);
  });

  it("different tokens hash differently", () => {
    expect(hashInviteToken(generateInviteToken())).not.toBe(
      hashInviteToken(generateInviteToken()),
    );
  });
});
