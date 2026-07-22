import COUNTS from "@/data/content-counts.json";

export type NavLink = {
  href: string;
  label: string;
  description?: string;
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
 *
 * ملاحظة (2026-07-18): القائمة الجانبية (SideNavDrawer) والورقة السفلية
 * (MoreBottomSheet) لهما بيانات روابط خاصة بهما مباشرة في ملفَي المكوّنين —
 * وليس عبر هذا الملف. راجع phase 3 في READY_FOR_MERGE.md لتفاصيل التوحيد.
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
  // القرآن
  { href: "/quran-hub",           label: "مركز القرآن" },
  { href: "/quran-radio",         label: "إذاعة القرآن" },
  { href: "/quran/surah-stories", label: "قصص القرآن" },
  { href: "/quran/recitation-test-ai", label: "اختبار التسميع بالذكاء الاصطناعي" },
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

/**
 * القائمة العلوية (top navbar) — 6 أقسام رئيسية.
 * البحث والحساب ليسا هنا لأن لهما عنصري واجهة دائمين مستقلّين في الهيدر
 * (زر البحث الشامل Ctrl+K، ورابط الحساب/تسجيل الدخول) — انظر NavBar.tsx.
 */
export const PRIMARY_NAV_ITEMS: NavLink[] = [
  { href: "/",          label: "الرئيسية" },
  { href: "/lessons",   label: "تعلّم",    description: "حديث · عقيدة · فقه · سيرة" },
  { href: "/quran-hub", label: "القرآن",   description: "مصحف · تجويد · قراء · إذاعة" },
  { href: "/library",   label: "المكتبة",  description: "كتب · مخطوطات · مؤسسات" },
  { href: "/scholars",  label: "العلماء",  description: "تراجم العلماء والمشايخ" },
  { href: "/fiqh",      label: "الفقه",    description: "أحكام · مسائل · مجمع فقهي" },
];

export const HOME_FEATURE_CARDS = [
  {
    href: "/adhkar",
    title: "الأذكار",
    description: "أذكار يومية مع تخريجها",
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
  { href: "/fiqh", title: "الفقه الإسلامي", description: "الأحكام والأسئلة والمجمع الفقهي" },
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
  { href: "/scholars",     title: "أعلام الإسلام",        description: `${COUNTS.scholars} عالِمًا من الأئمة الأربعة حتى العلماء المعاصرين` },
  { href: "/asma-husna",  title: "الأسماء الحسنى",       description: "أسماء الله التسعة والتسعون — كل اسم بمعناه وآيته ومنفعته" },
  { href: "/akhlaq",     title: "الأخلاق الإسلامية",    description: "أخلاق إسلامية مع آيات وأحاديث وأقوال العلماء والتطبيق العملي" },
  { href: "/duas",       title: "الأدعية الشرعية",      description: "أدعية الصباح والكرب والسفر والنوم — مع مصدر كل دعاء" },
  { href: "/arkan",      title: "أركان الإسلام",        description: "الأركان الخمسة مع الأدلة القرآنية والنبوية والتفاصيل الفقهية وأقوال العلماء" },
  { href: "/arkan-iman",    title: "أركان الإيمان",        description: "الأركان الستة مع أدلة القرآن والسنة وأقوال العلماء: الإيمان بالله والملائكة والكتب" },
  { href: "/hadith-science", title: "مصطلح الحديث",       description: "مصطلحات علوم الحديث: أنواع الأحاديث والسند والراوي والجرح والتعديل والكتب الستة" },
  { href: "/madhahib",        title: "المذاهب الفقهية",    description: "المذاهب الأربعة: الحنفي والمالكي والشافعي والحنبلي — مناهجها ومصادرها وانتشارها وأبرز مصنفاتها" },
  { href: "/sunan-yawmiyya",  title: "السنن اليومية",       description: "دليل عملي لتطبيق السنن النبوية في الحياة اليومية مع مؤشر تتبع التقدم" },
  { href: "/hikam-salaf",     title: "حكم السلف",           description: "من أقوال الحسن البصري وابن تيمية وابن القيم والشافعي وغيرهم — بحث وحفظ ونسخ" },
  { href: "/zakat",           title: "الزكاة وأحكامها",     description: "دليل الزكاة الشامل: أنواعها وشروطها ونصابها ومصارفها مع حاسبة مبسطة" },
  { href: "/sawm",            title: "الصيام وأحكامه",      description: "دليل شامل لأنواع الصيام وشروطه ومفطراته والمعذورين وفضائل رمضان" },
  { href: "/hajj",            title: "الحج والعمرة",        description: "دليل شامل لمناسك الحج والعمرة: الأركان والواجبات والمشاعر ومحظورات الإحرام" },
  { href: "/tahara",          title: "الطهارة وأحكامها",   description: "الوضوء والغسل والتيمم وأنواع المياه والنجاسات — شروط ونواقض وكيفية" },
  { href: "/fadail-aamal",   title: "فضائل الأعمال",      description: "أحاديث في فضائل الصلاة والصيام والقرآن والذكر والصدقة والأخلاق" },
  { href: "/janaza",         title: "أحكام الجنائز",      description: "دليل شامل لما يجب على المسلمين تجاه موتاهم من الغسل والتكفين والصلاة والدفن" },
  { href: "/sahabah",        title: "أعلام الصحابة الكرام", description: "موسوعة كبار الصحابة رضي الله عنهم: سيرتهم وفضائلهم وإرثهم في الإسلام" },
  { href: "/tawba",          title: "التوبة والاستغفار",   description: "شروط التوبة النصوح وأنواعها وأفضل صيغ الاستغفار المأثورة وآثارها العظيمة" },
  { href: "/ulum-quran",    title: "علوم القرآن الكريم",  description: "النزول والجمع والتفسير والإعجاز والمحكم والمتشابه والناسخ والمنسوخ" },
  { href: "/mawarith",      title: "المواريث والفرائض",   description: "حصص الورثة الشرعية وأسباب الإرث وموانعه وأحكام العَصَبة والحجب والعَوْل والردّ" },
  { href: "/salah-guide",   title: "دليل الصلاة الكامل",  description: "الشروط والأركان وكيفية الصلاة والمبطلات والخشوع وفضائل الصلاة الخمس" },
  { href: "/duas-quran",    title: "أدعية القرآن الكريم",  description: "أدعية قرآنية مأثورة: دعاء الأنبياء والمؤمنين مع سياقها وفوائدها" },
  { href: "/knowledge-map", title: "الخريطة المعرفية",   description: "حقول العلوم الشرعية بروابط تفاعلية ومحرك بحث" },
  { href: "/quran-hub",    title: "مركز القرآن",          description: "بوابتك الشاملة للمصحف والتجويد والإذاعات والبث المباشر" },
  { href: "/study-room",   title: "غرفة الدراسة",         description: "مؤقت بومودورو وتتبع جلسات المذاكرة وإحصائيات التعلم" },
  { href: "/vault",        title: "مخزن المعرفة",          description: "المفضلات والملاحظات الشخصية واستئناف القراءة" },
  { href: "/learning/calendar", title: "تقويم الدروس",    description: "مواعيد الدروس والدورات الإسلامية القادمة مع تصدير ICS" },
  { href: "/start-here",  title: "ابدأ من هنا",           description: "مسار مرتّب للمبتدئ في طلب العلم الشرعي" },
] as const;

/** PRIMARY_NAV kept for legacy compatibility */
export const PRIMARY_NAV = PRIMARY_NAV_ITEMS;
