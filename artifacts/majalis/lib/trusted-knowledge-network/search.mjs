/**
 * Trusted Knowledge Network — Phase 5 related search grouping.
 */
import { groupByKind } from "../scholarly-intelligence/ranker.mjs";
import { RELATED_SEARCH_SECTIONS } from "./config.mjs";

export function buildRelatedSections(results) {
  const groups = groupByKind(results);
  const sections = {};

  for (const [sectionId, def] of Object.entries(RELATED_SEARCH_SECTIONS)) {
    const items = [];
    for (const kind of def.kinds) {
      if (groups[kind]) items.push(...groups[kind]);
    }
    if (items.length) {
      sections[sectionId] = {
        label: def.label,
        count: items.length,
        items: items.slice(0, 8),
      };
    }
  }

  return sections;
}

export { RELATED_SEARCH_SECTIONS };
