/**
 * نطاق عرض صفحة الدروس: الكويت فقط.
 * المصادر خارج النطاق تُستبعد من العرض مع excludedReason — دون حذف المصدر من البذور.
 */
import { sheikhNameKey } from "@/lib/sheikh-name";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

export type LessonExclusionReason = "outside_kuwait";

const OUTSIDE_KUWAIT_SHEIKH_KEYS = new Set(
  [
    "عبد الرزاق البدر",
    "عبدالرزاق البدر",
    "راغب السرجاني",
    "صالح الفوزان",
    "عبد الكريم الخضير",
    "عبدالكريم الخضير",
  ].map((n) => sheikhNameKey(n)),
);

const OUTSIDE_PLACE_RE =
  /المدينة\s*المنورة|مك[ةه]\s*المكرمة|الرياض|القصيم|جدة|المملكة\s*العربية\s*السعودية/u;

export function matchOutsideKuwaitSheikh(name: string): boolean {
  const key = sheikhNameKey(name);
  if (!key) return false;
  if (OUTSIDE_KUWAIT_SHEIKH_KEYS.has(key)) return true;
  return /عبد\s*الرزاق/.test(name) && /البدر/.test(name);
}

export function isOutsideKuwaitLesson(
  lesson: Pick<
    KuwaitLessonRecord,
    "sheikhName" | "mosque" | "region" | "governorate" | "note" | "description"
  >,
): boolean {
  if (matchOutsideKuwaitSheikh(lesson.sheikhName)) return true;
  const place = [lesson.mosque, lesson.region, lesson.governorate, lesson.note, lesson.description]
    .filter(Boolean)
    .join(" ");
  if (place && OUTSIDE_PLACE_RE.test(place) && matchOutsideKuwaitSheikh(lesson.sheikhName)) {
    return true;
  }
  return false;
}

export type KuwaitDisplayLesson = KuwaitLessonRecord & {
  excludedReason?: LessonExclusionReason;
};

export function partitionKuwaitDisplayLessons(lessons: KuwaitLessonRecord[]): {
  visible: KuwaitLessonRecord[];
  excluded: KuwaitDisplayLesson[];
} {
  const visible: KuwaitLessonRecord[] = [];
  const excluded: KuwaitDisplayLesson[] = [];
  for (const lesson of lessons) {
    if (isOutsideKuwaitLesson(lesson)) {
      excluded.push({ ...lesson, excludedReason: "outside_kuwait" });
    } else {
      visible.push(lesson);
    }
  }
  return { visible, excluded };
}

export function filterKuwaitOnlyForDisplay(lessons: KuwaitLessonRecord[]): KuwaitLessonRecord[] {
  return partitionKuwaitDisplayLessons(lessons).visible;
}
