import type { Museum } from "../types/museum";

/**
 * As of the May 2026 passport, ASTC publishes admittance rules once for the
 * whole program rather than per venue, so ASTC entries carry an empty
 * `admittancePolicy` and fall back to this.
 */
export const ASTC_ADMITTANCE_RULE =
  "Individual memberships admit the cardholder, Dual memberships admit two individuals, and Group memberships admit up to two adults and four children.";

/** Policy text to show for a museum, or `""` when there is nothing to show. */
export function admittancePolicyFor(museum: Museum): string {
  if (museum.admittancePolicy !== "") return museum.admittancePolicy;
  return museum.type === "astc" ? ASTC_ADMITTANCE_RULE : "";
}

/** Labelled tier groups that are non-empty, ready to render. */
export function membershipTierGroups(museum: Museum): { label: string; tiers: string[] }[] {
  const eligible = museum.eligibleMemberships;
  if (eligible === undefined) return [];
  return [
    { label: "Individual", tiers: eligible.individual },
    { label: "Group", tiers: eligible.group },
  ].filter((entry) => entry.tiers.length > 0);
}
