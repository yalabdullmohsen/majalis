/**
 * ملخص متابعة الحفظ ومراجعات اليوم — من تخزين التقدم المحلي.
 * لا تقدّم بيانات وهمية عند فراغ المخزن.
 */

import {
  listDueHifzReviews,
  resolveContinueTarget,
} from "./progress-store";

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

export function getHifzContinueTarget(): HifzContinueTarget | null {
  const rec = resolveContinueTarget();
  if (!rec) return null;
  return {
    pathSlug: rec.pathSlug,
    pathTitle: rec.pathTitle,
    unitId: rec.unitId,
    unitTitle: rec.unitTitle,
  };
}

export function listHifzDueReviewsToday(): readonly HifzDueReviewItem[] {
  return listDueHifzReviews().map((u) => ({
    pathSlug: u.pathSlug,
    pathTitle: u.pathTitle,
    unitId: u.unitId,
    unitTitle: u.unitTitle,
  }));
}
