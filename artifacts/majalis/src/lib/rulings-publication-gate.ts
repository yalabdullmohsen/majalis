/**
 * بوابة نشر الأحكام للعامة — مصدر حقيقة واحد.
 *
 * سياسة 2026-08: يُسمح بعرض pending_review للعامة مع تنبيه واضح
 * (انظر publish-policy.ts). الاعتماد النهائي يبقى عبر isVerifiedApprovedRuling فقط.
 */

import { classifyRuling, type PublishStatus } from "./publish-policy";

export const RULING_PUBLIC_VERIFICATION = "approved" as const;

/** حالات غير صالحة لأي عرض عام (blocked) */
const BLOCKED_VERIFICATION = new Set(["draft", "rejected", "archived", ""]);

const BLOCKED_STATUS = new Set(["draft", "rejected", "archived", "removed", "deleted"]);

export type RulingPublicationLifecycle =
  | "draft"
  | "needs_review"
  | "approved"
  | "published"
  | "archived"
  | "incomplete"
  | "orphaned";

function norm(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

export type RulingGateRow = {
  status?: string | null;
  verification_status?: string | null;
  title?: string | null;
  body?: string | null;
  summary?: string | null;
};

/**
 * اعتماد نهائي فقط — للمطالبات «موثّق / معتمد».
 * لا يشمل pending_review.
 */
export function isVerifiedApprovedRuling(row: RulingGateRow | null | undefined): boolean {
  if (!row) return false;
  const title = String(row.title ?? "").trim();
  const body = String(row.body ?? "").trim();
  if (!title || !body) return false;

  const verification = norm(row.verification_status);
  const status = norm(row.status);

  if (
    BLOCKED_VERIFICATION.has(verification) ||
    verification === "pending" ||
    verification === "pending_review" ||
    verification === "needs_review"
  ) {
    return false;
  }
  if (verification !== "approved" && verification !== "published") return false;

  if (
    status &&
    (BLOCKED_STATUS.has(status) ||
      status === "pending" ||
      status === "pending_review" ||
      status === "needs_review")
  ) {
    return false;
  }
  if (status && status !== "approved" && status !== "published") return false;

  return true;
}

/**
 * مرادف تاريخي للاعتماد النهائي — لا يعني «مرئي للعامة» بعد سياسة النشر الجديدة.
 */
export function isPubliclyPublishedRuling(row: RulingGateRow | null | undefined): boolean {
  return isVerifiedApprovedRuling(row);
}

/**
 * هل يجوز إظهار الحكم في listing / detail / sitemap؟
 * يشمل pending_review بشرط عنوان+نص، ويستبعد blocked.
 */
export function isPubliclyVisibleRuling(row: RulingGateRow | null | undefined): boolean {
  if (!row) return false;
  return classifyRuling(row) !== "blocked";
}

export function publishStatusForRuling(row: RulingGateRow): PublishStatus {
  return classifyRuling(row);
}

export function classifyRulingLifecycle(row: {
  status?: string | null;
  verification_status?: string | null;
  title?: string | null;
  body?: string | null;
  id?: string | null;
}): RulingPublicationLifecycle {
  const verification = norm(row.verification_status);
  const status = norm(row.status);
  const title = String(row.title ?? "").trim();
  const body = String(row.body ?? "").trim();

  if (!title && !body) return "orphaned";
  if (!title || !body) return "incomplete";

  if (verification === "archived" || status === "archived") return "archived";
  if (verification === "draft" || status === "draft") return "draft";
  if (
    verification === "pending" ||
    verification === "pending_review" ||
    verification === "needs_review" ||
    status === "pending" ||
    status === "pending_review"
  ) {
    return "needs_review";
  }
  if (verification === "approved" || verification === "published") {
    if (status === "published" || status === "approved" || !status) return "published";
    return "approved";
  }
  return "needs_review";
}

export function auditRulingPublicationRows(
  rows: Array<{
    status?: string | null;
    verification_status?: string | null;
    title?: string | null;
    body?: string | null;
    id?: string | null;
  }>,
): {
  total: number;
  draft: number;
  needs_review: number;
  approved: number;
  published: number;
  archived: number;
  incomplete: number;
  orphaned: number;
  publicEligible: number;
  visibleEligible: number;
} {
  const counts = {
    total: rows.length,
    draft: 0,
    needs_review: 0,
    approved: 0,
    published: 0,
    archived: 0,
    incomplete: 0,
    orphaned: 0,
    publicEligible: 0,
    visibleEligible: 0,
  };
  for (const row of rows) {
    const life = classifyRulingLifecycle(row);
    counts[life] += 1;
    if (isVerifiedApprovedRuling(row)) counts.publicEligible += 1;
    if (isPubliclyVisibleRuling(row)) counts.visibleEligible += 1;
  }
  return counts;
}
