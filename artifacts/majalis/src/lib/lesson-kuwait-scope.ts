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
    "عبد الرزاق البدر",
    "عبدالرزاق البدر",
    "راغب السرجاني",
    "صالح الفوزان",
    "عبد الكريم الخضير",
    "عبدالكريم الخضير",
    "ناصر العمر",
    "محمد العريفي",
  ].map((n) => sheikhNameKey(n)),
);

/** أماكن/دول خارج الكويت — يكفي ذكرها لاستبعاد العرض */
const OUTSIDE_PLACE_RE =
  /المدينة\s*المنورة|مك[ةه]\s*المكرمة|الرياض|القصيم|جدة|الدمام|الخبر|المملكة\s*العربية\s*السعودية|السعودية|مصر|القاهرة|الأزهر|الأردن|عمّ?ان|قطر|الدوحة|البحرين|المنامة|الإمارات|دبي|أبو\s*ظبي|عمان|المغرب|تونس|الجزائر|تركيا|إستانبول/u;

export function matchOutsideKuwaitSheikh(name: string): boolean {
  const key = sheikhNameKey(name);
  if (!key) return false;
  if (OUTSIDE_KUWAIT_SHEIKH_KEYS.has(key)) return true;
  // عبد الرزاق/الرزاق + البدر
  if (/عبد\s*الر[زز]اق/.test(name) && /البدر/.test(name)) return true;
  return false;
}

export function matchOutsideKuwaitPlace(text: string): boolean {
  return Boolean(text && OUTSIDE_PLACE_RE.test(text));
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
  if (matchOutsideKuwaitPlace(place)) return true;
  return false;
}

/** بطاقة حصاد / مصدر — فلترة عرض فقط */
export function isOutsideKuwaitHarvestItem(item: {
  sheikh?: string | null;
  place?: string | null;
  title_ar?: string | null;
  summary_ar?: string | null;
}): boolean {
  if (item.sheikh && matchOutsideKuwaitSheikh(item.sheikh)) return true;
  const blob = [item.place, item.title_ar, item.summary_ar, item.sheikh].filter(Boolean).join(" ");
  return matchOutsideKuwaitPlace(blob);
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
