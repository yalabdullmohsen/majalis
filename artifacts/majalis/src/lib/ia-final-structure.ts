/**
 * خريطة IA النهائية — مصدر واحد للتنقل العام والاختبارات.
 * الصفحات الفرعية تبقى موجودة؛ لا تُعرض كأبواب عامة.
 */

/** الشريط السفلي (بدون «المزيد» الذي يفتح الورقة/الصفحة). */
export const IA_BOTTOM_TABS = [
  { href: "/quran-hub", label: "القرآن" },
  { href: "/lessons", label: "الدروس" },
  { href: "/prayer-times", label: "الصلاة" },
  { href: "/fiqh", label: "الفقه" },
] as const;

/** ستة أبواب رئيسية في الصفحة الرئيسية فقط. */
export const IA_HOME_PRIMARY = [
  { href: "/quran-hub", title: "القرآن", desc: "المصحف والتجويد والحفظ وعلوم القرآن" },
  { href: "/lessons", title: "الدروس والدورات", desc: "دروس ودورات علمية منظمة" },
  { href: "/prayer-times", title: "مواقيت الصلاة", desc: "المواقيت والقبلة والأذان" },
  { href: "/fiqh", title: "الفقه والأحكام", desc: "الأحكام والقواعد والمجامع تحت باب واحد" },
  { href: "/adhkar", title: "الأذكار اليومية", desc: "أذكار الصباح والمساء وما بينهما" },
  { href: "/sections", title: "جميع الأقسام", desc: "مكتبة وحديث وأعلام وسين جيم" },
] as const;

/** مسارات تُلغى من الاكتشاف العام وتُحوَّل بوضوح. */
export const IA_REDIRECTS: Record<string, string> = {
  "/start-here": "/lessons",
  "/learning/paths": "/lessons",
  "/learning-paths": "/lessons",
  "/tracks": "/lessons",
  "/study-paths": "/lessons",
  "/qa": "/quiz",
  "/courses": "/lessons",
  "/memorize": "/flashcards",
  "/support": "/contact",
  "/about-us": "/about",
  "/who-we-are": "/about",
  "/man-nahnu": "/about",
  "/rulings": "/fiqh",
  "/fatwa": "/fiqh",
  "/topics": "/sections",
  "/tajweed": "/quran-hub/tajweed",
  "/quran/tajweed": "/quran-hub/tajweed",
  "/quran": "/quran-hub",
  "/anbiya": "/prophets",
  "/more": "/#explore",
};

/** عناوين ممنوعة في الأسطح العامة (رئيسية / المزيد / تذييل / وصول سريع). */
export const IA_FORBIDDEN_PUBLIC_LABELS = [
  "المسارات العلمية",
  "مسارات التعلم",
  "الموضوعات العلمية",
  "مفاهيم شرعية",
] as const;

/**
 * أقسام فرعية — تبقى صفحات داخلية تحت الباب، لا أبوابًا عامة.
 * (تُخفى من القوائم العامة عبر HIDDEN_FROM_NAV).
 */
export const IA_NESTED_ONLY_PATHS = [
  "/islamic-glossary",
  "/ulum-quran",
  "/quran-studies",
  "/quran/tajweed",
  "/quran/memorization-plans",
  "/quran/surahs",
  "/quran/surah-stories",
  "/quran-knowledge",
  "/hadith/sahih",
  "/hadith/daif",
  "/hadith/mawdu",
  "/hadith/books",
  "/hadith-science",
  "/hadith/arbaeen",
  "/arbaeen-nawawi",
  "/fiqh-council",
  "/fiqh-council/issues",
  "/fiqh-council/nawazil",
  "/fiqh-council/fatwas",
  "/fiqh-qawaid",
  "/madhahib",
  "/flashcards",
] as const;

/** آباء فتات الخبز للأبواب الفرعية. */
export const IA_BREADCRUMB_PARENTS: Record<string, { name: string; path: string }[]> = {
  "/hadith/sahih": [{ name: "الحديث وعلومه", path: "/hadith" }],
  "/hadith/daif": [{ name: "الحديث وعلومه", path: "/hadith" }],
  "/hadith/mawdu": [{ name: "الحديث وعلومه", path: "/hadith" }],
  "/hadith/books": [{ name: "الحديث وعلومه", path: "/hadith" }],
  "/hadith/arbaeen": [{ name: "الحديث وعلومه", path: "/hadith" }],
  "/hadith-science": [{ name: "الحديث وعلومه", path: "/hadith" }],
  "/arbaeen-nawawi": [{ name: "الحديث وعلومه", path: "/hadith" }],
  "/ulum-quran": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran-studies": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran/tajweed": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran-hub/tajweed": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran-hub/qiraat": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran-hub/tilawa": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran-hub/terms": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran/memorization-plans": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran/surah-stories": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran/surahs": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran/recitation-test-ai": [{ name: "القرآن", path: "/quran-hub" }],
  "/quran-hub/numbers": [{ name: "القرآن", path: "/quran-hub" }],
  "/fiqh": [{ name: "الفقه", path: "/fiqh" }],
  "/fiqh-council": [{ name: "الفقه", path: "/fiqh" }],
  "/fiqh-council/issues": [{ name: "الفقه", path: "/fiqh" }],
  "/fiqh-council/nawazil": [{ name: "الفقه", path: "/fiqh" }],
  "/fiqh-qawaid": [{ name: "الفقه", path: "/fiqh" }],
  "/madhahib": [{ name: "الفقه", path: "/fiqh" }],
  "/islamic-glossary": [{ name: "المصطلحات", path: "/islamic-glossary" }],
};
