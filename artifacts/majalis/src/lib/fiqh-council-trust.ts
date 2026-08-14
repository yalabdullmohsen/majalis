import type { FiqhCouncilItem, FiqhCouncilIssue } from "./fiqh-council-types";
import {
  getItemCompletionScore,
  MIN_FIQH_COMPLETION_SCORE,
  verifyFiqhItem,
} from "./fiqh-verification-service";
import { isOfficialSourceVerified } from "./fiqh-official-source";

export { isOfficialSourceVerified } from "./fiqh-official-source";

export type FiqhDocumentationLevel =
  | "official_verified"
  | "general_reasoning"
  | "imported_needs_review"
  | "admin_summary"
  | "rejected"
  | "archived";

export const FIQH_DOCUMENTATION_LABELS: Record<FiqhDocumentationLevel, string> = {
  official_verified: "موثق من المصدر الرسمي",
  general_reasoning: "استدلال عام — بلا مصدر مسمّى",
  imported_needs_review: "مستورد — يحتاج مراجعة",
  admin_summary: "ملخص إداري",
  rejected: "مرفوض",
  archived: "مؤرشف",
};

export function getDocumentationLevel(
  item: Pick<
    FiqhCouncilItem,
    "status" | "confidence_level" | "source_name" | "source_url" | "summary_source" | "documentation_level"
  >,
): FiqhDocumentationLevel {
  if (item.documentation_level) return item.documentation_level;
  if (item.status === "rejected") return "rejected";
  if (item.status === "archived") return "archived";
  if (
    item.confidence_level === "source_verified" &&
    item.source_name &&
    item.source_url
  ) {
    return "official_verified";
  }
  if (item.summary_source === "admin") return "admin_summary";
  return "imported_needs_review";
}

/** عنصر منشور وموثق ومكتمل — يُعرض للعامة */
export function isVerifiedPublicItem(item: FiqhCouncilItem): boolean {
  if (item.status !== "published") return false;
  if (getItemCompletionScore(item) < MIN_FIQH_COMPLETION_SCORE) return false;
  if (!isOfficialSourceVerified(item)) return false;
  if (item.link_status === "broken" || item.link_status === "timeout") return false;
  return getDocumentationLevel(item) === "official_verified";
}

export function isPublicDisplayableItem(item: FiqhCouncilItem): boolean {
  return isVerifiedPublicItem(item);
}

/**
 * مسألة عامة فقط إن كانت منشورة وموثّقة رسميًا ولها مادّة كافية
 * (ملخص حكم + مستند) — لا تُعرض مسائل العنوان/سطر واحد فقط.
 */
export function isPublicIssue(issue: FiqhCouncilIssue): boolean {
  if (issue.status !== "published") return false;
  if (issue.documentation_level !== "official_verified") return false;
  const ruling = String(issue.ruling_summary ?? "").trim();
  const evidence = String(issue.evidence_summary ?? "").trim();
  if (ruling.length < 60) return false;
  if (evidence.length < 30) return false;
  return true;
}

/** تحقق قبل النشر — يُستخدم في الإدارة */
export function canPublishFiqhItem(item: FiqhCouncilItem, existingItems?: FiqhCouncilItem[]) {
  return verifyFiqhItem(item, { existingItems }).canPublish;
}
