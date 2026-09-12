/**
 * سبب ظهور نتيجة البحث — عربي للمستخدم حسب نوع المحتوى.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";
import { scoreTolerantMatch, type TolerantMatch } from "@/features/search/tolerant-match";
import { searchKindFamily, searchKindLabelAr } from "@/features/search/search-kind-i18n";

export type SearchMatchField = "title" | "summary" | "source" | "name" | "kind" | "unknown";

export type SearchMatchReason = {
  field: SearchMatchField;
  label: string;
  /** ترتيب أولوية العرض/الترتيب (أصغر = أعلى) */
  rankBoost: number;
};

function fieldHit(text: string | undefined, query: string): TolerantMatch | null {
  if (!text?.trim() || !query.trim()) return null;
  return scoreTolerantMatch(text, query);
}

function titleReasonLabel(kind?: string | null): string {
  const family = searchKindFamily(kind);
  switch (family) {
    case "history":
      return "مطابقة في عنوان الحدث";
    case "hadith":
      return "مطابقة في متن الحديث";
    case "university":
      return "مطابقة في اسم الجامعة";
    case "mosque":
      return "مطابقة في اسم المسجد";
    case "scholar":
      return "مطابقة في اسم العالم";
    case "landmark":
      return "مطابقة في اسم المعلم";
    case "institution":
      return "مطابقة في اسم المؤسسة";
    case "seerah":
      return "مطابقة في عنوان السيرة";
    case "lesson":
      return "مطابقة في العنوان";
    case "quran":
      return "مطابقة في العنوان";
    default:
      return "مطابقة في العنوان";
  }
}

function nameReasonLabel(kind?: string | null): string {
  const family = searchKindFamily(kind);
  switch (family) {
    case "university":
      return "مطابقة في اسم الجامعة";
    case "mosque":
      return "مطابقة في اسم المسجد";
    case "scholar":
      return "مطابقة في اسم العالم";
    case "landmark":
      return "مطابقة في اسم المعلم";
    case "institution":
      return "مطابقة في اسم المؤسسة";
    default:
      return "مطابقة في الاسم";
  }
}

function summaryReasonLabel(kind?: string | null): string {
  const family = searchKindFamily(kind);
  if (family === "hadith") return "مطابقة في متن الحديث";
  if (family === "history") return "مطابقة في وصف الحدث";
  return "مطابقة في الوصف";
}

export function resolveSearchMatchReason(
  itemOrOpts:
    | {
        title: string;
        summary?: string | null;
        source?: string | null;
        kind?: string | null;
        query: string;
        match?: TolerantMatch | null;
      }
    | { title: string; summary?: string; kind?: string; match?: TolerantMatch; href?: string; id?: string },
  queryMaybe?: string,
): SearchMatchReason {
  const opts =
    typeof queryMaybe === "string"
      ? {
          title: (itemOrOpts as { title: string }).title,
          summary: (itemOrOpts as { summary?: string }).summary,
          source: (itemOrOpts as { source?: string }).source,
          kind: (itemOrOpts as { kind?: string }).kind,
          match: (itemOrOpts as { match?: TolerantMatch }).match,
          query: queryMaybe,
        }
      : (itemOrOpts as {
          title: string;
          summary?: string | null;
          source?: string | null;
          kind?: string | null;
          query: string;
          match?: TolerantMatch | null;
        });

  const q = opts.query.trim();
  if (!q) {
    return { field: "unknown", label: "نتيجة مقترحة", rankBoost: 9 };
  }

  const titleHit = fieldHit(opts.title, q);
  const summaryHit = fieldHit(opts.summary ?? undefined, q);
  const sourceHit = fieldHit(opts.source ?? undefined, q);
  const kindLabel = searchKindLabelAr(opts.kind);
  const kindHit = fieldHit(kindLabel, q);

  const titleNorm = normalizeArabic(opts.title);
  const qNorm = normalizeArabic(q);
  const family = searchKindFamily(opts.kind);
  const isNameFamily =
    family === "scholar" ||
    family === "university" ||
    family === "mosque" ||
    family === "landmark" ||
    family === "institution";

  /* 1. تطابق كامل */
  if (titleHit && titleHit.rank === 0 && titleNorm === qNorm) {
    return { field: "title", label: "تطابق كامل في العنوان", rankBoost: 0 };
  }
  /* 2. تطابق العنوان */
  if (titleHit && titleHit.rank <= 1) {
    return {
      field: isNameFamily ? "name" : "title",
      label: isNameFamily ? nameReasonLabel(opts.kind) : titleReasonLabel(opts.kind),
      rankBoost: 1,
    };
  }
  /* 3. تطابق الاسم / المصدر */
  if (sourceHit && sourceHit.rank <= 2) {
    return { field: "source", label: "مطابقة في المصدر", rankBoost: 2 };
  }
  if (isNameFamily && titleHit) {
    return { field: "name", label: nameReasonLabel(opts.kind), rankBoost: 2 };
  }
  if (kindHit && kindHit.rank <= 1) {
    return { field: "kind", label: `مطابقة في نوع «${kindLabel}»`, rankBoost: 3 };
  }
  /* 4. التطابق الدلالي / عنوان قريب */
  if (titleHit) {
    return { field: "title", label: "مطابقة قريبة في العنوان", rankBoost: 4 };
  }
  if (opts.match && opts.match.rank <= 1) {
    return { field: "title", label: titleReasonLabel(opts.kind), rankBoost: 1 };
  }
  /* 5. الوصف */
  if (summaryHit && summaryHit.rank <= 2) {
    return { field: "summary", label: summaryReasonLabel(opts.kind), rankBoost: 5 };
  }
  if (summaryHit) {
    return { field: "summary", label: "تطابق دلالي في الوصف", rankBoost: 6 };
  }
  return { field: "unknown", label: "تطابق دلالي", rankBoost: 7 };
}

/** ترتيب النتائج: تطابق كامل → عنوان → اسم → دلالي → وصف */
export function compareSearchResultsByMatch(
  a: { title: string; summary?: string; source?: string; kind?: string; match?: TolerantMatch },
  b: { title: string; summary?: string; source?: string; kind?: string; match?: TolerantMatch },
  query: string,
): number {
  const ra = resolveSearchMatchReason(a, query).rankBoost;
  const rb = resolveSearchMatchReason(b, query).rankBoost;
  if (ra !== rb) return ra - rb;
  const da = a.match?.distance ?? 99;
  const db = b.match?.distance ?? 99;
  if (da !== db) return da - db;
  return a.title.localeCompare(b.title, "ar");
}
