export type NavLink = {
  href: string;
  label: string;
  description?: string;
};

export type NavGroup = {
  id: string;
  title: string;
  links: NavLink[];
};

/**
 * PUBLIC_NAV_ITEMS — المصدر الوحيد للحقيقة لجميع الصفحات العامة.
 *
 * القاعدة: أي مسار في هذه القائمة يجب أن:
 *   1. يكون مُعرَّفاً في App.tsx بـ SafeLazyRoute (لا AdminLazyRoute)
 *   2. يفتح بدون تسجيل دخول
 *   3. لا يُعيد التوجيه إلى /login أو /admin
 *
 * تُستخدَم هذه القائمة في:
 *   - اختبار Playwright (00-public-routes.spec.ts) للتحقق من الوصول العام
 *   - القائمة الرئيسية (PRIMARY_NAV_ITEMS)
 *   - القائمة الجانبية (NAV_GROUPS)
 */
export const PUBLIC_NAV_ITEMS: NavLink[] = [
  // الصفحة الرئيسية
  { href: "/",              label: "الرئيسية" },
  // المحتوى العلمي
  { href: "/lessons",       label: "الدروس" },
  { href: "/annual-courses",label: "الدورات العلمية" },
  { href: "/library",       label: "المكتبة" },
  { href: "/hadith",        label: "الأحاديث" },
  { href: "/fawaid",        label: "الفوائد" },
  { href: "/stories",       label: "القصص الإسلامية" },
  { href: "/miracles",      label: "المعجزات" },
  { href: "/qa",            label: "الأسئلة" },
  { href: "/arbaeen-nawawi",label: "الأربعون النووية" },
  { href: "/sujood-sahw",      label: "سجود السهو" },
  { href: "/amrad-qalbiyya",   label: "الأمراض القلبية" },
  { href: "/durus-imaniyya",   label: "الدروس الإيمانية والتربوية" },
  { href: "/durus-mutanawwia", label: "دروس متنوعة" },
  { href: "/updates",       label: "المستجدات" },
  { href: "/fiqh",               label: "الفقه الإسلامي" },
  { href: "/fiqh-council",       label: "المجمع الفقهي" },
  { href: "/fatwa",              label: "الفتاوى" },
  { href: "/rulings",            label: "الأحكام الشرعية" },
  { href: "/seerah",             label: "السيرة النبوية" },
  { href: "/scholarly-research", label: "الباحث الشرعي" },
  { href: "/universities",       label: "دليل الجامعات" },
  { href: "/learning-path",      label: "خارطة طالب العلم" },
  // الإيمان والعقيدة
  { href: "/iman-topics",        label: "الإيمان والعقيدة" },
  // الدراسات القرآنية
  { href: "/quran-studies",      label: "الدراسات القرآنية" },
  // دراسات السنة
  { href: "/sunnah-studies",     label: "دراسات السنة" },
  // تزكية النفس والأخلاق
  { href: "/tazkiya-topics",     label: "تزكية النفس" },
  // السيرة والتاريخ
  { href: "/tarikh-islami",      label: "التاريخ الإسلامي" },
  // الأسرة والمجتمع
  { href: "/usra-mujtama",       label: "الأسرة والمجتمع" },
  // الفكر والواقع
  { href: "/fikr-waqia",         label: "الفكر والواقع" },
  // الموسوعة العملية
  { href: "/mawsuaat",           label: "الموسوعة العملية" },
  // مسارات التعلم
  { href: "/masarat",            label: "مسارات التعلم" },
  // الأذكار
  { href: "/adhkar",        label: "الأذكار" },
  { href: "/tasbih",        label: "التسبيح" },
  // الأدوات
  { href: "/prayer-times",  label: "مواقيت الصلاة" },
  { href: "/muezzins",      label: "مكتبة المؤذنين" },
  { href: "/qibla",         label: "القبلة" },
  { href: "/occasions",     label: "المناسبات" },
  { href: "/calendar",      label: "التقويم" },
  { href: "/quiz",          label: "المسابقات" },
  // عام
  { href: "/search",        label: "البحث" },
  { href: "/settings",      label: "الإعدادات" },
  { href: "/about",         label: "عن التطبيق" },
];

