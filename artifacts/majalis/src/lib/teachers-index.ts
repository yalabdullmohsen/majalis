import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { splitKuwaitLessons } from "@/lib/kuwait-lessons";
import { formatSheikhName, sheikhNameKey } from "@/lib/sheikh-name";
import { resolveLocalSheikhPhoto } from "@/lib/sheikh-photos";

export type ContemporaryTeacher = {
  slug: string;
  name: string;
  lessonCount: number;
  activeCount: number;
  archivedCount: number;
  photoUrl: string;
};

/** مسار آمن لاسم الشيخ في URL — يعتمد على sheikhNameKey ثم ترميز URI. */
export function sheikhNameToSlug(name: string): string {
  const key = sheikhNameKey(name);
  return key ? encodeURIComponent(key) : "";
}

export function decodeTeacherSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function teacherSlugMatchesName(slug: string, name: string): boolean {
  const decoded = decodeTeacherSlug(slug);
  return sheikhNameKey(name) === decoded;
}

export function buildTeachersFromLessons(lessons: KuwaitLessonRecord[]): ContemporaryTeacher[] {
  const { active, archived } = splitKuwaitLessons(lessons);
  const map = new Map<string, ContemporaryTeacher>();

  const bump = (lesson: KuwaitLessonRecord, kind: "active" | "archived") => {
    const key = sheikhNameKey(lesson.sheikhName);
    if (!key) return;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        slug: encodeURIComponent(key),
        name: formatSheikhName(lesson.sheikhName) || lesson.sheikhName.trim(),
        lessonCount: 0,
        activeCount: 0,
        archivedCount: 0,
        photoUrl: resolveLocalSheikhPhoto(lesson.sheikhName),
      };
      map.set(key, entry);
    }
    entry.lessonCount += 1;
    if (kind === "active") entry.activeCount += 1;
    else entry.archivedCount += 1;
  };

  for (const lesson of active) bump(lesson, "active");
  for (const lesson of archived) bump(lesson, "archived");

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
}

export function findTeacherBySlug(
  teachers: ContemporaryTeacher[],
  slug: string,
): ContemporaryTeacher | null {
  const decoded = decodeTeacherSlug(slug);
  return teachers.find((t) => decodeTeacherSlug(t.slug) === decoded) ?? null;
}

export function filterLessonsForTeacher(
  lessons: KuwaitLessonRecord[],
  slug: string,
): { active: KuwaitLessonRecord[]; archived: KuwaitLessonRecord[] } {
  const decoded = decodeTeacherSlug(slug);
  const match = (lesson: KuwaitLessonRecord) => sheikhNameKey(lesson.sheikhName) === decoded;
  const { active, archived } = splitKuwaitLessons(lessons);
  return {
    active: active.filter(match),
    archived: archived.filter(match),
  };
}
