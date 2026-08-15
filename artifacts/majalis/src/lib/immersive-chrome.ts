/**
 * مسارات «غمرية» تُخفى عنها عناصر التصفح العامة للموقع
 * (شريط الأقسام، شريط الأحاديث، التذييل، شريط تحرير المشرف).
 *
 * /mushaf حاليًا صفحة «قيد التطوير» — الشريط السفلي ظاهر.
 * مركز القرآن (/quran-hub) ليس غمريًا.
 */
export function isImmersiveChromePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/mushaf" || p.startsWith("/mushaf/")) {
    return false;
  }
  return (
    p === "/quran/recitation-test-ai" ||
    p.startsWith("/quran/recitation-test-ai/")
  );
}

/** صفحة مواقيت الصلاة فقط */
export function isPrayerTimesPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/prayer-times" || p.startsWith("/prayer-times/");
}

/** المصحف قيد التطوير — ليس غمريًا حتى يعود القارئ الجديد */
export function isQuranImmersivePath(_pathname: string): boolean {
  return false;
}
