export type PackageKey = "will" | "trust";
export type ProductKey = PackageKey | "membership";
export type EntitlementSource = "subscription" | "code";

/** Read-only grace window after a membership lapses, in days. */
export const MEMBERSHIP_GRACE_DAYS = 30;

/**
 * A row from `entitlement_grants`. `expires_at = null` means the product is
 * owned outright and never expires — that is the whole point of the table.
 */
export type GrantRow = {
  product: string | null;
  source: string | null;
  granted_at?: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

export type Entitlement = {
  /** True if the user can build or edit at least one document package. */
  unlocked: boolean;
  /** Packages the user may build or edit right now. Gates the interview. */
  packages: PackageKey[];
  /**
   * Packages the user owns outright — a permanent grant with no expiry. Gates
   * access to already-generated documents, which must never become unreachable.
   */
  owned: PackageKey[];
  /** Active membership. Gates the vault, checkup and reminders. */
  membership: boolean;
  /** The user has held a membership at some point, active or not. */
  membershipEver: boolean;
  /** True while a lapsed membership is still inside the read-only grace window. */
  membershipGrace: boolean;
  /** Primary source that unlocked access (purchase preferred over code). */
  source: EntitlementSource | null;
};

const PACKAGE_KEYS: readonly string[] = ["will", "trust"];

function isPackage(value: string | null | undefined): value is PackageKey {
  return value != null && PACKAGE_KEYS.includes(value);
}

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/** A grant is live when it has not been revoked and has not expired. */
function isLive(grant: GrantRow, nowMs: number): boolean {
  if (grant.revoked_at) return false;
  const expires = parseTime(grant.expires_at);
  // No expiry recorded means owned outright.
  if (expires == null) return true;
  return expires > nowMs;
}

/** A grant is permanent when it is unrevoked and carries no expiry at all. */
function isPermanent(grant: GrantRow): boolean {
  return !grant.revoked_at && !grant.expires_at;
}

/**
 * Pure entitlement resolution over `entitlement_grants`.
 *
 * Three separate questions, deliberately not collapsed into one boolean:
 *
 *   packages   — may they BUILD or EDIT a document?   (a live grant)
 *   owned      — do they OWN an already-generated set? (a permanent grant)
 *   membership — may they use the vault and perks?     (a live membership grant)
 *
 * A one-time package purchase produces a grant with `expires_at = null`, so it
 * appears in both `packages` and `owned` and cannot lapse. Only an explicit
 * revocation — a refund or a chargeback — removes it.
 */
export function computeEntitlement(input: {
  grants: GrantRow[];
  /** Injected for testability; defaults to the current time. */
  now?: Date;
}): Entitlement {
  const nowMs = (input.now ?? new Date()).getTime();
  const grants = input.grants ?? [];

  const live = grants.filter((g) => isLive(g, nowMs));

  const packages = Array.from(
    new Set(live.map((g) => g.product).filter(isPackage)),
  );

  const owned = Array.from(
    new Set(
      grants
        .filter(isPermanent)
        .map((g) => g.product)
        .filter(isPackage),
    ),
  );

  const membershipGrants = grants.filter((g) => g.product === "membership");
  const membership = membershipGrants.some((g) => isLive(g, nowMs));
  const membershipEver = membershipGrants.length > 0;

  // Grace runs from the latest expiry across all membership grants.
  const latestExpiry = membershipGrants.reduce<number | null>((acc, g) => {
    if (g.revoked_at) return acc;
    const t = parseTime(g.expires_at);
    if (t == null) return acc;
    return acc == null || t > acc ? t : acc;
  }, null);
  const graceEnds =
    latestExpiry == null
      ? null
      : latestExpiry + MEMBERSHIP_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const membershipGrace =
    !membership && graceEnds != null && graceEnds > nowMs;

  // A purchase outranks a code as the reported source.
  const packageGrants = live.filter((g) => isPackage(g.product));
  const source: EntitlementSource | null = packageGrants.some(
    (g) => g.source === "purchase" || g.source === "manual",
  )
    ? "subscription"
    : packageGrants.some((g) => g.source === "code")
      ? "code"
      : null;

  return {
    unlocked: packages.length > 0,
    packages,
    owned,
    membership,
    membershipEver,
    membershipGrace,
    source,
  };
}