/** مجموعة فرعية للقائمة العلوية (top navbar) — مشتقة من PUBLIC_NAV_ITEMS */
export const PRIMARY_NAV_ITEMS: NavLink[] = [
  { href: "/",             label: "الرئيسية" },
  { href: "/lessons",      label: "الدروس" },
  { href: "/quran-studies",label: "القرآن" },
  { href: "/library",      label: "المكتبة" },
  { href: "/adhkar",       label: "الأذكار" },
  { href: "/prayer-times", label: "الصلاة" },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "content",
    title: "المحتوى",
    links: [
      { href: "/", label: "الرئيسية" },
      { href: "/search", label: "البحث" },
      { href: "/lessons", label: "الدروس" },
      { href: "/quiz", label: "لعبة سؤال وجواب" },
      { href: "/annual-courses", label: "الدورات العلمية" },
      { href: "/fiqh", label: "الفقه الإسلامي" },
      { href: "/fiqh-council", label: "المجمع الفقهي الإسلامي" },
      { href: "/fatwa", label: "الفتاوى" },
      { href: "/rulings", label: "الأحكام الشرعية" },
      { href: "/seerah", label: "السيرة النبوية" },
      { href: "/updates", label: "آخر المستجدات" },
      { href: "/calendar", label: "التقويم" },
      { href: "/fawaid", label: "الفوائد" },
      { href: "/hadith", label: "الأحاديث الصحيحة" },
      { href: "/stories", label: "القصص الإسلامية" },
      { href: "/prophets", label: "قصص الأنبياء" },
      { href: "/miracles", label: "المعجزات" },
      { href: "/qa", label: "الأسئلة التعليمية" },
      { href: "/assistant", label: "المساعد العلمي" },
      { href: "/knowledge-graph", label: "خارطة المعرفة الإسلامية" },
      { href: "/scholarly-research", label: "الباحث الشرعي" },
      { href: "/universities", label: "دليل الجامعات" },
      { href: "/institutions", label: "دليل المؤسسات" },
    ],
  },
  {
    id: "quran",
    title: "القرآن",
    links: [
      { href: "/quran-studies", label: "الدراسات القرآنية" },
      { href: "/quran/surah-stories", label: "قصص القرآن" },
      { href: "/daily-wird", label: "الورد اليومي" },
    ],
  },
  {
    id: "adhkar",
    title: "الأذكار",
    links: [
      { href: "/adhkar?cat=morning", label: "أذكار الصباح" },
      { href: "/adhkar?cat=evening", label: "أذكار المساء" },
      { href: "/adhkar?cat=distress", label: "الدعاء" },
      { href: "/tasbih", label: "التسابيح" },
    ],
  },
  {
    id: "sunnah",
    title: "السنة",
    links: [
      { href: "/hadith", label: "الأحاديث الصحيحة" },
      { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
      { href: "/sujood-sahw",    label: "سجود السهو" },
      { href: "/amrad-qalbiyya", label: "الأمراض القلبية" },
      { href: "/durus-imaniyya",   label: "الدروس الإيمانية والتربوية" },
      { href: "/durus-mutanawwia", label: "دروس متنوعة" },
      { href: "/adhkar", label: "سنن مؤقتة" },
      { href: "/adhkar?cat=misc", label: "سنن غير مؤقتة" },
      { href: "/quran-studies", label: "فضائل القرآن" },
      { href: "/occasions", label: "اليوم النبوي" },
      { href: "/daily-wird", label: "متابعة النوافل" },
    ],
  },
  {
    id: "tools",
    title: "الأدوات",
    links: [
      { href: "/prayer-times", label: "مواقيت الصلاة" },
      { href: "/qibla", label: "القبلة" },
      { href: "/occasions", label: "المناسبات الإسلامية" },
      { href: "/settings", label: "الإعدادات" },
    ],
  },
];

