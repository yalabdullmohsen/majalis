/**
 * تطبيع عرض الحديث — حكم موحّد، مصدر نظيف، متن مختصر.
 */
import { extractDisplayMatn } from "@/lib/hadith-access";
import { normalizePublicSource } from "@/lib/content-display-zones";
import { truncateAtWord } from "@/lib/utils";

export type HadithGradeKind = "sahih" | "hasan" | "daif" | "mawdu" | "pending" | "unknown";

export type HadithRecord = {
  id: string;
  title: string | null;
  text: string;
  narrator: string | null;
  source_name: string | null;
  grade: string | null;
  collection: string | null;
  chapter: string | null;
  explanation: string | null;
  keywords: string[] | null;
  hadith_number: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
};

const GRADE_CLASS: Record<HadithGradeKind, string> = {
  sahih: "hadith-grade--sahih",
  hasan: "hadith-grade--hasan",
  daif: "hadith-grade--daif",
  mawdu: "hadith-grade--mawdu",
  pending: "hadith-grade--pending",
  unknown: "hadith-grade--unknown",
};

/** يصنّف الحكم إلى فئة عرض. */
export function classifyHadithGrade(grade: string | null | undefined): HadithGradeKind {
  const g = String(grade || "").trim();
  if (!g) return "unknown";
  if (/موضوع|باطل|مكذوب|لا\s*أصل/i.test(g)) return "mawdu";
  if (/ضعيف/.test(g)) return "daif";
  if (/حسن\s*صحيح|صحيح\s*حسن/i.test(g)) return "sahih";
  // لا تستخدم \b مع العربية — حدود الكلمات ASCII فقط وتُفشل «صحيح»/«حسن».
  if (/^حسن(\s|$)/.test(g) || /(^|\s)حسن(\s|$)/.test(g)) return "hasan";
  if (/^صحيح(\s|$)/.test(g) || /متفق/.test(g)) return "sahih";
  if (/قيد|مراجعة|تدقيق/i.test(g)) return "pending";
  return "unknown";
}

/**
 * صيغة موحّدة للواجهة العامة: «الحكم: صحيح».
 * حالات التحرير الداخلية (قيد التدقيق / غير معروف بلا نص) لا تُعرض للمستخدم.
 */
export function formatHadithGradeLabel(grade: string | null | undefined): string {
  const kind = classifyHadithGrade(grade);
  switch (kind) {
    case "sahih":
      return "الحكم: صحيح";
    case "hasan":
      return "الحكم: حسن";
    case "daif":
      return "الحكم: ضعيف";
    case "mawdu":
      return "الحكم: موضوع";
    case "pending":
      /* حالة تحريرية داخلية — لا تُعرض في الواجهة العامة */
      return "";
    default: {
      const raw = String(grade || "").trim();
      if (!raw) return "";
      /* حكم نصّي غير مصنَّف — نعرضه كما هو بلا وسم workflow */
      return `الحكم: ${raw}`;
    }
  }
}

/** هل للحكم شارة عامة آمنة للعرض؟ */
export function hasPublicHadithGrade(grade: string | null | undefined): boolean {
  return formatHadithGradeLabel(grade).length > 0;
}

export function hadithGradeCssClass(grade: string | null | undefined): string {
  return GRADE_CLASS[classifyHadithGrade(grade)];
}

export function normalizeHadithSource(
  source: string | null | undefined,
  grade?: string | null,
): string {
  const cleaned = normalizePublicSource(source ?? undefined, grade ?? undefined);
  if (cleaned) return cleaned.replace(/الدرجة في حقل الحكم/gi, "").trim();
  const raw = String(source || "").trim();
  if (!raw) return "";
  return raw.replace(/الدرجة في حقل الحكم[^.]*$/u, "").trim();
}

export function summarizeHadithMatn(
  item: Pick<HadithRecord, "title" | "text">,
  maxLen = 160,
): string {
  const matn = extractDisplayMatn(item.title, item.text);
  if (!matn) return "";
  return truncateAtWord(matn, maxLen);
}

export function isHadithComplete(item: HadithRecord): boolean {
  const matn = extractDisplayMatn(item.title, item.text);
  if (!matn || matn.length < 12) return false;
  if (!item.source_name?.trim()) return false;
  const kind = classifyHadithGrade(item.grade);
  return kind !== "unknown" && kind !== "pending";
}

export function hadithCompletenessScore(item: HadithRecord): number {
  let score = 0;
  if (extractDisplayMatn(item.title, item.text).length >= 12) score += 3;
  if (item.source_name?.trim()) score += 2;
  if (item.grade?.trim()) score += 2;
  if (item.hadith_number?.trim()) score += 1;
  if (item.chapter?.trim()) score += 1;
  if (item.explanation?.trim()) score += 1;
  return score;
}

/** نص مشاركة الحديث — بلا نص طويل جدًا. */
export function buildHadithShareText(
  item: HadithRecord,
  url: string,
): string {
  const excerpt = summarizeHadithMatn(item, 100);
  const grade = formatHadithGradeLabel(item.grade);
  return grade
    ? `من موقع سُنّة: ${excerpt} - ${grade} ${url}`
    : `من موقع سُنّة: ${excerpt} ${url}`;
}

export function sanitizeHadithDisplay(value: string | null | undefined): string {
  const s = String(value ?? "").trim();
  if (!s || s === "undefined" || s === "null" || s === "NaN") return "";
  if (/الدرجة في حقل الحكم/i.test(s)) return "";
  return s;
}
