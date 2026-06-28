/**
 * Resolve connector authority for dedup / conflict resolution.
 * Higher score = more trusted source.
 */
export function mapLegacyPriority(sourcePriority) {
  const map = { 1: 100, 2: 95, 3: 85, 4: 80, 5: 90, 6: 60, 7: 60, 8: 30 };
  return map[sourcePriority] ?? 30;
}

export function resolveConnectorAuthority(connectorConfig = {}) {
  const score =
    connectorConfig.authority_score ??
    connectorConfig.authorityScore ??
    mapLegacyPriority(connectorConfig.source_priority ?? connectorConfig.sourcePriority) ??
    mapPublisherType(connectorConfig.publisher_type || connectorConfig.api_config?.source_subtype) ??
    30;

  return {
    authorityScore: Number(score) || 30,
    priority: connectorConfig.priority ?? (Number(score) || 30),
    official: Boolean(connectorConfig.official),
    publisherType: connectorConfig.publisher_type || connectorConfig.api_config?.source_subtype || "unknown",
  };
}

function mapPublisherType(type) {
  const map = {
    official_website: 100,
    scholar_official: 95,
    ministry: 90,
    university: 90,
    mosque_official: 85,
    course_account: 80,
    mosque_women_committee: 75,
    lesson_aggregator: 60,
    verification_fixture: 85,
  };
  return map[type] ?? null;
}

export const AUTHORITY_RULES = {
  official_website: 100,
  scholar_official: 95,
  government: 90,
  ministry: 90,
  university: 90,
  mosque_official: 85,
  course_account: 80,
  mosque_women_committee: 75,
  lesson_aggregator: 60,
  unknown: 30,
};
