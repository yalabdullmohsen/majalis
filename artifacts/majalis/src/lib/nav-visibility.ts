/**
 * سياسة ظهور عناصر التنقل — مصدر واحد للقوائم (Top / More / Side / كتالوج الرئيسية).
 * - comingSoon: يظهر بشارة «قريبًا» ويمكن فتح الصفحة لرسالة الترقّب.
 * - hiddenFromNav: لا يُعرض في قوائم المستخدم (المسار قد يبقى للروابط العميقة/الأدمن).
 */

export const COMING_SOON_PATHS = new Set<string>([
  "/kids",
]);

/** عناصر أُزيلت من الاكتشاف العام حسب مراجعة الدمج/الإلغاء. */
export const HIDDEN_FROM_NAV_PATHS = new Set<string>([
  "/features-in-progress",
  "/mushaf-v2-preview",
  "/car-mode",
  "/mosque-mode",
  "/family",
  "/family-mode",
  "/learning-plan", // مدمج تحت المسارات
  "/knowledge-map",
  "/masarat",
  "/islam-stats",
  "/study-room",
  "/vault",
  "/cards",
  "/universities",
  "/mind-map",
  "/mushaf/page",
  // التسميع ظاهر في مركز القرآن والمصحف وقوائم الاكتشاف

  "/quran-studies",
  "/anbiya",
  "/learning/calendar",
  "/prayer-countdown",
  "/annual-courses",
  "/duas",
  "/prayer-ranks",
  "/sujood-sahw",
  "/sunnah-studies",
  "/tazkiya-topics",
  "/tarikh-islami",
  "/usra-mujtama",
  "/fikr-waqia",
  "/mawsuaat",
  "/durus-imaniyya",
  "/durus-mutanawwia",
  "/iman-topics",
  "/arabic-language",
  "/maqasid-sharia",
  "/dalail-nubuwwah",

  // ── تنظيف الأقسام (2026-08) — محذوفة أو مدمجة تحت بوابات (الصفحات تبقى للروابط العميقة)
  "/library",
  "/updates",
  "/knowledge-graph",
  "/academic-research",
  "/fiqh-council/fatwas",
  "/flashcards", // يظهر داخل حسابي فقط (رابط مباشر في الصفحة)
  "/occasions",
  "/calendar",
  "/institutions",
  "/islamic-landmarks",
  "/ulum-quran",
  "/quran/surahs",
  "/quran/surah-stories",
  "/quran-memorization",
  "/quran/memorization-plans",
]);

/**
 * إعادة توجيه المسارات القديمة.
 * لا تُوجَّه صفحات المحتوى التي تفتحها بوابات الدمج (مثل /ulum-quran) حتى لا تُغلق الحلقة.
 */
export const MERGED_PATH_REDIRECTS: Record<string, string> = {
  "/knowledge-map": "/",
  "/learning-plan": "/learning/paths",
  "/masarat": "/learning/paths",
  "/family-mode": "/family",
  "/learning/quiz": "/quiz",
  "/mushaf-v2-preview": "/mushaf",
  "/features-in-progress": "/",
  "/quran-studies": "/quran-knowledge",
  "/anbiya": "/prophets",
  "/learning/calendar": "/occasions-lessons",
  "/prayer-countdown": "/prayer-times",
  "/annual-courses": "/lessons?tab=courses",

  // أقسام محذوفة من الواجهة
  "/library": "/",
  "/updates": "/",
  "/knowledge-graph": "/",
  "/academic-research": "/",
  "/researches": "/",
  "/sharia-research": "/",
  "/fiqh-council/fatwas": "/fiqh",

  // اختصارات قديمة → البوابات المدمجة (ليست صفحات المحتوى النهائية)
  "/quran-index": "/quran-knowledge",
  "/asbab-al-nuzul": "/quran-knowledge",
  "/quran-stories": "/quran-knowledge",
  "/memorization-tests": "/memorization",
  "/memorization-plans": "/memorization",
  "/islamic-institutions": "/islamic-directory",
  "/mosques": "/islamic-directory",
  "/reviewed-cards": "/my-learning",
  "/scientific-library": "/",
  "/latest": "/",
  "/fatwas": "/fiqh",
  "/explore": "/",
  "/research": "/",
  "/news": "/",
  "/events": "/occasions-lessons",
  "/islamic-events": "/occasions-lessons",
  "/lesson-calendar": "/occasions-lessons",
  "/review-plans": "/memorization",
  "/masajid": "/islamic-directory",
  "/quran-sciences": "/quran-knowledge",
};

export function resolveMergedPath(href: string): string {
  const clean = href.split("#")[0].split("?")[0] || href;
  return MERGED_PATH_REDIRECTS[clean] ?? href;
}

export function isComingSoonPath(href: string): boolean {
  const clean = (href.split("#")[0].split("?")[0] || href).replace(/\/+$/, "") || "/";
  if (COMING_SOON_PATHS.has(clean)) return true;
  // بادئات: /mushaf و /mushaf/page/… إلخ
  for (const path of COMING_SOON_PATHS) {
    if (path !== "/" && (clean === path || clean.startsWith(`${path}/`))) return true;
  }
  return false;
}

export function isHiddenFromNav(href: string): boolean {
  const clean = href.split("#")[0].split("?")[0] || href;
  if (HIDDEN_FROM_NAV_PATHS.has(clean)) return true;
  return false;
}

export function filterNavItems<T extends { href: string }>(items: T[]): T[] {
  return items.filter((item) => !isHiddenFromNav(item.href));
}
