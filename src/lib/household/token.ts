import "server-only";
import { randomBytes, createHash } from "node:crypto";

/**
 * Household invite tokens. The RAW token travels only in the emailed / copied
 * link; the database stores only its SHA-256 hash (same discipline as access
 * codes never being stored in the clear). Acceptance hashes the incoming token
 * and matches on the hash.
 */

/** A URL-safe, high-entropy invite token (~32 chars). */
export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Stable hash of a token, for storage and lookup. */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex");
}

/** Invite validity window. */
export const INVITE_TTL_DAYS = 14;
