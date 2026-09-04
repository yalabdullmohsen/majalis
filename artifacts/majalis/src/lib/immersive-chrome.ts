/**
 * مسارات «غمرية» تُخفى عنها عناصر التصفح العامة للموقع
 * (شريط الأقسام، شريط الأحاديث، التذييل، شريط تحرير المشرف).
 *
 * /mushaf قارئ غمري — الأدوات داخل الصفحة عند اللمس فقط.
 * مركز القرآن الكريم (/quran-hub) ليس غمريًا.
 */
export function isImmersiveChromePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/mushaf" || p.startsWith("/mushaf/");
}

/** صفحات وظيفية — تُخفى فيها الشريط المتحرك الطويل؛ الوظيفة أولًا.
 * صفحة الدخول/التسجيل ليست ضمنها — الشريط المتحرك يظهر هناك. */
export function isCompactHeaderPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (isImmersiveChromePath(p)) return true;
  return (
    p === "/search" ||
    p.startsWith("/search/") ||
    p === "/library" ||
    p.startsWith("/library/") ||
    p === "/quiz" ||
    p.startsWith("/quiz/") ||
    p === "/profile" ||
    p.startsWith("/profile/") ||
    p === "/settings" ||
    p.startsWith("/settings/") ||
    p === "/prayer-times" ||
    p.startsWith("/prayer-times/") ||
    p === "/mushaf" ||
    p.startsWith("/mushaf/")
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

/** صفحة دخول/تسجيل — بلا شريط سفلي/تذييل/مساعد؛ الهيدر والتيكر ظاهران */
export function isAuthStandalonePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (
    p === "/login" ||
    p === "/register" ||
    p.startsWith("/auth/")
  );
}
