import { findPotentialDuplicates } from "./fiqh-council-dedup";
import { isOfficialSourceVerified } from "./fiqh-council-trust";
import type { FiqhCouncilItem, FiqhCouncilSession } from "./fiqh-council-types";

export const MIN_FIQH_COMPLETION_SCORE = 80;

export type FiqhVerificationIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type FiqhVerificationResult = {
  passed: boolean;
  completionScore: number;
  issues: FiqhVerificationIssue[];
  canPublish: boolean;
  needsReview: boolean;
};

export type FiqhReviewQueueKind =
  | "needs_review"
  | "missing_source"
  | "missing_category"
  | "potential_duplicate"
  | "broken_link"
  | "needs_summary"
  | "needs_session";

const URL_PATTERN = /^https?:\/\/.+/i;

function hasText(item: Pick<FiqhCouncilItem, "content" | "ruling_text" | "summary">) {
  return Boolean(
    (item.content && item.content.trim()) ||
      (item.ruling_text && item.ruling_text.trim()) ||
      (item.summary && item.summary.trim()),
  );
}

/** حساب درجة اكتمال المادة (0–100) */
export function calculateCompletionScore(
  item: Pick<
    FiqhCouncilItem,
    | "title"
    | "content"
    | "ruling_text"
    | "summary"
    | "source_name"
    | "source_url"
    | "type"
    | "category"
    | "session_date"
    | "session_number"
    | "session_id"
    | "tags"
    | "evidence"
    | "key_points"
  >,
): number {
  let score = 0;
  if (item.title?.trim()) score += 10;
  if (item.content?.trim() || item.ruling_text?.trim()) score += 20;
  if (item.summary?.trim()) score += 10;
  if (item.source_name?.trim()) score += 10;
  if (item.source_url?.trim() && URL_PATTERN.test(item.source_url)) score += 15;
  if (item.type) score += 5;
  if (item.category?.trim()) score += 10;
  if (item.session_date) score += 5;
  if (item.session_number || item.session_id) score += 5;
  if (item.tags?.length) score += 5;
  if (item.evidence?.length) score += 5;
  if (item.key_points?.length) score += 5;
  return Math.min(100, score);
}

export function getItemCompletionScore(item: FiqhCouncilItem): number {
  if (typeof item.completion_score === "number") return item.completion_score;
  return calculateCompletionScore(item);
}

export function verifySessionForItem(
  item: Pick<FiqhCouncilItem, "session_number" | "session_date" | "session_id">,
  session?: FiqhCouncilSession | null,
): FiqhVerificationIssue[] {
  if (!item.session_number && !item.session_id) return [];

  const issues: FiqhVerificationIssue[] = [];
  if (!item.session_number) {
    issues.push({ code: "session_number", message: "رقم الجلسة غير متوفر", severity: "warning" });
  }
  if (!item.session_date) {
    issues.push({ code: "session_date", message: "تاريخ الجلسة غير متوفر", severity: "warning" });
  }
  if (session) {
    if (session.verification_status !== "verified") {
      issues.push({ code: "session_unverified", message: "الجلسة المرتبطة غير موثقة", severity: "warning" });
    }
    if (!session.official_source_url) {
      issues.push({ code: "session_no_source", message: "الجلسة بلا مصدر رسمي", severity: "warning" });
    }
  } else if (item.session_number || item.session_id) {
    issues.push({ code: "session_missing", message: "الجلسة المرتبطة غير موجودة أو غير منشورة", severity: "warning" });
  }
  return issues;
}

/** فحص شامل للمادة قبل النشر */
export function verifyFiqhItem(
  item: FiqhCouncilItem,
  context?: {
    existingItems?: FiqhCouncilItem[];
    session?: FiqhCouncilSession | null;
  },
): FiqhVerificationResult {
  const issues: FiqhVerificationIssue[] = [];
  const completionScore = getItemCompletionScore(item);

  if (!item.title?.trim()) {
    issues.push({ code: "title", message: "العنوان مطلوب", severity: "error" });
  }
  if (!item.source_name?.trim()) {
    issues.push({ code: "source_name", message: "المصدر مطلوب", severity: "error" });
  }
  if (!item.source_url?.trim()) {
    issues.push({ code: "source_url", message: "رابط المصدر الرسمي مطلوب", severity: "error" });
  } else if (!URL_PATTERN.test(item.source_url)) {
    issues.push({ code: "source_url_invalid", message: "رابط المصدر غير صالح", severity: "error" });
  }
  if (!item.type) {
    issues.push({ code: "type", message: "نوع المادة مطلوب", severity: "error" });
  }
  if (!item.category?.trim()) {
    issues.push({ code: "category", message: "التصنيف مطلوب", severity: "error" });
  }
  if (!hasText(item)) {
    issues.push({ code: "text", message: "نص المادة أو ملخصها مطلوب", severity: "error" });
  }
  if (completionScore < MIN_FIQH_COMPLETION_SCORE) {
    issues.push({
      code: "completion_score",
      message: `درجة الاكتمال (${completionScore}) أقل من ${MIN_FIQH_COMPLETION_SCORE}`,
      severity: "error",
    });
  }
  if (!isOfficialSourceVerified(item)) {
    issues.push({ code: "source_verified", message: "المصدر غير موثق (confidence_level)", severity: "error" });
  }
  if (item.link_status === "broken" || item.link_status === "timeout") {
    issues.push({ code: "broken_link", message: "رابط المصدر معطل", severity: "error" });
  }

  if (context?.existingItems?.length) {
    const dupes = findPotentialDuplicates(item, context.existingItems);
    if (dupes.length > 0) {
      issues.push({
        code: "duplicate",
        message: `احتمال تكرار مع: ${dupes[0].candidateSlug}`,
        severity: "error",
      });
    }
  }

  issues.push(...verifySessionForItem(item, context?.session));

  const hasErrors = issues.some((i) => i.severity === "error");
  const passed = !hasErrors;
  const canPublish = passed && completionScore >= MIN_FIQH_COMPLETION_SCORE && isOfficialSourceVerified(item);

  return {
    passed,
    completionScore,
    issues,
    canPublish,
    needsReview: !passed,
  };
}

export function classifyReviewQueues(item: FiqhCouncilItem, duplicateSlugs: Set<string>): FiqhReviewQueueKind[] {
  const queues: FiqhReviewQueueKind[] = [];
  const reviewStatuses = ["imported", "needs_review", "review", "approved"];
  if (reviewStatuses.includes(item.status || "")) queues.push("needs_review");
  if (!item.source_name?.trim() || !item.source_url?.trim()) queues.push("missing_source");
  if (!item.category?.trim()) queues.push("missing_category");
  if (duplicateSlugs.has(item.slug)) queues.push("potential_duplicate");
  if (item.link_status === "broken" || item.link_status === "timeout") queues.push("broken_link");
  if (!item.summary?.trim()) queues.push("needs_summary");
  if (item.session_number && !item.session_id) queues.push("needs_session");
  return queues;
}

export function isUrlFormatValid(url?: string): boolean {
  return Boolean(url?.trim() && URL_PATTERN.test(url.trim()));
}
