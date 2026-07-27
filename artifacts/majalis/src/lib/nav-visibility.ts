/**
 * سياسة ظهور عناصر التنقل — مصدر واحد للقوائم (Top / More / Side / كتالوج الرئيسية).
 * - comingSoon: يظهر بشارة «قريبًا» ويمكن فتح الصفحة لرسالة الترقّب.
 * - hiddenFromNav: لا يُعرض في قوائم المستخدم (المسار قد يبقى للروابط العميقة/الأدمن).
 */

export const COMING_SOON_PATHS = new Set<string>([
  "/kids",
  "/quran-circles",
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
  "/knowledge-map", // مدمج تحت شبكة المعرفة
  "/masarat",
  "/islam-stats", // مُنزَّل من الاكتشاف (يبقى المسار حيًا)
  "/study-room",
  "/vault", // يُعرض من الإعدادات فقط
  "/cards",
  "/universities", // مُنزَّل من المستوى الأول
  "/mind-map", // يُفتح من صفحة استكشف المعرفة (لا قائمة أولى)
  "/mushaf/page", // مدخل مصحف واحد: /mushaf
  "/quran-circles", // قريبًا — يُبقى في مركز القرآن فقط بشارة
  "/quran/recitation-test-ai", // تجريبي — من مركز القرآن/المصحف فقط

  // ── دمج هيكل المعلومات (2026-07-27) — مسارات مُعاد توجيهها أو مُنزَّلة من الاكتشاف
  "/quran-studies", // → /ulum-quran
  "/anbiya", // → /prophets
  "/start-here", // → /learning/paths
  "/learning/calendar", // → /calendar
  "/prayer-countdown", // → /prayer-times
  "/annual-courses", // القائمة → /lessons?tab=courses (التفاصيل تبقى)
  "/duas", // اكتشاف الأدعية عبر /adhkar (الصفحة تبقى للروابط العميقة)
  "/prayer-ranks", // يُفتح من دليل الصلاة
  "/sujood-sahw", // يُفتح من دليل الصلاة
  // فهارس موضوعات ثانوية — الاكتشاف عبر المسارات/الدروس/الفقه
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
]);

/** مسارات قديمة تُعاد كتابتها عند التسجيل في «الأخيرة» أو الروابط المحفوظة. */
export const MERGED_PATH_REDIRECTS: Record<string, string> = {
  "/knowledge-map": "/knowledge-graph",
  "/learning-plan": "/learning/paths",
  "/masarat": "/learning/paths",
  "/family-mode": "/family",
  "/learning/quiz": "/quiz",
  "/mushaf-v2-preview": "/mushaf",
  "/features-in-progress": "/updates",
  "/quran-studies": "/ulum-quran",
  "/anbiya": "/prophets",
  "/start-here": "/learning/paths",
  "/learning/calendar": "/calendar",
  "/prayer-countdown": "/prayer-times",
  "/annual-courses": "/lessons?tab=courses",
};

export function resolveMergedPath(href: string): string {
  const clean = href.split("#")[0].split("?")[0] || href;
  return MERGED_PATH_REDIRECTS[clean] ?? href;
}

export function isComingSoonPath(href: string): boolean {
  const clean = href.split("#")[0].split("?")[0] || href;
  return COMING_SOON_PATHS.has(clean);
}

export function isHiddenFromNav(href: string): boolean {
  const clean = href.split("#")[0].split("?")[0] || href;
  if (HIDDEN_FROM_NAV_PATHS.has(clean)) return true;
  return false;
}

export function filterNavItems<T extends { href: string }>(items: T[]): T[] {
  return items.filter((item) => !isHiddenFromNav(item.href));
}
