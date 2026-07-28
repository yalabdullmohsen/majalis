/**
 * توحيد حالات أبواب العلم/التصنيفات — مصدر واحد للقيم والتسميات والتطبيع.
 * القيم القديمة (pending, under_review, …) تُحوَّل إلى القيمة الموحدة.
 */

export const CATEGORY_STATUSES = [
  "draft",
  "pending_review",
  "published",
  "hidden",
  "rejected",
  "archived",
] as const;

export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];

/** القيم التي يعرفها قيد CHECK القديم قبل الترحيل (للتوافق الرجعي) */
export const LEGACY_DB_STATUSES = ["draft", "published", "archived"] as const;

const LEGACY_ALIASES: Record<string, CategoryStatus> = {
  draft: "draft",
  pending: "pending_review",
  pending_review: "pending_review",
  review_pending: "pending_review",
  under_review: "pending_review",
  in_review: "pending_review",
  needs_review: "pending_review",
  published: "published",
  approved: "published",
  live: "published",
  hidden: "hidden",
  unpublished: "hidden",
  private: "hidden",
  rejected: "rejected",
  declined: "rejected",
  archived: "archived",
  archive: "archived",
  deleted: "archived",
};

export const CATEGORY_STATUS_META: Record<
  CategoryStatus,
  { label: string; shortLabel: string; icon: string; tabKey: string }
> = {
  draft: { label: "مسودة", shortLabel: "مسودة", icon: "○", tabKey: "draft" },
  pending_review: { label: "قيد المراجعة", shortLabel: "مراجعة", icon: "◐", tabKey: "pending_review" },
  published: { label: "منشور", shortLabel: "منشور", icon: "●", tabKey: "published" },
  hidden: { label: "مخفي", shortLabel: "مخفي", icon: "◌", tabKey: "hidden" },
  rejected: { label: "مرفوض", shortLabel: "مرفوض", icon: "✕", tabKey: "rejected" },
  archived: { label: "مؤرشف", shortLabel: "مؤرشف", icon: "□", tabKey: "archived" },
};

export function normalizeCategoryStatus(raw: string | null | undefined): CategoryStatus {
  if (!raw || !String(raw).trim()) return "draft";
  const key = String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
  return LEGACY_ALIASES[key] ?? "draft";
}

export function categoryStatusLabel(status: string | null | undefined): string {
  return CATEGORY_STATUS_META[normalizeCategoryStatus(status)].label;
}

/** الظهور العام للمستخدم — المنشور فقط */
export function isPublicVisibleStatus(status: string | null | undefined): boolean {
  return normalizeCategoryStatus(status) === "published";
}

/** هل الحالة ضمن قيد CHECK القديم (قبل تطبيق migration التوسيع) */
export function isLegacyDbStatus(status: CategoryStatus): boolean {
  return (LEGACY_DB_STATUSES as readonly string[]).includes(status);
}

/**
 * عند فشل الكتابة بسبب قيد CHECK القديم: أسقط إلى أقرب حالة قديمة.
 * pending_review/hidden/rejected → draft (مع حفظ السبب في status_reason إن وُجد).
 */
export function toWritableDbStatus(status: CategoryStatus, expandedSchema: boolean): CategoryStatus | "draft" | "published" | "archived" {
  if (expandedSchema || isLegacyDbStatus(status)) return status as CategoryStatus;
  if (status === "published") return "published";
  if (status === "archived") return "archived";
  return "draft";
}

export type CategoryStatusCounts = Record<CategoryStatus, number> & {
  total: number;
  publicVisible: number;
  unpublished: number;
  missingStatus: number;
};

export function countCategoryStatuses(
  rows: Array<{ status: string | null | undefined }>,
): CategoryStatusCounts {
  const counts: CategoryStatusCounts = {
    draft: 0,
    pending_review: 0,
    published: 0,
    hidden: 0,
    rejected: 0,
    archived: 0,
    total: rows.length,
    publicVisible: 0,
    unpublished: 0,
    missingStatus: 0,
  };
  for (const row of rows) {
    if (row.status == null || String(row.status).trim() === "") {
      counts.missingStatus += 1;
      counts.draft += 1;
      counts.unpublished += 1;
      continue;
    }
    const s = normalizeCategoryStatus(row.status);
    counts[s] += 1;
    if (s === "published") counts.publicVisible += 1;
    else counts.unpublished += 1;
  }
  return counts;
}
