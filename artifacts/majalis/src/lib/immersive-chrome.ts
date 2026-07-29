/**
 * مسارات «غمرية» تُخفى عنها عناصر التصفح العامة للموقع
 * (شريط الأقسام، شريط الأحاديث، التذييل، شريط تحرير المشرف).
 * لا تُستخدم CSS فقط — تُمنع المكوّنات من التركيب داخل هذه المسارات.
 */
export function isImmersiveChromePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (
    p === "/prayer-times" ||
    p.startsWith("/prayer-times/") ||
    p === "/mushaf" ||
    p.startsWith("/mushaf/") ||
    p === "/quran-hub" ||
    p.startsWith("/quran-hub/")
  );
}

/** صفحة مواقيت الصلاة فقط */
export function isPrayerTimesPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/prayer-times" || p.startsWith("/prayer-times/");
}

/** المصحف أو مركز القرآن (يُعاد توجيهه للمصحف) */
export function isQuranImmersivePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (
    p === "/mushaf" ||
    p.startsWith("/mushaf/") ||
    p === "/quran-hub" ||
    p.startsWith("/quran-hub/")
  );
}
