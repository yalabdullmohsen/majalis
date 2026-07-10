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
  { href: "/miracles",             label: "المعجزات" },
  { href: "/prophetic-medicine",   label: "الطب النبوي" },
  { href: "/qa",            label: "الأسئلة" },
  { href: "/arbaeen-nawawi",label: "الأربعون النووية" },
  { href: "/updates",       label: "المستجدات" },
  { href: "/fiqh",               label: "الفقه الإسلامي" },
  { href: "/fiqh-council",       label: "المجمع الفقهي" },
  { href: "/fatwa",              label: "الفتاوى" },
  { href: "/rulings",            label: "الأحكام الشرعية" },
  { href: "/seerah",             label: "السيرة النبوية" },
  { href: "/scholarly-research", label: "الباحث الشرعي" },
  { href: "/scholars",          label: "أعلام الإسلام" },
  { href: "/knowledge-map",     label: "الخريطة المعرفية" },
  { href: "/asma-husna",        label: "الأسماء الحسنى" },
  { href: "/akhlaq",            label: "الأخلاق الإسلامية" },
  { href: "/arkan",             label: "أركان الإسلام" },
  { href: "/arkan-iman",        label: "أركان الإيمان" },
  { href: "/hadith-science",    label: "مصطلح الحديث" },
  { href: "/madhahib",          label: "المذاهب الفقهية" },
  { href: "/sunan-yawmiyya",    label: "السنن النبوية اليومية" },
  { href: "/hikam-salaf",       label: "حكم السلف الصالح" },
  { href: "/zakat",             label: "الزكاة وأحكامها" },
  { href: "/sawm",              label: "الصيام وأحكامه" },
  { href: "/hajj",              label: "الحج والعمرة" },
  { href: "/tahara",            label: "الطهارة وأحكامها" },
  { href: "/fadail-aamal",     label: "فضائل الأعمال" },
  { href: "/janaza",            label: "أحكام الجنائز" },
  { href: "/sahabah",           label: "أعلام الصحابة" },
  { href: "/shamael",           label: "الشمائل المحمدية" },
  { href: "/islam-stats",       label: "الإسلام في أرقام" },
  { href: "/islamic-glossary",  label: "المصطلحات الإسلامية" },
  { href: "/adab-talab-ilm",   label: "آداب طالب العلم" },
  { href: "/anbiya",            label: "قصص الأنبياء والرسل" },
  { href: "/janna-naar",        label: "صفة الجنة والنار" },
  { href: "/alamat-saah",       label: "علامات الساعة" },
  { href: "/malaika",           label: "الملائكة في الإسلام" },
  { href: "/wasaya-nabawiyya",  label: "الوصايا النبوية" },
  { href: "/raqaiq",            label: "الرقائق والزهد" },
  { href: "/tawba",             label: "التوبة والاستغفار" },
  { href: "/ulum-quran",        label: "علوم القرآن" },
  { href: "/mawarith",          label: "المواريث والفرائض" },
  { href: "/salah-guide",       label: "دليل الصلاة الكامل" },
  { href: "/fiqh-qawaid",      label: "القواعد الفقهية الكبرى" },
  { href: "/duas-quran",        label: "أدعية القرآن الكريم" },
  { href: "/universities",       label: "دليل الجامعات" },
  { href: "/learning-path",      label: "خارطة طالب العلم" },
  // القرآن
  { href: "/quran-hub",           label: "مركز القرآن" },
  { href: "/quran-radio",         label: "إذاعة القرآن" },
  { href: "/quran/surah-stories", label: "قصص القرآن" },
  // الأذكار
  { href: "/adhkar",        label: "الأذكار" },
  { href: "/duas",          label: "الأدعية الشرعية" },
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
  { href: "/methodology",   label: "منهجية التوثيق" },
];

/** القائمة العلوية (top navbar) — 4 مجموعات رئيسية + الرئيسية */
export const PRIMARY_NAV_ITEMS: NavLink[] = [
  { href: "/",              label: "الرئيسية" },
  { href: "/lessons",       label: "المكتبة",      description: "دروس · دورات · مكتبة · فتاوى" },
  { href: "/quran",         label: "القرآن",        description: "مصحف · أذكار · ورد يومي" },
  { href: "/seerah",        label: "المعرفة",       description: "سيرة · أنبياء · خرائط معرفية" },
  { href: "/prayer-times",  label: "أدواتي",        description: "صلاة · بحث · تقدمي" },
];

