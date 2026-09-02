import type { FiqhLessonHit } from "@/lib/fiqh-books";
import {
  expandFiqhFilterDoors,
  type FiqhCanonicalDoor,
  resolveLessonDoor,
  sortLessonsByCompleteness,
  dedupeLessonHits,
} from "@/lib/fiqh/fiqhNormalize";

export type FiqhDoorFilter = FiqhCanonicalDoor | "all";

export function filterLessonsByDoor(
  hits: FiqhLessonHit[],
  door: FiqhDoorFilter,
): FiqhLessonHit[] {
  const unique = dedupeLessonHits(hits);
  const expanded = expandFiqhFilterDoors(door);
  if (expanded === "all") return sortLessonsByCompleteness(unique);
  const allowed = new Set(expanded);
  return sortLessonsByCompleteness(
    unique.filter((hit) => allowed.has(resolveLessonDoor(hit))),
  );
}

export function filterLessonsByBook(
  hits: FiqhLessonHit[],
  bookId: string,
): FiqhLessonHit[] {
  if (!bookId) return sortLessonsByCompleteness(dedupeLessonHits(hits));
  return sortLessonsByCompleteness(
    dedupeLessonHits(hits).filter((hit) => hit.book.id === bookId),
  );
}
