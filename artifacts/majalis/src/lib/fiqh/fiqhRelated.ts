import type { FiqhLessonHit } from "@/lib/fiqh-books";
import {
  listPublishedLessonHits,
  resolveLessonDoor,
  sortLessonsByCompleteness,
} from "@/lib/fiqh/fiqhNormalize";

export function relatedFiqhIssues(
  current: FiqhLessonHit,
  limit = 6,
): FiqhLessonHit[] {
  const door = resolveLessonDoor(current);
  const sameChapter = listPublishedLessonHits().filter(
    (hit) =>
      hit.lesson.id !== current.lesson.id &&
      hit.book.id === current.book.id &&
      hit.chapter.id === current.chapter.id,
  );
  if (sameChapter.length >= limit) {
    return sameChapter.slice(0, limit);
  }

  const sameBook = listPublishedLessonHits().filter(
    (hit) =>
      hit.lesson.id !== current.lesson.id &&
      hit.book.id === current.book.id &&
      hit.chapter.id !== current.chapter.id,
  );
  const sameDoor = listPublishedLessonHits().filter(
    (hit) =>
      hit.lesson.id !== current.lesson.id &&
      hit.book.id !== current.book.id &&
      resolveLessonDoor(hit) === door,
  );

  const merged = sortLessonsByCompleteness([...sameChapter, ...sameBook, ...sameDoor]);
  const seen = new Set<string>();
  const out: FiqhLessonHit[] = [];
  for (const hit of merged) {
    if (seen.has(hit.lesson.id)) continue;
    seen.add(hit.lesson.id);
    out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}

export function fiqhDoorBackHref(hit: FiqhLessonHit): string {
  return `/fiqh/books/${hit.book.id}`;
}
