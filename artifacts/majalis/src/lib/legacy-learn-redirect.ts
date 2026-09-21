/**
 * تحويل روابط /learn القديمة إلى /lessons مع الحفاظ على المعرّف.
 * لا يخترع سلسلة جديدة — يمرّر المعرّف إلى صفحة الدرس (404/غير متاح إن بطل).
 */

/** معاملات الاستعلام المسموح تمريرها مع التحويل (مشاركة الوقت + إحالات خفيفة). */
export const LEGACY_LEARN_ALLOWED_QUERY = new Set(["t", "from", "ref"]);

/**
 * يرفض المسارات الفارغة أو التي تحتوي مسارًا/استعلامًا داخل المعرّف.
 */
export function sanitizeLearnSlug(raw: string | undefined | null): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (s.length > 200) return null;
  if (/[/?#\\]/.test(s) || s.includes("..")) return null;
  return s;
}

/**
 * يصفّي سلسلة الاستعلام (بدون `?`) إلى المعاملات المسموحة فقط.
 */
export function filterAllowedLearnQuery(search: string): string {
  const raw = String(search ?? "").replace(/^\?/, "").trim();
  if (!raw) return "";
  const params = new URLSearchParams(raw);
  const out = new URLSearchParams();
  for (const key of LEGACY_LEARN_ALLOWED_QUERY) {
    const value = params.get(key);
    if (value != null && value !== "") out.set(key, value);
  }
  return out.toString();
}

/**
 * هدف التحويل: `/lessons/:id` مع استعلام مسموح، أو `/lessons` إن بطل المعرّف.
 * لا حلقة تحويل — الهدف ليس تحت `/learn`.
 */
export function buildLegacyLearnTarget(
  idOrSlug: string | undefined | null,
  search: string = "",
): string {
  const id = sanitizeLearnSlug(idOrSlug);
  if (!id) return "/lessons";
  const qs = filterAllowedLearnQuery(search);
  const path = `/lessons/${encodeURIComponent(id)}`;
  return qs ? `${path}?${qs}` : path;
}
