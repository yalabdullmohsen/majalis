import COUNTS from "@/data/content-counts.json";
import { seoNavLabel } from "@/lib/seo-nav-labels";
import { filterNavItems } from "@/lib/nav-visibility";

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
 * ملاحظة: القائمة الجانبية (SideNavDrawer) والورقة السفلية (MoreBottomSheet)
 * لهما قوائم روابط محلية في ملفَي المكوّنين، وتُصفَّى عبر nav-visibility.
 * توحيد مصدر واحد للقوائم يبقى قرار IA منفصل خارج نطاق دمج/إخفاء المسارات.
 */
export const PUBLIC_NAV_ITEMS: NavLink[] = [
  // الصفحة الرئيسية
  { href: "/",              label: seoNavLabel("/", "الرئيسية") },
  // المحتوى العلمي
  { href: "/lessons",       label: seoNavLabel("/lessons", "الدروس") },
  { href: "/quran-knowledge", label: seoNavLabel("/quran-knowledge", "القرآن وعلومه") },
  { href: "/hadith",        label: seoNavLabel("/hadith", "الأحاديث") },
  { href: "/fawaid",        label: seoNavLabel("/fawaid", "الفوائد") },
  { href: "/prophets",      label: seoNavLabel("/prophets", "قصص الأنبياء") },
  { href: "/miracles",             label: seoNavLabel("/miracles", "إشارات كونية") },
  { href: "/prophetic-medicine",   label: seoNavLabel("/prophetic-medicine", "الطب النبوي") },
  { href: "/arbaeen-nawawi",label: seoNavLabel("/arbaeen-nawawi", "الأربعون النووية") },
  { href: "/occasions-lessons", label: seoNavLabel("/occasions-lessons", "المناسبات والدروس") },
  { href: "/fiqh",               label: seoNavLabel("/fiqh", "الفقه الإسلامي") },
  { href: "/fiqh-council",       label: seoNavLabel("/fiqh-council", "المجمع الفقهي") },
  { href: "/seerah",             label: seoNavLabel("/seerah", "السيرة النبوية") },
  { href: "/scholars",          label: seoNavLabel("/scholars", "أعلام الإسلام") },
  { href: "/islamic-directory", label: seoNavLabel("/islamic-directory", "الدليل الإسلامي") },
  { href: "/asma-husna",        label: seoNavLabel("/asma-husna", "الأسماء الحسنى") },
  { href: "/akhlaq",            label: seoNavLabel("/akhlaq", "مكارم الأخلاق") },
  { href: "/arkan",             label: seoNavLabel("/arkan", "أركان الإسلام الخمسة") },
  { href: "/arkan-iman",        label: seoNavLabel("/arkan-iman", "أركان الإيمان الستة") },
  { href: "/hadith-science",    label: seoNavLabel("/hadith-science", "مصطلح الحديث") },
  { href: "/madhahib",          label: seoNavLabel("/madhahib", "المذاهب الفقهية") },
  { href: "/sunan-yawmiyya",    label: seoNavLabel("/sunan-yawmiyya", "السنن النبوية اليومية") },
  { href: "/hikam-salaf",       label: seoNavLabel("/hikam-salaf", "حكم السلف الصالح") },
  { href: "/zakat",             label: seoNavLabel("/zakat", "الزكاة وأحكامها") },
  { href: "/sawm",              label: seoNavLabel("/sawm", "الصيام وأحكامه") },
  { href: "/hajj",              label: seoNavLabel("/hajj", "الحج والعمرة") },
  { href: "/tahara",            label: seoNavLabel("/tahara", "الطهارة وأحكامها") },
  { href: "/fadail-aamal",     label: seoNavLabel("/fadail-aamal", "فضائل الأعمال") },
  { href: "/janaza",            label: seoNavLabel("/janaza", "أحكام الجنائز") },
  { href: "/sahabah",           label: seoNavLabel("/sahabah", "أعلام الصحابة") },
  { href: "/shamael",           label: seoNavLabel("/shamael", "صفةُ سيِّد الخلقِ ﷺ") },
  { href: "/islamic-glossary",  label: seoNavLabel("/islamic-glossary", "المصطلحات الإسلامية") },
  { href: "/adab-talab-ilm",   label: seoNavLabel("/adab-talab-ilm", "آداب طالب العلم") },
  { href: "/janna-naar",        label: seoNavLabel("/janna-naar", "صفة الجنة") },
  { href: "/alamat-saah",       label: seoNavLabel("/alamat-saah", "علامات الساعة") },
  { href: "/malaika",           label: seoNavLabel("/malaika", "الملائكة في الإسلام") },
  { href: "/wasaya-nabawiyya",  label: seoNavLabel("/wasaya-nabawiyya", "الوصايا النبوية") },
  { href: "/raqaiq",            label: seoNavLabel("/raqaiq", "الرقائق والزهد") },
  { href: "/tawba",             label: seoNavLabel("/tawba", "التوبة والاستغفار") },
  { href: "/memorization",     label: seoNavLabel("/memorization", "الحفظ والمراجعة") },
  { href: "/tafsir",            label: seoNavLabel("/tafsir", "علم التفسير") },
  { href: "/mawarith",          label: seoNavLabel("/mawarith", "المواريث والفرائض") },
  { href: "/salah-guide",       label: seoNavLabel("/salah-guide", "دليل الصلاة الكامل") },
  { href: "/fiqh-qawaid",      label: seoNavLabel("/fiqh-qawaid", "القواعد الفقهية الكبرى") },
  { href: "/duas-quran",        label: seoNavLabel("/duas-quran", "أدعية القرآن الكريم") },
  // القرآن
  { href: "/mushaf",              label: seoNavLabel("/mushaf", "المصحف الشريف") },
  // الأذكار
  { href: "/adhkar",        label: seoNavLabel("/adhkar", "الأذكار") },
  { href: "/tasbih",        label: seoNavLabel("/tasbih", "التسبيح") },
  // الأدوات
  { href: "/prayer-times",  label: seoNavLabel("/prayer-times", "مواقيت الصلاة") },
  { href: "/qibla",         label: seoNavLabel("/qibla", "القبلة") },
  { href: "/quiz",          label: seoNavLabel("/quiz", "لعبة سين جيم") },
  // عام
  { href: "/search",        label: seoNavLabel("/search", "البحث") },
  { href: "/settings",      label: seoNavLabel("/settings", "الإعدادات") },
  { href: "/methodology",   label: seoNavLabel("/methodology", "منهجية التوثيق") },
];

