import type { LucideIcon } from "lucide-react";
import { seoNavLabel } from "@/lib/seo-nav-labels";
import {
  BookMarked,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  Clock,
  Compass,
  Droplets,
  GraduationCap,
  Heart,
  Landmark,
  Layers,
  Lightbulb,
  Monitor,
  Moon,
  RotateCw,
  Scale,
  Scroll,
  Sparkles,
  Star,
  Target,
  Upload,
  Users,
  Wrench,
} from "lucide-react";
import { filterNavItems } from "@/lib/nav-visibility";

/* ── روابط الوصول السريع ── */
/* إجراءات سريعة مختصرة — 4 عناصر فقط (إعادة هيكلة الرئيسية، الأولوية 3):
   أكمل وردك / تابع تعلّمك / اختبر معلوماتك / أذكار اليوم، بالحرف كما ورد
   بالتكليف. القائمة الطويلة السابقة (١٩ رابطًا) كانت تكرارًا شبه كامل
   لتبويب "المزيد" في الشريط السفلي — لا حذف وظيفة، كل تلك الروابط تبقى
   متاحة عبر "المزيد" (MoreBottomSheet) أو /sitemap. */
export const QUICK_LINKS: { href: string; Icon: LucideIcon; label: string; desc: string }[] = [
  { href: "/daily-wird", Icon: Star,          label: seoNavLabel("/daily-wird", "أكمل وردك"),       desc: "الورد اليومي" },
  { href: "/lessons",    Icon: GraduationCap, label: seoNavLabel("/lessons", "الدروس"),     desc: "الدروس والدورات" },
  { href: "/quiz",       Icon: Target,        label: seoNavLabel("/quiz", "لعبة سين جيم"),  desc: "مسابقة معرفية" },
  { href: "/adhkar",     Icon: RotateCw,      label: seoNavLabel("/adhkar", "أذكار اليوم"),     desc: "صباح ومساء ونوم" },
];


/* ── المميزات البارزة — ٦ أبواب رئيسية فقط (مطابقة IA_HOME_PRIMARY) ── */
export const FEATURED: { href: string; Icon: LucideIcon; title: string; desc: string; cta: string }[] = [
  { href: "/quran-hub", Icon: BookMarked, title: seoNavLabel("/quran-hub", "القرآن الكريم"), desc: "المصحف والتجويد والحفظ وعلوم القرآن", cta: "افتح" },
  { href: "/lessons", Icon: GraduationCap, title: seoNavLabel("/lessons", "الدروس والدورات"), desc: "دروس ودورات علمية منظمة", cta: "افتح" },
  { href: "/prayer-times", Icon: Clock, title: seoNavLabel("/prayer-times", "مواقيت الصلاة"), desc: "المواقيت والقبلة والأذان", cta: "افتح" },
  { href: "/fiqh", Icon: Scale, title: seoNavLabel("/fiqh", "الفقه والأحكام"), desc: "الأحكام والقواعد والمجامع تحت باب واحد", cta: "افتح" },
  { href: "/adhkar", Icon: RotateCw, title: seoNavLabel("/adhkar", "الأذكار اليومية"), desc: "أذكار الصباح والمساء وما بينهما", cta: "افتح" },
  { href: "/more", Icon: Layers, title: seoNavLabel("/more", "المزيد من العلوم"), desc: "مكتبة وحديث وأعلام وسين جيم", cta: "افتح" },
];

/* ── أقسام مصنّفة ── */
export type CatItem = { href: string; Icon: LucideIcon; title: string; desc: string };
export type FeatureCat = { id: string; Icon: LucideIcon; label: string; items: CatItem[] };

