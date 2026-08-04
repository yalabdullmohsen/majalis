import { isComingSoonPath } from "@/lib/nav-visibility";

/**
 * مسارات «غمرية» تُخفى عنها عناصر التصفح العامة للموقع
 * (شريط الأقسام، شريط الأحاديث، التذييل، شريط تحرير المشرف).
 * لا تُستخدم CSS فقط — تُمنع المكوّنات من التركيب داخل هذه المسارات.
 */
export function isImmersiveChromePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  // أثناء «قريبًا» للمصحف: أبقِ الشريط السفلي ظاهرًا للخروج بسهولة
  if (isComingSoonPath("/mushaf") && (p === "/mushaf" || p.startsWith("/mushaf/") || p === "/quran-hub" || p.startsWith("/quran-hub/"))) {
    return false;
  }
  return (
    p === "/prayer-times" ||
    p.startsWith("/prayer-times/") ||
    p === "/mushaf" ||
    p.startsWith("/mushaf/") ||
    p === "/quran-hub" ||
    p.startsWith("/quran-hub/") ||
    p === "/quran/recitation-test-ai" ||
    p.startsWith("/quran/recitation-test-ai/")
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
