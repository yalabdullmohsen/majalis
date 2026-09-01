/**
 * فلترة وترتيب الأحاديث — حكم، اكتمال، منع التكرار.
 */
import { hadithCorpusKey } from "@/lib/hadith-access";
import { isBlockedFromPublic } from "@/lib/content-display-zones";
import {
  classifyHadithGrade,
  hadithCompletenessScore,
  type HadithGradeKind,
  type HadithRecord,
} from "./hadithNormalize";

export type HadithGradeFilter = "all" | "sahih" | "hasan" | "daif";

export const HADITH_GRADE_FILTER_OPTIONS: ReadonlyArray<{ id: HadithGradeFilter; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "sahih", label: "الصحيح" },
  { id: "hasan", label: "الحسن" },
  { id: "daif", label: "الضعيف" },
];

const FILTER_TO_KIND: Record<Exclude<HadithGradeFilter, "all">, HadithGradeKind[]> = {
  sahih: ["sahih"],
  hasan: ["hasan"],
  daif: ["daif", "mawdu"],
};

export function filterHadithByGrade(
  items: HadithRecord[],
  filter: HadithGradeFilter,
): HadithRecord[] {
  if (filter === "all") return items;
  const allowed = FILTER_TO_KIND[filter];
  return items.filter((h) => allowed.includes(classifyHadithGrade(h.grade)));
}

/** يزيل التكرار — يُبقي الأكثر اكتمالًا. */
export function dedupeHadithRecords(items: HadithRecord[]): HadithRecord[] {
  const byKey = new Map<string, HadithRecord>();
  for (const item of items) {
    const key = hadithCorpusKey(item.collection, item.hadith_number) || item.id;
    const prev = byKey.get(key);
    if (!prev || hadithCompletenessScore(item) > hadithCompletenessScore(prev)) {
      byKey.set(key, item);
    }
  }
  const seenText = new Set<string>();
  const out: HadithRecord[] = [];
  for (const item of byKey.values()) {
    const norm = item.text.replace(/\s+/g, " ").trim().slice(0, 120);
    if (norm && seenText.has(norm)) continue;
    if (norm) seenText.add(norm);
    out.push(item);
  }
  return out;
}

/** المكتمل أولًا ثم الأحدث إن وُجد created_at. */
export function sortHadithByCompleteness(items: HadithRecord[]): HadithRecord[] {
  return [...items].sort((a, b) => {
    const ds = hadithCompletenessScore(b) - hadithCompletenessScore(a);
    if (ds !== 0) return ds;
    return a.id.localeCompare(b.id, "ar");
  });
}

/** هل يُسمح بعرض الحديث في الرئيسية/الشريط؟ */
export function isHadithPromotable(item: HadithRecord): boolean {
  if (!item.grade?.trim()) return false;
  if (classifyHadithGrade(item.grade) === "unknown") return false;
  return !isBlockedFromPublic({
    text: item.text,
    source: item.source_name ?? undefined,
    grade: item.grade ?? undefined,
  });
}

export function applyHadithListPipeline(
  items: HadithRecord[],
  opts?: { gradeFilter?: HadithGradeFilter; dedupe?: boolean; sort?: boolean },
): HadithRecord[] {
  let rows = items;
  if (opts?.gradeFilter) rows = filterHadithByGrade(rows, opts.gradeFilter);
  if (opts?.dedupe !== false) rows = dedupeHadithRecords(rows);
  if (opts?.sort !== false) rows = sortHadithByCompleteness(rows);
  return rows;
}