const FEATURE_CATS_RAW: FeatureCat[] = [
  {
    id: "seerah",
    Icon: Moon,
    label: "السيرة والتاريخ",
    items: [
      { href: "/seerah",          Icon: Moon,     title: seoNavLabel("/seerah", "السيرة النبوية"),    desc: "حياته ﷺ من الميلاد إلى الوفاة" },
      { href: "/shamael",         Icon: Star,     title: seoNavLabel("/shamael", "صفةُ سيِّد الخلقِ ﷺ"),  desc: "صفته ﷺ خَلقاً وخُلُقاً وهَدياً من أصحّ الروايات" },
      { href: "/sahabah",         Icon: Users,    title: seoNavLabel("/sahabah", "أعلام الصحابة"),     desc: "12 صحابياً بالتفصيل: سيرة وإرث وفضل" },
      { href: "/prophets",        Icon: Star,     title: seoNavLabel("/prophets", "قصص الأنبياء"),     desc: "من آدم إلى محمد ﷺ — ٢٥ نبيًا بقصصهم وعبرهم" },
      { href: "/janna-naar",      Icon: Sparkles, title: seoNavLabel("/janna-naar", "صفة الجنة"),  desc: "أبوابها وأنهارها وأسباب دخولها وأدعية الآخرة" },
      { href: "/alamat-saah",    Icon: Star,     title: seoNavLabel("/alamat-saah", "علامات الساعة"),      desc: "الصغرى والكبرى العشر والترتيب وكيف نستعد" },
      { href: "/malaika",       Icon: Sparkles, title: seoNavLabel("/malaika", "الملائكة في الإسلام"), desc: "أسماؤهم ومهامهم وصفاتهم وفضائلهم من الوحي" },
      { href: "/wasaya-nabawiyya", Icon: Scroll,  title: seoNavLabel("/wasaya-nabawiyya", "الوصايا النبوية"),    desc: "10 وصايا جامعة ووصايا خاصة بالصحابة مع التطبيق" },
      { href: "/raqaiq",          Icon: Heart,  title: seoNavLabel("/raqaiq", "الرقائق والزهد"),      desc: "مواعظ تُليِّن القلوب وأقوال كبار الزاهدين والمحاسبة اليومية" },
    ],
  },
  {
    id: "fiqh",
    Icon: Scale,
    label: "الفقه والأحكام",
    items: [
      { href: "/fiqh",               Icon: Scale,        title: seoNavLabel("/fiqh", "الفقه الإسلامي"),  desc: "بوابة الأحكام والأسئلة والمجمع الفقهي" },
      { href: "/tawhid",             Icon: BookMarked,   title: seoNavLabel("/tawhid", "التوحيد"),            desc: "العقيدة الإسلامية" },
      { href: "/arkan",              Icon: Landmark,     title: seoNavLabel("/arkan", "أركان الإسلام الخمسة"),     desc: "الأركان الخمسة مع الأدلة والتفاصيل" },
      { href: "/arkan-iman",         Icon: Star,         title: seoNavLabel("/arkan-iman", "أركان الإيمان الستة"),     desc: "الأركان الستة مع الأدلة وأقوال العلماء" },
      { href: "/asma-husna",         Icon: Star,         title: seoNavLabel("/asma-husna", "الأسماء الحسنى"),    desc: "99 اسماً لله بمعانيها ومنافعها" },
      { href: "/akhlaq",             Icon: Heart,        title: seoNavLabel("/akhlaq", "مكارم الأخلاق"), desc: "مكارم الأخلاق مع الآيات والأحاديث" },
      { href: "/zakat",               Icon: Scale,        title: seoNavLabel("/zakat", "الزكاة وأحكامها"),    desc: "دليل الزكاة مع حاسبة وأحكام الأنواع السبعة" },
      { href: "/sawm",                Icon: Moon,         title: seoNavLabel("/sawm", "الصيام وأحكامه"),      desc: "أنواع الصيام وشروطه ومفطراته وفضائل رمضان" },
      { href: "/hajj",                Icon: Landmark,     title: seoNavLabel("/hajj", "الحج والعمرة"),         desc: "أركان الحج وواجباته والمشاعر ومحظورات الإحرام" },
      { href: "/tahara",              Icon: Droplets,     title: seoNavLabel("/tahara", "الطهارة وأحكامها"),     desc: "الوضوء والغسل والتيمم والنجاسات وأنواع المياه" },
      { href: "/janaza",              Icon: BookOpen,     title: seoNavLabel("/janaza", "أحكام الجنائز"),         desc: "الغسل والتكفين والصلاة والدفن والتعزية" },
      { href: "/mawarith",            Icon: Scale,        title: seoNavLabel("/mawarith", "المواريث والفرائض"),      desc: "حصص الورثة والعَصَبة والحجب والعَوْل والردّ" },
      { href: "/salah-guide",         Icon: Scroll,       title: seoNavLabel("/salah-guide", "دليل الصلاة الكامل"),     desc: "الشروط والأركان والخشوع والمبطلات وفضائل الصلاة" },
    ],
  },
  {
    id: "worship",
    Icon: RotateCw,
    label: "العبادة والأذكار",
    items: [
      { href: "/adhkar",          Icon: Star,        title: seoNavLabel("/adhkar", "الأذكار والأدعية"),     desc: "أذكار الصباح والمساء والأدعية المأثورة" },
      { href: "/sunan-yawmiyya",  Icon: Check,       title: seoNavLabel("/sunan-yawmiyya", "السنن النبوية"),        desc: "25+ سنة يومية مع تتبع التطبيق" },
      { href: "/duas-quran",  Icon: BookOpen,    title: seoNavLabel("/duas-quran", "أدعية القرآن"),        desc: "أدعية قرآنية للأنبياء والمؤمنين" },
      { href: "/fawaid",       Icon: Lightbulb,   title: seoNavLabel("/fawaid", "الفوائد الدينية"),      desc: "فوائد علمية منتقاة" },
      { href: "/hikam-salaf",  Icon: BookOpen,    title: seoNavLabel("/hikam-salaf", "حكم السلف الصالح"),     desc: "أقوال الأئمة والصحابة والتابعين" },
      { href: "/fadail-aamal",      Icon: Star,      title: seoNavLabel("/fadail-aamal", "فضائل الأعمال"),         desc: "أحاديث في فضائل العبادات والأخلاق" },
      { href: "/adab-talab-ilm",   Icon: GraduationCap,  title: seoNavLabel("/adab-talab-ilm", "آداب طالب العلم"),      desc: "دليل طالب العلم من الفضل إلى الكتب المقررة" },
      { href: "/tawba",         Icon: RotateCw,    title: seoNavLabel("/tawba", "التوبة والاستغفار"),          desc: "شروط التوبة النصوح وأفضل صيغ الاستغفار" },
      { href: "/amr-bil-maruf", Icon: Scroll,      title: seoNavLabel("/amr-bil-maruf", "الأمر بالمعروف والنهي عن المنكر"), desc: "مراتبه الثلاث وشروطه وأحكامه الفقهية" },
      { href: "/daily-wird",  Icon: BookOpen,    title: seoNavLabel("/daily-wird", "الورد اليومي"),         desc: "ختم يومي منتظم للقرآن" },
      { href: "/occasions-lessons", Icon: CalendarDays, title: seoNavLabel("/occasions-lessons", "المناسبات والدروس"), desc: "مناسبات وتقويم دروس" },
      { href: "/tasbih",      Icon: RotateCw,    title: seoNavLabel("/tasbih", "التسبيح والذكر"),       desc: "عداد تسبيح إلكتروني" },
    ],
  },
  {
    id: "tools",
    Icon: Wrench,
    label: "أدوات التعلم",
    items: [
      { href: "/my-learning",     Icon: Layers,      title: seoNavLabel("/my-learning", "حسابي"),   desc: "تقدمك والبطاقات المراجعة" },
      { href: "/quiz",            Icon: Target,      title: seoNavLabel("/quiz", "لعبة سين جيم"),   desc: "اختبر معلوماتك من خلال لعبة أسئلة وأجوبة ممتعة ومتدرجة" },
      { href: "/assistant",       Icon: Bot,         title: seoNavLabel("/assistant", "المساعد العلمي"),    desc: "إرشاد فوري بالذكاء الاصطناعي" },
      { href: "/occasions-lessons", Icon: CalendarDays, title: seoNavLabel("/occasions-lessons", "المناسبات والدروس"), desc: "التواريخ والمناسبات" },
      { href: "/islamic-directory", Icon: Landmark, title: seoNavLabel("/islamic-directory", "الدليل الإسلامي"), desc: "مؤسسات ومساجد ومشاهد" },
      { href: "/universities", Icon: GraduationCap, title: seoNavLabel("/universities", "دليل الجامعات الشرعية"), desc: "جامعات وكليات الدراسات الشرعية حول العالم" },
      { href: "/academic-research", Icon: Scroll, title: seoNavLabel("/academic-research", "رسائل الماجستير والدكتوراه"), desc: "مكتبة الأبحاث والرسائل الشرعية الموثّقة" },
      { href: "/scholars",        Icon: Users,       title: seoNavLabel("/scholars", "أعلام الإسلام"),                desc: "مئات العلماء عبر التاريخ بالتخصص والحقبة" },
    ],
  },
  {
    id: "quran-hub",
    Icon: BookMarked,
    label: "القرآن الكريم",
    items: [
      { href: "/mushaf",               Icon: BookOpen,     title: seoNavLabel("/mushaf", "القرآن"), desc: "المصحف الشريف" },
      { href: "/quran-hub",      Icon: BookMarked,   title: seoNavLabel("/quran-hub", "مركز القرآن"), desc: "المصحف والتجويد والحفظ وعلوم القرآن" },
      { href: "/tafsir",               Icon: BookOpen,     title: seoNavLabel("/tafsir", "علم التفسير"),            desc: "أنواع التفسير وأصوله وأشهر كتب المفسرين" },
      { href: "/quran-circles",        Icon: Users,        title: seoNavLabel("/quran-circles", "حلقات التحفيظ"),   desc: "دليل حلقات القرآن في الكويت والمنصات الموثوقة" },
    ],
  },
  {
    id: "digital",
    Icon: Monitor,
    label: "الأدوات الرقمية",
    items: [
      { href: "/qibla",        Icon: Compass,     title: seoNavLabel("/qibla", "اتجاه القبلة"),    desc: "بوصلة لمعرفة اتجاه الكعبة" },
      { href: "/prayer-times", Icon: Clock,       title: seoNavLabel("/prayer-times", "مواقيت الصلاة"),   desc: "أوقات دقيقة للكويت" },
      { href: "/submit",       Icon: Upload,      title: seoNavLabel("/submit", "أضف محتوى"),       desc: "ساهم في إثراء المنصة" },
    ],
  },
];

/** كتالوج الرئيسية بعد تطبيق سياسة الإخفاء/الدمج. */
export const FEATURE_CATS: FeatureCat[] = FEATURE_CATS_RAW.map((cat) => ({
  ...cat,
  items: filterNavItems(cat.items),
})).filter((cat) => cat.items.length > 0);

