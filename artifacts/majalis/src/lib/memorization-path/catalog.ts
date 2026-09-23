/**
 * كتالوج مسار الحفظ للعامة — فارغ حتى تُنشر مسارات بمراجعة وترخيص.
 * القوالب الوثائقية في docs/memorization-research/path-templates.json.
 */

import { isHifzPathPubliclyVisible } from "./publication-states";
import type { HifzCategory, HifzPath } from "./types";

/** لا مسارات منشورة — القوالب DRAFT فقط في الوثائق. */
const PATHS: readonly HifzPath[] = [];

export function listAllHifzPathsInternal(): readonly HifzPath[] {
  return PATHS;
}

export function listPublishedHifzPaths(): HifzPath[] {
  return PATHS.filter(
    (p) =>
      isHifzPathPubliclyVisible(p.publicationStatus) && p.searchVisibility,
  );
}

export function listPublishedHifzPathsByCategory(
  category: HifzCategory,
): HifzPath[] {
  return listPublishedHifzPaths().filter((p) => p.category === category);
}

export function getPublishedHifzPathBySlug(slug: string): HifzPath | null {
  const path = PATHS.find((p) => p.slug === slug);
  if (!path || !isHifzPathPubliclyVisible(path.publicationStatus)) return null;
  return path;
}

export function countPublishedHifzPaths(): number {
  return listPublishedHifzPaths().length;
}

/** وحدات منشورة داخل مسار منشور فقط. */
export function listPublishedUnitsForPath(path: HifzPath) {
  return path.units
    .filter((u) => isHifzPathPubliclyVisible(u.publicationStatus))
    .slice()
    .sort((a, b) => a.sequence - b.sequence);
}