/**
 * القائمة العلوية (top navbar) — أربع مساحات موحّدة مع الشريط السفلي.
 * البحث والحساب ليسا هنا لأن لهما عنصري واجهة دائمين مستقلّين في الهيدر
 * (زر البحث الشامل Ctrl+K، ورابط الحساب/تسجيل الدخول) — انظر NavBar.tsx.
 */
export const PRIMARY_NAV_ITEMS: NavLink[] = [
  { href: "/", label: seoNavLabel("/", "الرئيسية") },
  { href: "/quran-hub", label: seoNavLabel("/quran-hub", "قرآن"), description: "مركز · مصحف · تسميع · علوم" },
  { href: "/lessons", label: seoNavLabel("/lessons", "الدروس"), description: "دروس · حديث · سيرة" },
  { href: "/prayer-times", label: seoNavLabel("/prayer-times", "الصلاة"), description: "صلاة · أذكار · ورد" },
  { href: "/fiqh", label: seoNavLabel("/fiqh", "فقه"), description: "أحكام · مسائل · أسئلة" },
];

export const HOME_FEATURE_CARDS = [
  {
    href: "/adhkar",
    title: seoNavLabel("/adhkar", "الأذكار"),
    description: "أذكار يومية مع المصدر قدر الإمكان",
    icon: "sparkles",
  },
  {
    href: "/adhkar/distress",
    title: seoNavLabel("/adhkar/distress", "الدعاء"),
    description: "أدعية مأثورة مع بيان المصدر حين يتوفر",
    icon: "hands",
  },
  {
    href: "/prayer-times",
    title: seoNavLabel("/prayer-times", "مواقيت الصلاة"),
    description: "مواقيت دقيقة للكويت",
    icon: "clock",
  },
  {
    href: "/tasbih",
    title: seoNavLabel("/tasbih", "التسابيح"),
    description: "مسبحة إلكترونية",
    icon: "circle-dot",
  },
  {
    href: "/hadith",
    title: seoNavLabel("/hadith", "الأحاديث النبوية"),
    description: "صحيحة وضعيفة وموضوعة",
    icon: "scroll-text",
  },
  {
    href: "/arbaeen-nawawi",
    title: seoNavLabel("/arbaeen-nawawi", "الأربعون النووية"),
    description: "أحاديث مختصرة",
    icon: "scroll",
  },
  {
    href: "/qibla",
    title: seoNavLabel("/qibla", "القبلة"),
    description: "اتجاه الكعبة",
    icon: "compass",
  },
] as const;

