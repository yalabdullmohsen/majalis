/**
 * مسارات «غمرية» تُخفى عنها عناصر التصفح العامة للموقع
 * (شريط الأقسام، شريط الأحاديث، التذييل، شريط تحرير المشرف).
 *
 * /mushaf قارئ غمري — الأدوات داخل الصفحة عند اللمس فقط.
 * مركز القرآن (/quran-hub) ليس غمريًا.
 */
export function isImmersiveChromePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/mushaf" || p.startsWith("/mushaf/")) {
    return true;
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

/** المصحف غمري أثناء القراءة */
export function isQuranImmersivePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/mushaf" || p.startsWith("/mushaf/");
}
