/**
 * Official-source verification predicates (legacy council helpers).
 * Kept as a pure predicate for phase1 quality gate — no council product surface.
 */

export function isOfficialSourceVerified(item: {
  source_name?: string | null;
  source_url?: string | null;
  confidence_level?: string | null;
}): boolean {
  return Boolean(
    item.source_name &&
      item.source_url &&
      item.confidence_level === "source_verified",
  );
}