/**
 * NAV_GROUPS — 4 مجموعات رئيسية لتجربة تنقل واضحة.
 * تُستخدم في: SideNavDrawer، MoreBottomSheet
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "library",
    title: "المكتبة",
    links: [
      { href: "/lessons",        label: "الدروس الشرعية",      description: "دروس ومحاضرات مجدولة من علماء الكويت" },
      { href: "/annual-courses", label: "الدورات العلمية",      description: "برامج سنوية في العقيدة والفقه والحديث" },
      { href: "/library",        label: "المكتبة العلمية",      description: "108 كتاب في الفقه والتفسير والحديث والعقيدة" },
      { href: "/hadith",         label: "الأحاديث النبوية",     description: "أحاديث موثقة صحيحة وضعيفة وموضوعة" },
      { href: "/fawaid",         label: "الفوائد العلمية",      description: "330+ فائدة منتقاة من أقوال العلماء" },
      { href: "/arbaeen-nawawi", label: "الأربعون النووية",     description: "أمهات أحاديث الإسلام" },
      { href: "/fiqh",           label: "الفقه الإسلامي",      description: "بوابة الفقه الشامل" },
      { href: "/fiqh-council",   label: "المجمع الفقهي",        description: "قرارات وبحوث وتوصيات" },
      { href: "/fatwa",          label: "الفتاوى",              description: "74+ فتوى موثقة ومُراجَعة" },
      { href: "/rulings",        label: "الأحكام الشرعية",      description: "43 حكماً مع الأدلة والمراجع" },
      { href: "/calendar",       label: "تقويم الدروس",         description: "التقويم الشهري للدروس والمواعيد" },
      { href: "/updates",        label: "آخر المستجدات",        description: "أحدث القرارات والفتاوى والدروس" },
      { href: "/qa",             label: "الأسئلة التعليمية",    description: "أسئلة وأجوبة علمية موثقة" },
    ],
  },
  {
    id: "quran-adhkar",
    title: "القرآن والأذكار",
    links: [
      { href: "/quran",                label: "المصحف الرقمي",        description: "604 صفحة بخط عثماني عالي الجودة" },
      { href: "/quran-hub",            label: "مركز القرآن",          description: "بوابتك الشاملة للقرآن الكريم" },
      { href: "/daily-wird",           label: "الورد اليومي",         description: "تتبع قراءتك اليومية" },
      { href: "/quran-radio",          label: "إذاعات القرآن",        description: "بث مباشر بأصوات المشايخ" },
      { href: "/quran-live",           label: "البث المباشر",         description: "بث الحرمين الشريفين مباشرة" },
      { href: "/quran/surah-stories",  label: "قصص القرآن",           description: "أسباب نزول ومحاور ١١٤ سورة" },
      { href: "/quran/tajweed",        label: "التجويد",              description: "أحكام التلاوة الصحيحة" },
      { href: "/ulum-quran",           label: "علوم القرآن",          description: "النزول والجمع والإعجاز" },
      { href: "/adhkar",               label: "الأذكار",              description: "أذكار الصباح والمساء والنوم" },
      { href: "/adhkar?cat=morning",   label: "أذكار الصباح",         description: "" },
      { href: "/adhkar?cat=evening",   label: "أذكار المساء",         description: "" },
      { href: "/duas",                 label: "الأدعية الشرعية",      description: "25 دعاءً موثقاً من القرآن والسنة" },
      { href: "/duas-quran",           label: "أدعية القرآن",         description: "أدعية الأنبياء والمؤمنين" },
      { href: "/tasbih",               label: "عداد التسبيح",         description: "مسبحة إلكترونية" },
      { href: "/asma-husna",           label: "الأسماء الحسنى",       description: "99 اسماً لله تعالى مع المعاني" },
    ],
  },
  {
    id: "knowledge",
    title: "المعرفة",
    links: [
      { href: "/seerah",             label: "السيرة النبوية",      description: "حياة النبي ﷺ من المولد إلى الوفاة" },
      { href: "/prophets",           label: "قصص الأنبياء",       description: "25 نبياً بالقصة والمعجزة" },
      { href: "/stories",            label: "القصص الإسلامية",    description: "قصص من تاريخ الحضارة الإسلامية" },
      { href: "/anbiya",             label: "الأنبياء والرسل",    description: "موسوعة الأنبياء الكرام" },
      { href: "/sahabah",            label: "الصحابة الكرام",     description: "أعلام الجيل الأول الفريد" },
      { href: "/scholars",           label: "أعلام الإسلام",      description: "العلماء عبر التاريخ" },
      { href: "/tawhid",             label: "التوحيد والعقيدة",   description: "أنواع التوحيد وأركان الإيمان" },
      { href: "/arkan",              label: "أركان الإسلام",      description: "الأركان الخمسة بالأدلة" },
      { href: "/arkan-iman",         label: "أركان الإيمان",      description: "الأركان الستة بالأدلة" },
      { href: "/miracles",           label: "الإعجاز العلمي",     description: "55+ معجزة موثقة من القرآن والسنة" },
      { href: "/knowledge-map",      label: "الخريطة المعرفية",   description: "استكشاف تفاعلي لعلوم الإسلام" },
      { href: "/knowledge-graph",    label: "الرسم المعرفي",      description: "علاقات المصطلحات والمفاهيم" },
      { href: "/mind-map",           label: "الخرائط الذهنية",    description: "15+ خريطة في العلوم الشرعية" },
      { href: "/islamic-glossary",   label: "المصطلحات الإسلامية", description: "91+ مصطلح مُعرَّف ومُوثَّق" },
      { href: "/hadith-science",     label: "مصطلح الحديث",       description: "علوم الحديث والجرح والتعديل" },
      { href: "/learning/paths",     label: "المسارات العلمية",   description: "تعلّم منظم من المبتدئ للمتقدم" },
      { href: "/universities",       label: "دليل الجامعات",      description: "جامعات الشريعة في العالم" },
    ],
  },
  {
    id: "my-tools",
    title: "أدواتي",
    links: [
      { href: "/prayer-times",       label: "مواقيت الصلاة",      description: "أوقات دقيقة للكويت" },
      { href: "/prayer-countdown",   label: "عداد الصلاة",        description: "الوقت المتبقي للصلاة" },
      { href: "/qibla",              label: "القبلة",              description: "اتجاه الكعبة" },
      { href: "/muezzins",           label: "مكتبة المؤذنين",     description: "أجمل أصوات الأذان" },
      { href: "/search",             label: "البحث الشامل",       description: "ابحث في كل محتوى التطبيق" },
      { href: "/quiz",               label: "المسابقات",           description: "680+ سؤال علمي" },
      { href: "/flashcards",         label: "بطاقات المراجعة",    description: "احفظ وراجع بأسلوب SM-2" },
      { href: "/learning-plan",      label: "خطة التعلّم",        description: "نظّم رحلتك العلمية" },
      { href: "/my-learning",        label: "لوحتي التعليمية",    description: "تقدمك وإنجازاتك" },
      { href: "/daily-wird",         label: "الورد اليومي",       description: "تتبع القراءة اليومية" },
      { href: "/occasions",          label: "المناسبات",           description: "المناسبات الإسلامية" },
      { href: "/calendar",           label: "التقويم",             description: "التقويم الهجري" },
      { href: "/cards",              label: "البطاقات الدعوية",   description: "بطاقات اقتباسات بصرية" },
      { href: "/settings",           label: "الإعدادات",           description: "تخصيص تجربتك" },
      { href: "/notification-settings", label: "التنبيهات",       description: "مواقيت الصلاة والذكر" },
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
  { href: "/quran-radio",      label: "إذاعة القرآن" },
  { href: "/quran-live",       label: "البث المباشر" },
  { href: "/quran/tajweed",    label: "التجويد" },
  { href: "/quran/surah-stories", label: "قصص القرآن" },
  // الأذكار والأدوات
  { href: "/adhkar",           label: "الأذكار" },
  { href: "/tasbih",           label: "عداد التسبيح" },
  { href: "/prayer-ranks",     label: "مراتب الصلاة" },
  { href: "/muezzins",         label: "مكتبة المؤذنين" },
  { href: "/adhan-settings",   label: "إعدادات الأذان" },
  { href: "/quiz",             label: "لعبة سؤال وجواب" },
  { href: "/miracles",           label: "المعجزات" },
  { href: "/prophetic-medicine", label: "الطب النبوي" },
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
    href: "/quran-radio",
    title: "إذاعة القرآن",
    description: "بث مباشر للقرآن",
    icon: "radio",
  },
  {
    href: "/hadith",
    title: "الأحاديث النبوية",
    description: "صحيحة وضعيفة وموضوعة",
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
  { href: "/lessons",               title: "الدروس",                description: "دروس ودورات علمية" },
  { href: "/quran/surah-stories",  title: "قصص القرآن",            description: "أسباب نزول ومحاور وقصص ١١٤ سورة قرآنية" },
  { href: "/hadith", title: "الأحاديث النبوية", description: "أحاديث صحيحة وضعيفة وموضوعة مصنّفة ومفصولة" },
  { href: "/tawhid", title: "التوحيد والعقيدة", description: "أنواع التوحيد وأركان الإيمان والأسماء الحسنى" },
  { href: "/daily-wird", title: "الورد اليومي", description: "تتبع صفحات القرآن اليومية مع السلسلة المتواصلة" },
  { href: "/prayer-ranks", title: "فضائل الصلاة ومراتبها", description: "المراتب الخمسة في الصلاة وفضائلها من القرآن والسنة" },
  { href: "/stories", title: "القصص الإسلامية", description: "قصص من السيرة النبوية والأنبياء والصحابة" },
  { href: "/prophets", title: "قصص الأنبياء", description: "الأنبياء الخمسة والعشرون في القرآن — نبذات وعبر" },
  { href: "/fiqh", title: "الفقه الإسلامي", description: "الفتاوى والأحكام والمجمع الفقهي" },
  { href: "/fatwa", title: "الفتاوى", description: "مركز الفتاوى الشرعية" },
  { href: "/rulings", title: "الأحكام الشرعية", description: "مكتبة الأحكام والأدلة" },
  { href: "/seerah", title: "السيرة النبوية", description: "حياة النبي محمد ﷺ من المولد إلى الوفاة" },
  { href: "/prophetic-medicine", title: "الطب النبوي", description: "ما ثبت في السنة من التداوي والوقاية" },
  { href: "/annual-courses", title: "الدورات العلمية", description: "برامج ودورات سنوية" },
  { href: "/updates", title: "آخر المستجدات", description: "قرارات وفتاوى ودروس جديدة" },
  { href: "/assistant", title: "المساعد العلمي", description: "إرشاد داخل التطبيق" },
  { href: "/library", title: "المكتبة", description: "كتب ومتون" },
  { href: "/learning/paths", title: "المسارات العلمية", description: "تعلم منظم من المبتدئ للمتقدم" },
  { href: "/my-learning", title: "لوحتي التعليمية", description: "تقدمك وإنجازاتك" },
  { href: "/quiz", title: "المسابقات", description: "اختبر معلوماتك" },
  { href: "/scholars",     title: "أعلام الإسلام",        description: "15 عالماً من الأئمة الأربعة حتى العلماء المعاصرين" },
  { href: "/asma-husna",  title: "الأسماء الحسنى",       description: "أسماء الله التسعة والتسعون — كل اسم بمعناه وآيته ومنفعته" },
  { href: "/akhlaq",     title: "الأخلاق الإسلامية",    description: "15 خلقاً إسلامياً مع آيات وأحاديث وأقوال العلماء والتطبيق العملي" },
  { href: "/duas",       title: "الأدعية الشرعية",      description: "25 دعاءً موثقاً من القرآن والسنة — أدعية الصباح والكرب والسفر والنوم" },
  { href: "/arkan",      title: "أركان الإسلام",        description: "الأركان الخمسة مع الأدلة القرآنية والنبوية والتفاصيل الفقهية وأقوال العلماء" },
  { href: "/arkan-iman",    title: "أركان الإيمان",        description: "الأركان الستة مع أدلة القرآن والسنة وأقوال العلماء: الإيمان بالله والملائكة والكتب" },
  { href: "/hadith-science", title: "مصطلح الحديث",       description: "30+ مصطلح في علوم الحديث: أنواع الأحاديث والسند والراوي والجرح والتعديل والكتب الستة" },
  { href: "/madhahib",        title: "المذاهب الفقهية",    description: "المذاهب الأربعة: الحنفي والمالكي والشافعي والحنبلي — مناهجها ومصادرها وانتشارها وأبرز مصنفاتها" },
  { href: "/sunan-yawmiyya",  title: "السنن اليومية",       description: "دليل عملي لتطبيق 25+ سنة نبوية في الحياة اليومية مع مؤشر تتبع التقدم" },
  { href: "/hikam-salaf",     title: "حكم السلف",           description: "40+ حكمة من أقوال الحسن البصري وابن تيمية وابن القيم والشافعي وغيرهم — بحث وحفظ ونسخ" },
  { href: "/zakat",           title: "الزكاة وأحكامها",     description: "دليل الزكاة الشامل: أنواعها وشروطها ونصابها ومصارفها مع حاسبة مبسطة" },
  { href: "/sawm",            title: "الصيام وأحكامه",      description: "دليل شامل لأنواع الصيام وشروطه ومفطراته والمعذورين وفضائل رمضان" },
  { href: "/hajj",            title: "الحج والعمرة",        description: "دليل شامل لمناسك الحج والعمرة: الأركان والواجبات والمشاعر ومحظورات الإحرام" },
  { href: "/tahara",          title: "الطهارة وأحكامها",   description: "الوضوء والغسل والتيمم وأنواع المياه والنجاسات — شروط ونواقض وكيفية" },
  { href: "/fadail-aamal",   title: "فضائل الأعمال",      description: "30+ حديث صحيح وحسن في فضائل الصلاة والصيام والقرآن والذكر والصدقة والأخلاق" },
  { href: "/janaza",         title: "أحكام الجنائز",      description: "دليل شامل لما يجب على المسلمين تجاه موتاهم من الغسل والتكفين والصلاة والدفن" },
  { href: "/sahabah",        title: "أعلام الصحابة الكرام", description: "موسوعة كبار الصحابة رضي الله عنهم: سيرتهم وفضائلهم وإرثهم في الإسلام" },
  { href: "/tawba",          title: "التوبة والاستغفار",   description: "شروط التوبة النصوح وأنواعها وأفضل صيغ الاستغفار المأثورة وآثارها العظيمة" },
  { href: "/ulum-quran",    title: "علوم القرآن الكريم",  description: "النزول والجمع والتفسير والإعجاز والمحكم والمتشابه والناسخ والمنسوخ" },
  { href: "/mawarith",      title: "المواريث والفرائض",   description: "حصص الورثة الشرعية وأسباب الإرث وموانعه وأحكام العَصَبة والحجب والعَوْل والردّ" },
  { href: "/salah-guide",   title: "دليل الصلاة الكامل",  description: "الشروط والأركان وكيفية الصلاة والمبطلات والخشوع وفضائل الصلاة الخمس" },
  { href: "/duas-quran",    title: "أدعية القرآن الكريم",  description: "12 دعاءً قرآنياً مأثوراً: دعاء الأنبياء والمؤمنين مع سياقها وفوائدها" },
  { href: "/knowledge-map", title: "الخريطة المعرفية",   description: "14 حقلاً علمياً بروابط تفاعلية ومحركات البحث" },
  { href: "/quran-hub",    title: "مركز القرآن",          description: "بوابتك الشاملة للمصحف والتجويد والإذاعات والبث المباشر" },
] as const;

/** PRIMARY_NAV kept for legacy compatibility */
export const PRIMARY_NAV = PRIMARY_NAV_ITEMS;
