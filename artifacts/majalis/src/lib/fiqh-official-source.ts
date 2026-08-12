/**
 * Official-source verification predicates for Fiqh Council items.
 * Extracted to break the fiqh-council-trust ↔ fiqh-verification-service cycle.
 */

import type { FiqhCouncilItem } from "./fiqh-council-types";

export function isOfficialSourceVerified(
  item: Pick<FiqhCouncilItem, "source_name" | "source_url" | "confidence_level">,
): boolean {
  return Boolean(
    item.source_name &&
      item.source_url &&
      item.confidence_level === "source_verified",
  );
}
