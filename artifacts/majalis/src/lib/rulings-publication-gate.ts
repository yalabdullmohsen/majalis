/**
 * بوابة نشر الأحكام للعامة — مصدر حقيقة واحد.
 * لا يُعرض للعامة إلا ما اجتاز الاعتماد التحريري صراحةً.
 * ممنوع اعتماد تلقائي؛ pending_review / pending / draft تبقى غير عامة.
 */

export const RULING_PUBLIC_VERIFICATION = "approved" as const;

/** حالات غير صالحة للنشر العام (تشمل مرادفات البذرة) */
const NON_PUBLIC_VERIFICATION = new Set([
  "draft",
  "pending",
  "pending_review",
  "needs_review",
  "rejected",
  "archived",
  "",
]);

const NON_PUBLIC_STATUS = new Set([
  "draft",
  "pending",
  "pending_review",
  "needs_review",
  "rejected",
  "archived",
  "removed",
  "deleted",
]);

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

/**
 * Predicate عام: هل يجوز إظهار الحكم في listing / detail / sitemap / search؟
 * يتطلب verification_status=approved (أو مرادف صريح) وstatus ليس مسودة/معلقاً.
 * لا يحوّل pending_review إلى approved.
 */
export function isPubliclyPublishedRuling(row: {
  status?: string | null;
  verification_status?: string | null;
  title?: string | null;
  body?: string | null;
} | null | undefined): boolean {
  if (!row) return false;
  const title = String(row.title ?? "").trim();
  const body = String(row.body ?? "").trim();
  if (!title || !body) return false;

  const verification = norm(row.verification_status);
  const status = norm(row.status);

  if (NON_PUBLIC_VERIFICATION.has(verification)) return false;
  if (verification !== "approved" && verification !== "published") return false;

  if (status && NON_PUBLIC_STATUS.has(status)) return false;
  /* status فارغ مع verification=approved مقبول (بذرة قديمة نظيفة) */
  if (status && status !== "approved" && status !== "published") return false;

  return true;
}

/** تصنيف دورة الحياة للتدقيق — بلا طفرة على السجل */
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
  };
  for (const row of rows) {
    const life = classifyRulingLifecycle(row);
    counts[life] += 1;
    if (isPubliclyPublishedRuling(row)) counts.publicEligible += 1;
  }
  return counts;
}
