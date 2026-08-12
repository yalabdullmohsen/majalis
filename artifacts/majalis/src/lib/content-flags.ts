/**
 * رايات محتوى مشتركة (الواجهة).
 * يجب أن تطابق artifacts/majalis/lib/content-flags.mjs
 */
export const CONTENT_CURRICULUM_ENABLED = false;

/** سجل منهج فقه (curriculum) — يُعزل عند CONTENT_CURRICULUM_ENABLED=false */
export function isCurriculumRuling(item: {
  source_origin?: string | null;
  external_key?: string | null;
  id?: string | null;
}): boolean {
  if (item.source_origin === "fiqh-curriculum-registry") return true;
  const key = item.external_key || item.id || "";
  return key.startsWith("curriculum-");
}

/** عرض وسم «بلا تخريج» للسجلات غير الموثّقة */
export const SHOW_UNSOURCED_BADGE = true;
