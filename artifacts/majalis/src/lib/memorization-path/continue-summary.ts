/**
 * ملخص متابعة الحفظ ومراجعات اليوم — فارغ حتى PR-3 (تخزين التقدم).
 * لا تقدّم بيانات وهمية.
 */

export type HifzContinueTarget = {
  pathSlug: string;
  pathTitle: string;
  unitId?: string;
  unitTitle?: string;
};

export type HifzDueReviewItem = {
  pathSlug: string;
  pathTitle: string;
  unitId: string;
  unitTitle: string;
};

/** لا هدف متابعة قبل تخزين التقدم (PR-3). */
export function getHifzContinueTarget(): HifzContinueTarget | null {
  return null;
}

/** لا مراجعات مستحقة قبل تخزين التقدم (PR-3). */
export function listHifzDueReviewsToday(): readonly HifzDueReviewItem[] {
  return [];
}
