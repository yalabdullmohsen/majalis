import type { LucideIcon } from "lucide-react";
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
  HelpCircle,
  Landmark,
  Layers,
  Lightbulb,
  Map,
  Mic2,
  Monitor,
  Moon,
  Network,
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
  { href: "/daily-wird", Icon: Star,          label: "أكمل وردك",       desc: "الورد اليومي" },
  { href: "/lessons",    Icon: GraduationCap, label: "تابع تعلّمك",     desc: "الدروس والدورات" },
  { href: "/quiz",       Icon: Target,        label: "اختبر معلوماتك",  desc: "مسابقة معرفية" },
  { href: "/adhkar",     Icon: RotateCw,      label: "أذكار اليوم",     desc: "صباح ومساء ونوم" },
];


/* ── المميزات البارزة (4 بطاقات كبيرة) ── */
export const FEATURED: { href: string; Icon: LucideIcon; title: string; desc: string; cta: string }[] = [
  { href: "/lessons", Icon: GraduationCap, title: "الدروس العلمية",   desc: "دروس ومحاضرات مجدولة لهذا الأسبوع من علماء الكويت",       cta: "شاهد الدروس" },
  { href: "/hadith",  Icon: Scroll,        title: "الأحاديث النبوية", desc: "أحاديث موثقة ومسندة مع الشرح والتخريج",                   cta: "تصفح الأحاديث" },
  { href: "/library", Icon: BookOpen,      title: "المكتبة العلمية",  desc: "كتب شرعية ومتون علمية في الفقه والعقيدة والتفسير والحديث", cta: "استعرض الكتب" },
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
      { href: "/seerah",          Icon: Moon,     title: "السيرة النبوية",    desc: "حياته ﷺ من الميلاد إلى الوفاة" },
      { href: "/shamael",         Icon: Star,     title: "الشمائل المحمدية",  desc: "صفته ﷺ خَلقاً وخُلُقاً وهَدياً من أصحّ الروايات" },
      { href: "/sahabah",         Icon: Users,    title: "أعلام الصحابة",     desc: "12 صحابياً بالتفصيل: سيرة وإرث وفضل" },
      { href: "/anbiya",          Icon: Star,     title: "الأنبياء والرسل",   desc: "٢٥ نبياً مذكورًا بالاسم في القرآن، بقصصهم ودروسها" },
      { href: "/janna-naar",      Icon: Sparkles, title: "صفة الجنة والنار",  desc: "أبوابها وأنهارها وأسباب دخولها وأدعية الآخرة" },
      { href: "/alamat-saah",    Icon: Star,     title: "علامات الساعة",      desc: "الصغرى والكبرى العشر والترتيب وكيف نستعد" },
      { href: "/malaika",       Icon: Sparkles, title: "الملائكة في الإسلام", desc: "أسماؤهم ومهامهم وصفاتهم وفضائلهم من الوحي" },
      { href: "/wasaya-nabawiyya", Icon: Scroll,  title: "الوصايا النبوية",    desc: "10 وصايا جامعة ووصايا خاصة بالصحابة مع التطبيق" },
      { href: "/raqaiq",          Icon: Heart,  title: "الرقائق والزهد",      desc: "مواعظ تُليِّن القلوب وأقوال كبار الزاهدين والمحاسبة اليومية" },
      { href: "/prophets",        Icon: Star,     title: "قصص الأنبياء",     desc: "من آدم إلى محمد ﷺ" },
      { href: "/stories",         Icon: Map,      title: "القصص الإسلامية",  desc: "سير الصحابة والفتوحات ووقائع من التاريخ الإسلامي" },
    ],
  },
  {
    id: "fiqh",
    Icon: Scale,
    label: "الفقه والأحكام",
    items: [
      { href: "/qa",                 Icon: HelpCircle,   title: "الأسئلة والأجوبة",  desc: "أسئلة شرعية موثقة" },
      { href: "/rulings",            Icon: Scale,        title: "الأحكام الشرعية",   desc: "موسوعة الفقه والعبادات" },
      { href: "/tawhid",             Icon: BookMarked,   title: "التوحيد",            desc: "العقيدة الإسلامية" },
      { href: "/arkan",              Icon: Landmark,     title: "أركان الإسلام",     desc: "الأركان الخمسة مع الأدلة والتفاصيل" },
      { href: "/arkan-iman",         Icon: Star,         title: "أركان الإيمان",     desc: "الأركان الستة مع الأدلة وأقوال العلماء" },
      { href: "/asma-husna",         Icon: Star,         title: "الأسماء الحسنى",    desc: "99 اسماً لله بمعانيها ومنافعها" },
      { href: "/akhlaq",             Icon: Heart,        title: "الأخلاق الإسلامية", desc: "مكارم الأخلاق مع الآيات والأحاديث" },
      { href: "/hadith-science",      Icon: Scroll,       title: "مصطلح الحديث",      desc: "مصطلحات علوم الحديث والإسناد" },
      { href: "/madhahib",            Icon: Scale,        title: "المذاهب الفقهية",    desc: "المذاهب الأربعة مناهجاً ومصادراً وانتشاراً" },
      { href: "/zakat",               Icon: Scale,        title: "الزكاة وأحكامها",    desc: "دليل الزكاة مع حاسبة وأحكام الأنواع السبعة" },
      { href: "/sawm",                Icon: Moon,         title: "الصيام وأحكامه",      desc: "أنواع الصيام وشروطه ومفطراته وفضائل رمضان" },
      { href: "/hajj",                Icon: Landmark,     title: "الحج والعمرة",         desc: "أركان الحج وواجباته والمشاعر ومحظورات الإحرام" },
      { href: "/tahara",              Icon: Droplets,     title: "الطهارة وأحكامها",     desc: "الوضوء والغسل والتيمم والنجاسات وأنواع المياه" },
      { href: "/janaza",              Icon: BookOpen,     title: "أحكام الجنائز",         desc: "الغسل والتكفين والصلاة والدفن والتعزية" },
      { href: "/mawarith",            Icon: Scale,        title: "المواريث والفرائض",      desc: "حصص الورثة والعَصَبة والحجب والعَوْل والردّ" },
      { href: "/salah-guide",         Icon: Scroll,       title: "دليل الصلاة الكامل",     desc: "الشروط والأركان والخشوع والمبطلات وفضائل الصلاة" },
      { href: "/fiqh-qawaid",         Icon: Scale,        title: "القواعد الفقهية الكبرى", desc: "القواعد الخمس الكبرى وفروعها وضوابطها وتطبيقاتها المعاصرة" },
      { href: "/academic-research",  Icon: GraduationCap, title: "الأبحاث العلمية", desc: "رسائل وأبحاث أكاديمية" },
    ],
  },
  {
    id: "worship",
    Icon: RotateCw,
    label: "العبادة والأذكار",
    items: [
      { href: "/adhkar",          Icon: Star,        title: "الأذكار",              desc: "أذكار الصباح والمساء" },
      { href: "/sunan-yawmiyya",  Icon: Check,       title: "السنن النبوية",        desc: "25+ سنة يومية مع تتبع التطبيق" },
      { href: "/duas",        Icon: Heart,       title: "الأدعية الشرعية",    desc: "أدعية مأثورة مع مصدر كل دعاء" },
      { href: "/duas-quran",  Icon: BookOpen,    title: "أدعية القرآن",        desc: "أدعية قرآنية للأنبياء والمؤمنين" },
      { href: "/fawaid",       Icon: Lightbulb,   title: "الفوائد الدينية",      desc: "فوائد علمية منتقاة" },
      { href: "/hikam-salaf",  Icon: BookOpen,    title: "حكم السلف الصالح",     desc: "أقوال الأئمة والصحابة والتابعين" },
      { href: "/fadail-aamal",      Icon: Star,      title: "فضائل الأعمال",         desc: "أحاديث في فضائل العبادات والأخلاق" },
      { href: "/islamic-glossary",  Icon: BookOpen,       title: "المصطلحات الإسلامية",  desc: "قاموس شامل للمصطلحات في ستة علوم شرعية" },
      { href: "/adab-talab-ilm",   Icon: GraduationCap,  title: "آداب طالب العلم",      desc: "دليل طالب العلم من الفضل إلى الكتب المقررة" },
      { href: "/tawba",         Icon: RotateCw,    title: "التوبة والاستغفار",          desc: "شروط التوبة النصوح وأفضل صيغ الاستغفار" },
      { href: "/amr-bil-maruf", Icon: Scroll,      title: "الأمر بالمعروف والنهي عن المنكر", desc: "مراتبه الثلاث وشروطه وأحكامه الفقهية" },
      { href: "/daily-wird",  Icon: BookOpen,    title: "الورد اليومي",         desc: "ختم يومي منتظم للقرآن" },
      { href: "/occasions",   Icon: CalendarDays, title: "المناسبات الإسلامية", desc: "أحداث دينية مع أعمالها" },
      { href: "/tasbih",      Icon: RotateCw,    title: "التسبيح والذكر",       desc: "عداد تسبيح إلكتروني" },
    ],
  },
  {
    id: "tools",
    Icon: Wrench,
    label: "أدوات التعلم",
    items: [
      { href: "/learning/paths",  Icon: Map,         title: "المسارات العلمية",  desc: "مسار من المبتدئ إلى المتقدم" },
      { href: "/flashcards",      Icon: Layers,      title: "بطاقات المراجعة",   desc: "مراجعة ذكية" },
      { href: "/quiz",            Icon: Target,      title: "لعبة سين جيم – أسئلة وأجوبة",   desc: "اختبر معلوماتك من خلال لعبة أسئلة وأجوبة ممتعة ومتدرجة" },
      { href: "/assistant",       Icon: Bot,         title: "المساعد العلمي",    desc: "إرشاد فوري بالذكاء الاصطناعي" },
      { href: "/calendar",        Icon: CalendarDays, title: "التقويم الهجري",   desc: "التواريخ والأيام المميزة" },
      { href: "/knowledge-graph", Icon: Network,     title: "استكشف المعرفة",              desc: "شبكة المعرفة الإسلامية وعلاقاتها" },
      { href: "/institutions",    Icon: Landmark,    title: "المؤسسات الإسلامية",            desc: "المجامع والجامعات والمراكز البحثية الكبرى" },
      { href: "/scholars",        Icon: Users,       title: "أعلام العلماء",                desc: "مئات العلماء عبر التاريخ بالتخصص والحقبة" },
    ],
  },
  {
    id: "quran-hub",
    Icon: BookMarked,
    label: "القرآن الكريم",
    items: [
      { href: "/quran-hub",            Icon: BookMarked, title: "مركز القرآن",       desc: "جميع أقسام القرآن في مكان واحد" },
      { href: "/quran/recitation-test-ai", Icon: Bot,    title: "اختبار التسميع بالذكاء الاصطناعي", desc: "سمّع من حفظك واستمع لتلاوتك لحظيًا" },
      { href: "/quran/surah-stories",  Icon: Star,       title: "قصص القرآن",        desc: "أسباب النزول و١١٤ سورة" },
      { href: "/quran/tajweed",        Icon: Mic2,       title: "علم التجويد",        desc: "أحكام التجويد الشاملة" },
      { href: "/ulum-quran",           Icon: GraduationCap, title: "علوم القرآن",      desc: "النزول والجمع والإعجاز والتفسير" },
    ],
  },
  {
    id: "digital",
    Icon: Monitor,
    label: "الأدوات الرقمية",
    items: [
      { href: "/qibla",        Icon: Compass,     title: "اتجاه القبلة",    desc: "بوصلة لمعرفة اتجاه الكعبة" },
      { href: "/prayer-times", Icon: Clock,       title: "مواقيت الصلاة",   desc: "أوقات دقيقة للكويت" },
      { href: "/submit",       Icon: Upload,      title: "أضف محتوى",       desc: "ساهم في إثراء المنصة" },
    ],
  },
];

/** كتالوج الرئيسية بعد تطبيق سياسة الإخفاء/الدمج. */
export const FEATURE_CATS: FeatureCat[] = FEATURE_CATS_RAW.map((cat) => ({
  ...cat,
  items: filterNavItems(cat.items),
})).filter((cat) => cat.items.length > 0);

