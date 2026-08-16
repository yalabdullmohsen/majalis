/**
 * اشتقاق roleType و cautionLevel للعلماء دون إعادة كتابة السير.
 */
import type { Scholar } from "./scholars-data";

export type ScholarRoleType =
  | "فقيه"
  | "محدث"
  | "مفسر"
  | "مؤرخ"
  | "لغوي"
  | "فيلسوف"
  | "معاصر"
  | "عالم";

export type ScholarCautionLevel = "none" | "context" | "review";

const ROLE_PRIORITY: ScholarRoleType[] = [
  "فقيه",
  "محدث",
  "مفسر",
  "مؤرخ",
  "لغوي",
  "فيلسوف",
  "معاصر",
  "عالم",
];

export function inferScholarRoleType(s: Scholar): ScholarRoleType {
  if (s.era === "المعاصرون") return "معاصر";
  const specs = s.specialty.map((x) => x.trim());
  if (specs.some((x) => /فلسف|منطق|كلام/.test(x))) return "فيلسوف";
  if (specs.some((x) => /تفسير/.test(x))) return "مفسر";
  if (specs.some((x) => /حديث|رجال|علل/.test(x))) return "محدث";
  if (specs.some((x) => /تاريخ|سيرة/.test(x))) return "مؤرخ";
  if (specs.some((x) => /لغة|نحو|أدب/.test(x))) return "لغوي";
  if (specs.some((x) => /فقه|أصول|مقاصد/.test(x))) return "فقيه";
  return "عالم";
}

export function inferScholarCautionLevel(s: Scholar): ScholarCautionLevel {
  if (s.verificationStatus === "draft" || s.verificationStatus === "pending_review") {
    return "review";
  }
  if (!s.sources || s.sources.length === 0) return "review";
  if (inferScholarRoleType(s) === "فيلسوف") return "context";
  if (s.specialty.some((x) => /فلسف|منطق|تصوف|كلام/.test(x))) return "context";
  return "none";
}

export const SCHOLAR_ROLE_FILTERS: Array<ScholarRoleType | "الكل"> = [
  "الكل",
  ...ROLE_PRIORITY,
];

export function scholarCautionLabel(level: ScholarCautionLevel): string | null {
  if (level === "review") return "يحتاج مراجعة مصادر";
  if (level === "context") return "يُقرأ بسياق منهجي";
  return null;
}
