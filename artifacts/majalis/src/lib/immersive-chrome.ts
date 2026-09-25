/**
 * مسارات «غمرية» تُخفى عنها عناصر التصفح العامة للموقع
 * (شريط الأقسام، شريط الأحاديث، التذييل، شريط تحرير المشرف).
 *
 * /mushaf قارئ غمري — الأدوات داخل الصفحة عند اللمس فقط.
 * /prophets/:slug قراءة قصة مركّزة — بلا Header/BottomNav عامّين.
 * مركز القرآن الكريم (/quran-hub) ليس غمريًا.
 */
export function isProphetsReadingPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  const m = p.match(/^\/(?:prophets|prophet-stories|prophets-stories|anbiya)\/([^/]+)$/);
  if (!m) return false;
  const slug = m[1] ?? "";
  /* الشجرة قائمة استكشاف وليست وضع قراءة */
  return slug.length > 0 && slug !== "tree";
}

export function isImmersiveChromePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/mushaf" || p.startsWith("/mushaf/") || isProphetsReadingPath(p);
}

/** مسارات قراءة طويلة — يُثبَّت الكروم بلا إخفاء transform حتى لا ينزلق الشريط داخل المحتوى. */
export function isPinnedChromePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  /* وضع القراءة مركّز (immersive) — لا pinned */
  if (isProphetsReadingPath(p)) return false;
  return (
    p === "/prophets" ||
    p === "/prophets/tree" ||
    p.startsWith("/prophets/tree/") ||
    p === "/prophet-stories" ||
    p === "/prophets-stories" ||
    p === "/anbiya"
  );
}

/** مسارات قوائم/قارئ الحديث — بحث داخلي + هيدر داخلي؛ بلا صف بحث عام مكرر. */
export function isHadithReaderPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (
    p === "/arbaeen-nawawi" ||
    p.startsWith("/arbaeen-nawawi/") ||
    p === "/hadith" ||
    p.startsWith("/hadith/") ||
    p === "/hadith-science" ||
    p.startsWith("/hadith-science/") ||
    p === "/hadith-books" ||
    p.startsWith("/hadith-books/")
  );
}

/** صفحات وظيفية — بلا صف بحث/تيكّر مكدّس (Identity Reset: التيكر على الرئيسية فقط عبر shouldShowHeaderTicker).
 * صفحة الدخول/التسجيل ليست ضمنها. */
export function isCompactHeaderPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (isImmersiveChromePath(p)) return true;
  if (isPinnedChromePath(p)) return true;
  if (isHadithReaderPath(p)) return true;
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
    p === "/adhan-settings" ||
    p.startsWith("/adhan-settings/") ||
    p === "/notification-settings" ||
    p.startsWith("/notification-settings/") ||
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

/** صفحة دخول/تسجيل — بلا شريط سفلي/تذييل/مساعد؛ الهيدر ظاهر (التيكّر على الرئيسية فقط) */
export function isAuthStandalonePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (
    p === "/login" ||
    p === "/register" ||
    p.startsWith("/auth/")
  );
}


/** صفحات بمكوّن رجوع داخلي (هيدر القسم) — يُخفى عنها السهم العائم حتى لا يغطي البطاقات */
export function hasInPageBackChrome(pathname: string): boolean {
  // اللوبيات تعتمد FloatingBackButton (بوابات section-lobby) — لا نخفيه هناك.
  // الصفحات الغمرية/الصلاة تُستثنى عبر isImmersiveChromePath / isPrayerTimesPath.
  const p = pathname.replace(/\/+$/, "") || "/";
  if (isHadithReaderPath(p)) return true;
  return (
    p === "/settings" ||
    p.startsWith("/settings/") ||
    p === "/adhan-settings" ||
    p.startsWith("/adhan-settings/") ||
    p === "/notification-settings" ||
    p.startsWith("/notification-settings/") ||
    p === "/adhan-help" ||
    p.startsWith("/adhan-help/") ||
    p === "/profile" ||
    p.startsWith("/profile/") ||
    p === "/search" ||
    p.startsWith("/search/") ||
    /^\/lessons\/[^/]+$/.test(p)
  );
}