/** Mobile "المزيد" dropdown — full site navigation */
export const MOBILE_MORE_NAV = [
  // المحتوى
  { href: "/lessons",          label: "الدروس" },
  { href: "/annual-courses",   label: "الدورات العلمية" },
  { href: "/library",          label: "المكتبة" },
  { href: "/qa",               label: "الأسئلة" },
  { href: "/hadith",           label: "الأحاديث" },
  { href: "/fawaid",           label: "الفوائد" },
  { href: "/stories",          label: "القصص" },
  { href: "/prophets",         label: "قصص الأنبياء" },
  // القرآن
  { href: "/quran-studies",       label: "الدراسات القرآنية" },
  { href: "/quran/surah-stories", label: "قصص القرآن" },
  // الأذكار والأدوات
  { href: "/adhkar",           label: "الأذكار" },
  { href: "/tasbih",           label: "عداد التسبيح" },
  { href: "/prayer-ranks",     label: "مراتب الصلاة" },
  { href: "/muezzins",         label: "مكتبة المؤذنين" },
  { href: "/adhan-settings",   label: "إعدادات الأذان" },
  { href: "/quiz",             label: "لعبة سؤال وجواب" },
  { href: "/miracles",         label: "المعجزات" },
  { href: "/assistant",        label: "المساعد العلمي" },
  { href: "/knowledge-graph",  label: "خارطة المعرفة" },
  { href: "/universities",     label: "دليل الجامعات" },
  { href: "/flashcards",       label: "بطاقات المراجعة" },
  { href: "/learning-plan",    label: "خطة التعلّم" },
  // عام
  { href: "/settings",         label: "الإعدادات" },
  { href: "/upload",           label: "رفع أذان أو درس" },
  { href: "/my-submissions",   label: "مساهماتي" },
  { href: "/submit",           label: "أضف محتوى" },
  { href: "/contact",          label: "تواصل معنا" },
];

export const HOME_FEATURE_CARDS = [
  {
    href: "/quran-studies",
    title: "الدراسات القرآنية",
    description: "تدبر وفهم القرآن الكريم",
    icon: "book-open",
  },
  {
    href: "/adhkar",
    title: "الأذكار",
    description: "أذكار يومية موثقة",
    icon: "sparkles",
  },
  {
    href: "/adhkar?cat=distress",
    title: "الدعاء",
    description: "أدعية من السنة",
    icon: "hands",
  },
  {
    href: "/prayer-times",
    title: "مواقيت الصلاة",
    description: "مواقيت دقيقة للكويت",
    icon: "clock",
  },
  {
    href: "/tasbih",
    title: "التسابيح",
    description: "مسبحة إلكترونية",
    icon: "circle-dot",
  },
  {
    href: "/hadith",
    title: "الأحاديث الصحيحة",
    description: "أحاديث نبوية محققة",
    icon: "scroll-text",
  },
  {
    href: "/arbaeen-nawawi",
    title: "الأربعون النووية",
    description: "أحاديث مختصرة",
    icon: "scroll",
  },
  {
    href: "/qibla",
    title: "القبلة",
    description: "اتجاه الكعبة",
    icon: "compass",
  },
] as const;

export const HOME_MORE_SECTIONS = [
  { href: "/lessons", title: "الدروس", description: "دروس ودورات علمية" },
  { href: "/hadith", title: "الأحاديث الصحيحة", description: "أحاديث نبوية محققة من مصادر موثوقة" },
  { href: "/stories", title: "القصص الإسلامية", description: "قصص من السيرة النبوية والأنبياء والصحابة" },
  { href: "/prophets", title: "قصص الأنبياء", description: "الأنبياء الخمسة والعشرون في القرآن — نبذات وعبر" },
  { href: "/fiqh", title: "الفقه الإسلامي", description: "الفتاوى والأحكام والمجمع الفقهي" },
  { href: "/fatwa", title: "الفتاوى", description: "مركز الفتاوى الشرعية" },
  { href: "/rulings", title: "الأحكام الشرعية", description: "مكتبة الأحكام والأدلة" },
  { href: "/seerah", title: "السيرة النبوية", description: "حياة النبي محمد ﷺ من المولد إلى الوفاة" },
  { href: "/annual-courses", title: "الدورات العلمية", description: "برامج ودورات سنوية" },
  { href: "/updates", title: "آخر المستجدات", description: "قرارات وفتاوى ودروس جديدة" },
  { href: "/assistant", title: "المساعد العلمي", description: "إرشاد داخل التطبيق" },
  { href: "/library", title: "المكتبة", description: "كتب ومتون" },
  { href: "/learning/paths", title: "المسارات العلمية", description: "تعلم منظم من المبتدئ للمتقدم" },
  { href: "/my-learning", title: "لوحتي التعليمية", description: "تقدمك وإنجازاتك" },
  { href: "/quiz", title: "المسابقات", description: "اختبر معلوماتك" },
] as const;

/** PRIMARY_NAV kept for legacy compatibility */
export const PRIMARY_NAV = PRIMARY_NAV_ITEMS;
