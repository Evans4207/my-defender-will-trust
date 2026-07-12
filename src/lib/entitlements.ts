export type PackageKey = "will" | "trust";
export type EntitlementSource = "subscription" | "code";

export type Entitlement = {
  /** True if the user can access at least one document package. */
  unlocked: boolean;
  /** Document packages the user is entitled to build. */
  packages: PackageKey[];
  /** Whether the user has an active $49/yr membership. */
  membership: boolean;
  /** Primary source that unlocked access (subscription preferred). */
  source: EntitlementSource | null;
};

type SubRow = { status: string | null; plan: string | null };
type RedemptionRow = { package: string | null };

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/**
 * Pure entitlement resolution. A user is unlocked if they have an active
 * paid subscription for a document package OR any code redemption. Membership
 * ($49/yr) is tracked separately and does not by itself unlock a package.
 */
export function computeEntitlement(input: {
  subscriptions: SubRow[];
  redemptions: RedemptionRow[];
}): Entitlement {
  const subPackages = input.subscriptions
    .filter((s) => s.status != null && ACTIVE_STATUSES.has(s.status))
    .map((s) => s.plan)
    .filter((p): p is PackageKey => p === "will" || p === "trust");

  const codePackages = input.redemptions
    .map((r) => r.package)
    .filter((p): p is PackageKey => p === "will" || p === "trust");

  const membership = input.subscriptions.some(
    (s) => s.plan === "membership" && s.status != null && ACTIVE_STATUSES.has(s.status),
  );

  const packages = Array.from(new Set<PackageKey>([...subPackages, ...codePackages]));
  const source: EntitlementSource | null = subPackages.length
    ? "subscription"
    : codePackages.length
      ? "code"
      : null;

  return { unlocked: packages.length > 0, packages, membership, source };
}