export const HOME_MORE_SECTIONS_RAW = [
  { href: "/lessons",               title: seoNavLabel("/lessons", "الدروس"),                description: "دروس ودورات علمية" },
  { href: "/lessons?tab=courses",   title: seoNavLabel("/lessons?tab=courses", "الدورات العلمية"), description: "برامج ودورات ضمن جدول الدروس" },
  { href: "/mushaf",    title: seoNavLabel("/mushaf", "المصحف الشريف"),          description: "قراءة القرآن الكريم مع التلاوة والبحث والمرجع الأخير" },
    { href: "/hadith", title: seoNavLabel("/hadith", "الأحاديث النبوية"), description: "أحاديث صحيحة وضعيفة وموضوعة مصنّفة ومفصولة" },
  { href: "/tawhid", title: seoNavLabel("/tawhid", "التوحيد والعقيدة"), description: "أنواع التوحيد وأركان الإيمان والأسماء الحسنى على منهج أهل السنة" },
  { href: "/learn/aqeedat-ahl-sunnah", title: seoNavLabel("/learn/aqeedat-ahl-sunnah", "عقيدة أهل السنة والجماعة"), description: "معالم المنهج: التلقي والإيمان والصفات والصحابة والقدر" },
  { href: "/islamic-sects", title: seoNavLabel("/islamic-sects", "الفرق والمذاهب"), description: "عرض تاريخي للفرق مع بيان موقف أهل السنة" },
  { href: "/daily-wird", title: seoNavLabel("/daily-wird", "الورد اليومي"), description: "تتبع صفحات القرآن اليومية مع السلسلة المتواصلة" },
  { href: "/salah-guide",   title: seoNavLabel("/salah-guide", "دليل الصلاة الكامل"),  description: "الشروط والأركان وكيفية الصلاة والمبطلات والخشوع وفضائل الصلاة الخمس" },
  { href: "/prophets", title: seoNavLabel("/prophets", "قصص الأنبياء"), description: "الأنبياء الخمسة والعشرون في القرآن — نبذات وعبر" },
  { href: "/nations", title: seoNavLabel("/nations", "الأمم السابقة"), description: "قصص الأمم في القرآن — العِبر والعقوبات والدروس" },
  { href: "/fiqh", title: seoNavLabel("/fiqh", "الفقه الإسلامي"), description: "الأحكام والأسئلة والمجمع الفقهي" },
  { href: "/seerah", title: seoNavLabel("/seerah", "السيرة النبوية"), description: "حياة النبي محمد ﷺ من المولد إلى الوفاة" },
  { href: "/prophetic-medicine", title: seoNavLabel("/prophetic-medicine", "الطب النبوي"), description: "ما ثبت في السنة من التداوي والوقاية" },
  { href: "/occasions-lessons", title: seoNavLabel("/occasions-lessons", "المناسبات والدروس"), description: "مناسبات وتقويم دروس" },
  { href: "/assistant", title: seoNavLabel("/assistant", "المساعد العلمي"), description: "إرشاد داخل التطبيق" },
  { href: "/islamic-directory", title: seoNavLabel("/islamic-directory", "الدليل الإسلامي"), description: "مؤسسات ومساجد ومشاهد" },
  { href: "/learning/paths", title: seoNavLabel("/learning/paths", "المسارات العلمية"), description: "تعلم منظم من المبتدئ للمتقدم" },
  { href: "/my-learning", title: seoNavLabel("/my-learning", "حسابي"), description: "تقدمك وإنجازاتك" },
  { href: "/quiz", title: seoNavLabel("/quiz", "لعبة سين جيم"), description: "اختبر معلوماتك من خلال لعبة أسئلة وأجوبة ممتعة ومتدرجة" },
  { href: "/scholars",     title: seoNavLabel("/scholars", "أعلام الإسلام"),        description: `${COUNTS.scholars} عالِمًا من الأئمة الأربعة حتى العلماء المعاصرين` },
  { href: "/asma-husna",  title: seoNavLabel("/asma-husna", "الأسماء الحسنى"),       description: "أسماء الله التسعة والتسعون — كل اسم بمعناه وآيته ومنفعته" },
  { href: "/akhlaq",     title: seoNavLabel("/akhlaq", "مكارم الأخلاق"),    description: "أخلاق إسلامية مع آيات وأحاديث وأقوال العلماء والتطبيق العملي" },
  { href: "/adhkar",     title: seoNavLabel("/adhkar", "الأذكار والأدعية"), description: "أذكار يومية وأدعية مأثورة مع المصدر قدر الإمكان" },
  { href: "/arkan",      title: seoNavLabel("/arkan", "أركان الإسلام الخمسة"),        description: "الأركان الخمسة مع الأدلة القرآنية والنبوية والتفاصيل الفقهية وأقوال العلماء" },
  { href: "/arkan-iman",    title: seoNavLabel("/arkan-iman", "أركان الإيمان الستة"),        description: "الأركان الستة مع أدلة القرآن والسنة وأقوال العلماء: الإيمان بالله والملائكة والكتب" },
  { href: "/hadith-science", title: seoNavLabel("/hadith-science", "مصطلح الحديث"),       description: "مصطلحات علوم الحديث: أنواع الأحاديث والسند والراوي والجرح والتعديل والكتب الستة" },
  { href: "/madhahib",        title: seoNavLabel("/madhahib", "المذاهب الفقهية"),    description: "المذاهب الأربعة: الحنفي والمالكي والشافعي والحنبلي — مناهجها ومصادرها وانتشارها وأبرز مصنفاتها" },
  { href: "/sunan-yawmiyya",  title: seoNavLabel("/sunan-yawmiyya", "السنن اليومية"),       description: "دليل عملي لتطبيق السنن النبوية في الحياة اليومية مع مؤشر تتبع التقدم" },
  { href: "/hikam-salaf",     title: seoNavLabel("/hikam-salaf", "حكم السلف"),           description: "من أقوال الحسن البصري وابن تيمية وابن القيم والشافعي وغيرهم — بحث وحفظ ونسخ" },
  { href: "/zakat",           title: seoNavLabel("/zakat", "الزكاة وأحكامها"),     description: "دليل الزكاة الشامل: أنواعها وشروطها ونصابها ومصارفها مع حاسبة مبسطة" },
  { href: "/sawm",            title: seoNavLabel("/sawm", "الصيام وأحكامه"),      description: "دليل شامل لأنواع الصيام وشروطه ومفطراته والمعذورين وفضائل رمضان" },
  { href: "/hajj",            title: seoNavLabel("/hajj", "الحج والعمرة"),        description: "دليل شامل لمناسك الحج والعمرة: الأركان والواجبات والمشاعر ومحظورات الإحرام" },
  { href: "/tahara",          title: seoNavLabel("/tahara", "الطهارة وأحكامها"),   description: "الوضوء والغسل والتيمم وأنواع المياه والنجاسات — شروط ونواقض وكيفية" },
  { href: "/fadail-aamal",   title: seoNavLabel("/fadail-aamal", "فضائل الأعمال"),      description: "أحاديث في فضائل الصلاة والصيام والقرآن والذكر والصدقة والأخلاق" },
  { href: "/janaza",         title: seoNavLabel("/janaza", "أحكام الجنائز"),      description: "دليل شامل لما يجب على المسلمين تجاه موتاهم من الغسل والتكفين والصلاة والدفن" },
  { href: "/sahabah",        title: seoNavLabel("/sahabah", "أعلام الصحابة الكرام"), description: "موسوعة كبار الصحابة رضي الله عنهم: سيرتهم وفضائلهم وإرثهم في الإسلام" },
  { href: "/tawba",          title: seoNavLabel("/tawba", "التوبة والاستغفار"),   description: "شروط التوبة النصوح وأنواعها وأفضل صيغ الاستغفار المأثورة وآثارها العظيمة" },
  { href: "/memorization", title: seoNavLabel("/memorization", "الحفظ والمراجعة"), description: "اختبارات وخطط الحفظ" },
  { href: "/tafsir",        title: seoNavLabel("/tafsir", "علم التفسير"),            description: "أنواع التفسير وأصوله وأشهر كتب المفسرين مع روابط المكتبة والمصحف" },
  { href: "/mawarith",      title: seoNavLabel("/mawarith", "المواريث والفرائض"),   description: "حصص الورثة الشرعية وأسباب الإرث وموانعه وأحكام العَصَبة والحجب والعَوْل والردّ" },
  { href: "/duas-quran",    title: seoNavLabel("/duas-quran", "أدعية القرآن الكريم"),  description: "أدعية قرآنية مأثورة: دعاء الأنبياء والمؤمنين مع سياقها وفوائدها" },
  { href: "/quran-knowledge", title: seoNavLabel("/quran-knowledge", "القرآن وعلومه"), description: "فهرس وعلوم وأسباب وقصص" },
  ] as const;

/** أقسام «المزيد» بعد تطبيق سياسة الإخفاء/الدمج. */
export const HOME_MORE_SECTIONS = filterNavItems([...HOME_MORE_SECTIONS_RAW]);

/** PRIMARY_NAV kept for legacy compatibility */
export const PRIMARY_NAV = PRIMARY_NAV_ITEMS;
