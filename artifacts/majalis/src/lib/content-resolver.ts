import { expandContentIdentifiers, matchesContentIdentifier, normalizeRouteParam } from "./content-id";
import { findSeedLessonById, type LessonSeedRow } from "@/lib/lessons-seed";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { mapLessonRow } from "@/lib/kuwait-lessons";

export type ContentResolveSource = "supabase" | "seed" | "merged" | "catalog";

export type ResolvedLesson = {
  lesson: KuwaitLessonRecord | null;
  source: ContentResolveSource;
  matchedId: string | null;
};

export function findLessonInList(
  lessons: KuwaitLessonRecord[],
  rawParam: string | undefined | null,
): KuwaitLessonRecord | undefined {
  const normalized = normalizeRouteParam(rawParam);
  if (!normalized) return undefined;
  return lessons.find((lesson) => matchesContentIdentifier(lesson.id, normalized));
}

export function resolveLessonFromSeed(rawParam: string): KuwaitLessonRecord | null {
  const candidates = expandContentIdentifiers(rawParam);
  for (const candidate of candidates) {
    const row = findSeedLessonById(candidate);
    if (row) return mapLessonRow({ ...row, source: "seed" });
  }
  return null;
}

export function resolveLessonRecord(
  lessons: KuwaitLessonRecord[],
  rawParam: string,
  source: ContentResolveSource = "merged",
): ResolvedLesson {
  const normalized = normalizeRouteParam(rawParam);
  if (!normalized) {
    return { lesson: null, source, matchedId: null };
  }

  const found = findLessonInList(lessons, normalized);
  if (found) {
    return { lesson: found, source, matchedId: found.id };
  }

  const seed = resolveLessonFromSeed(normalized);
  if (seed) {
    return { lesson: seed, source: "seed", matchedId: seed.id };
  }

  return { lesson: null, source, matchedId: null };
}

/** Match a raw DB/seed row before mapping. */
export function rowMatchesIdentifier(
  row: Pick<LessonSeedRow, "id" | "external_key"> & { content_hash?: string | null },
  rawParam: string,
): boolean {
  const ids = [
    row.external_key,
    row.id,
    row.content_hash,
  ]
    .filter(Boolean)
    .map(String);

  return ids.some((id) => matchesContentIdentifier(id, rawParam));
}
