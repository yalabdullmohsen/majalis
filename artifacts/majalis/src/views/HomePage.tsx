import { lazy, Suspense, useEffect, useState } from "react";
import contentCounts from "@/data/content-counts.json";
import { applyPageSeo } from "@/lib/seo";
import { Link } from "wouter";
import { useDailyContext } from "@/lib/daily-context";
import { useAuth } from "@/components/AuthProvider";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";
import { History } from "lucide-react";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeSawmReminder } from "@/components/home/HomeSawmReminder";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeContinueWidget } from "@/components/home/HomeContinueWidget";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomeMajlisToday } from "@/components/home/HomeMajlisToday";
import { FridayBanner } from "@/components/FridayBanner";
import { HijriSacredMonthBanner } from "@/components/HijriSacredMonthBanner";
import { getHijriDateString } from "@/lib/hijri-utils";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerTimesPayload } from "@/lib/prayer-times";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { toArabicDigits } from "@/lib/utils";
import { HomeCustomizeSheet } from "@/components/home/HomeCustomizeSheet";
import {
  HOME_WIDGET_DEFS,
  getLocalHomepagePrefs,
  saveLocalHomepagePrefs,
  fetchRemoteHomepagePrefs,
  visibleWidgetOrder,
  type HomepagePrefs,
} from "@/lib/homepage-layout";
import {
  BookMarked, BookOpen, Bot, CalendarDays, Car, Check, Clock,
  Compass, Droplets, FlaskConical, GraduationCap, Heart, HelpCircle, Landmark, Layers,
  Lightbulb, Map, Mic2, Monitor, Moon, Network,
  Radio, RotateCw, Scale, Scroll, Sparkles, Star, Target, Upload, Users, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// الودجتات الاختيارية لا تدخل حزمة الرئيسية للمستخدم الجديد. تُحمَّل فقط
// إذا فعّلها المستخدم من شاشة التخصيص، مع بقاء الوظيفة والحالة المحفوظة.
const HomeCompactPrayer = lazy(() => import("@/components/home/HomeCompactPrayer").then((m) => ({ default: m.HomeCompactPrayer })));
const HomeDailyCorner = lazy(() => import("@/components/home/HomeDailyCorner").then((m) => ({ default: m.HomeDailyCorner })));
const HomeDailyBenefits = lazy(() => import("@/components/home/HomeDailyBenefits").then((m) => ({ default: m.HomeDailyBenefits })));
const HomeUpcomingEvents = lazy(() => import("@/components/home/HomeUpcomingEvents").then((m) => ({ default: m.HomeUpcomingEvents })));
const HomeSunnahByTime = lazy(() => import("@/components/home/HomeSunnahByTime").then((m) => ({ default: m.HomeSunnahByTime })));
const HomeIslamicOccasions = lazy(() => import("@/components/home/HomeIslamicOccasions").then((m) => ({ default: m.HomeIslamicOccasions })));
const HomeLatestUpdates = lazy(() => import("@/components/home/HomeLatestUpdates").then((m) => ({ default: m.HomeLatestUpdates })));
const HomePrayerRanks = lazy(() => import("@/components/home/HomePrayerRanks").then((m) => ({ default: m.HomePrayerRanks })));
const HomeFeaturedLibrary = lazy(() => import("@/components/home/HomeFeaturedLibrary").then((m) => ({ default: m.HomeFeaturedLibrary })));
const HomeQuizCard = lazy(() => import("@/components/home/HomeQuizCard").then((m) => ({ default: m.HomeQuizCard })));
const HomeAsmaCard = lazy(() => import("@/components/home/HomeAsmaCard").then((m) => ({ default: m.HomeAsmaCard })));
const HomeWeekStreak = lazy(() => import("@/components/home/HomeWeekStreak").then((m) => ({ default: m.HomeWeekStreak })));
const HomeNawawiHadith = lazy(() => import("@/components/home/HomeNawawiHadith").then((m) => ({ default: m.HomeNawawiHadith })));
const HomeInterestingTopics = lazy(() => import("@/components/home/HomeInterestingTopics").then((m) => ({ default: m.HomeInterestingTopics })));
const HomeMindMapSection = lazy(() => import("@/components/home/HomeMindMapSection").then((m) => ({ default: m.HomeMindMapSection })));

/* ── روابط الوصول السريع ── */
/* إجراءات سريعة مختصرة — 4 عناصر فقط (إعادة هيكلة الرئيسية، الأولوية 3):
   أكمل وردك / تابع تعلّمك / اختبر معلوماتك / أذكار اليوم، بالحرف كما ورد
   بالتكليف. القائمة الطويلة السابقة (١٩ رابطًا) كانت تكرارًا شبه كامل
   لتبويب "المزيد" في الشريط السفلي — لا حذف وظيفة، كل تلك الروابط تبقى
   متاحة عبر "المزيد" (MoreBottomSheet) أو /sitemap. */
const QUICK_LINKS: { href: string; Icon: LucideIcon; label: string; desc: string }[] = [
  { href: "/daily-wird", Icon: Star,          label: "أكمل وردك",       desc: "الورد اليومي" },
  { href: "/lessons",    Icon: GraduationCap, label: "تابع تعلّمك",     desc: "الدروس والدورات" },
  { href: "/quiz",       Icon: Target,        label: "اختبر معلوماتك",  desc: "مسابقة معرفية" },
  { href: "/adhkar",     Icon: RotateCw,      label: "أذكار اليوم",     desc: "صباح ومساء ونوم" },
];


/* ── المميزات البارزة (4 بطاقات كبيرة) ── */
const FEATURED: { href: string; Icon: LucideIcon; title: string; desc: string; cta: string }[] = [
  { href: "/lessons", Icon: GraduationCap, title: "الدروس العلمية",   desc: "دروس ومحاضرات مجدولة لهذا الأسبوع من علماء الكويت",       cta: "شاهد الدروس" },
  { href: "/hadith",  Icon: Scroll,        title: "الأحاديث النبوية", desc: "أحاديث موثقة ومسندة مع الشرح والتخريج",                   cta: "تصفح الأحاديث" },
  { href: "/library", Icon: BookOpen,      title: "المكتبة العلمية",  desc: "كتب شرعية ومتون علمية في الفقه والعقيدة والتفسير والحديث", cta: "استعرض الكتب" },
];

/* ── أقسام مصنّفة ── */
type CatItem = { href: string; Icon: LucideIcon; title: string; desc: string };
type FeatureCat = { id: string; Icon: LucideIcon; label: string; items: CatItem[] };

const FEATURE_CATS: FeatureCat[] = [
  {
    id: "seerah",
    Icon: Moon,
    label: "السيرة والتاريخ",
    items: [
      { href: "/seerah",          Icon: Moon,     title: "السيرة النبوية",    desc: "حياته ﷺ من الميلاد إلى الوفاة" },
      { href: "/shamael",         Icon: Star,     title: "الشمائل المحمدية",  desc: "صفته ﷺ خَلقاً وخُلُقاً وهَدياً من أصحّ الروايات" },
      { href: "/sahabah",         Icon: Users,    title: "أعلام الصحابة",     desc: "12 صحابياً بالتفصيل: سيرة وإرث وفضل" },
      { href: "/anbiya",          Icon: Star,     title: "الأنبياء والرسل",   desc: "٢٥ نبياً بالقصة والمعجزة والدروس" },
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
      { href: "/scholarly-research", Icon: FlaskConical, title: "الباحث الشرعي",     desc: "بحث بالذكاء الاصطناعي" },
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
      { href: "/car-mode",    Icon: Car,         title: "وضع السيارة",          desc: "تلاوات أثناء القيادة" },
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
      { href: "/flashcards",      Icon: Layers,      title: "البطاقات الدعوية",   desc: "مراجعة ذكية" },
      { href: "/quiz",            Icon: Target,      title: "لعبة سؤال وجواب",   desc: "اختبر معلوماتك الإسلامية" },
      { href: "/assistant",       Icon: Bot,         title: "المساعد العلمي",    desc: "إرشاد فوري بالذكاء الاصطناعي" },
      { href: "/calendar",        Icon: CalendarDays, title: "التقويم الهجري",   desc: "التواريخ والأيام المميزة" },
      { href: "/knowledge-graph", Icon: Network,     title: "خارطة المعرفة التفاعلية",     desc: "علاقات المعرفة الإسلامية بالرسم البياني" },
      { href: "/knowledge-map",   Icon: Map,         title: "الخريطة المعرفية 2.0",         desc: "حقول العلوم الشرعية مترابطة" },
      { href: "/mind-map",        Icon: Layers,      title: "الخرائط الذهنية",             desc: "خرائط ذهنية تفاعلية للعلوم الشرعية" },
      { href: "/islam-stats",     Icon: Star,        title: "إحصائيات الإسلام",             desc: "أرقام وحضارة وعلماء — في بيانات مرئية" },
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
      { href: "/quran-radio",          Icon: Radio,      title: "إذاعات القرآن",      desc: "بث مستمر من كبار القراء" },
      { href: "/quran-circles",        Icon: Layers,     title: "حلقات القرآن",       desc: "حلقات الحفظ والمراجعة" },
    ],
  },
  {
    id: "digital",
    Icon: Monitor,
    label: "الأدوات الرقمية",
    items: [
      { href: "/qibla",        Icon: Compass,     title: "اتجاه القبلة",    desc: "بوصلة لمعرفة اتجاه الكعبة" },
      { href: "/prayer-times", Icon: Clock,       title: "مواقيت الصلاة",   desc: "أوقات دقيقة للكويت" },
      { href: "/muezzins",     Icon: Mic2,        title: "مكتبة المؤذنين", desc: "تلاوات وأذان بأجمل الأصوات" },
      { href: "/quran-radio",  Icon: Radio,       title: "إذاعة القرآن",    desc: "بث مستمر للقرآن الكريم" },
      { href: "/mosque-mode",  Icon: Landmark,    title: "وضع المسجد",      desc: "عدّاد الصلاة مع تذكير بالصمت وإطفاء الصوت" },
      { href: "/submit",       Icon: Upload,      title: "أضف محتوى",       desc: "ساهم في إثراء المنصة" },
    ],
  },
];

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <SectionErrorBoundary name={name}>
      <Suspense fallback={<div className="skeleton-base" style={{ minHeight: 96 }} aria-label={`تحميل ${name}`} />}>
        {children}
      </Suspense>
    </SectionErrorBoundary>
  );
}

/** خريطة مُعرِّف القسم القابل للتخصيص ← عرضه. تُستهلَك عبر homepage-layout.ts. */
const WIDGET_RENDERERS: Record<string, () => React.ReactNode> = {
  "lessons": () => (<><HomeUpcomingLessons /><HomeUpcomingCourses /></>),
  "prayer": () => <HomeCompactPrayer />,
  "continue": () => <HomeContinueWidget />,
  "daily-progress": () => <HomeDailyProgress />,
  "week-streak": () => <HomeWeekStreak />,
  "asma": () => <HomeAsmaCard />,
  "hadith": () => <HomeNawawiHadith />,
  "sunnah-time": () => <HomeSunnahByTime />,
  "explore": () => <ExplorePlatformSection />,
  "learning-seasons": () => <HomeLearningSeasonsWidget />,
  "occasions": () => <HomeIslamicOccasions />,
  "latest-updates": () => <HomeLatestUpdates />,
  "library": () => <HomeFeaturedLibrary />,
  "quiz": () => <HomeQuizCard />,
  "daily-corner": () => <HomeDailyCorner />,
  "daily-benefits": () => <HomeDailyBenefits />,
  "upcoming-events": () => <HomeUpcomingEvents />,
  "prayer-ranks": () => <HomePrayerRanks />,
  "interesting-topics": () => <HomeInterestingTopics />,
  "mind-map": () => <HomeMindMapSection />,
};

const WIDGET_LABEL: Record<string, string> = Object.fromEntries(HOME_WIDGET_DEFS.map((w) => [w.id, w.label]));

function RecentPagesBar() {
  const [pages, setPages] = useState<RecentPage[]>([]);
  useEffect(() => { setPages(getRecentPages(6)); }, []);
  if (pages.length < 2) return null;
  return (
    <nav className="hp-recent-bar" aria-label="آخر صفحات زرتَها">
      <span className="hp-recent-bar__label" aria-hidden="true">
        <History size={14} strokeWidth={1.8} />
        زرتَ مؤخراً
      </span>
      <div className="hp-recent-bar__chips">
        {pages.map((p) => (
          <Link key={p.href} href={p.href} className="hp-recent-chip">
            {p.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

const START_STEPS = [
  {
    num: "١",
    title: "اختر مستواك",
    desc: "مبتدئ، متوسط أو متقدم، نصمم لك مسار العلم المناسب",
    href: "/learning/paths",
    cta: "المسارات العلمية",
  },
  {
    num: "٢",
    title: "ابدأ بالأذكار اليومية",
    desc: "أذكار الصباح والمساء وما بينهما، عبادة يومية مستدامة",
    href: "/adhkar",
    cta: "أذكار اليوم",
  },
  {
    num: "٣",
    title: "تابع درساً قريباً",
    desc: "دروس علمية أسبوعية من علماء الكويت، مجانية ومفتوحة",
    href: "/lessons",
    cta: "الدروس القادمة",
  },
  {
    num: "٤",
    title: "دليل طالب العلم المبتدئ",
    desc: "٩ محطات علمية مرتبة من العقيدة إلى التوسع، بروابط مباشرة لكل محطة",
    href: "/start-here",
    cta: "ابدأ من هنا",
  },
];

function StartHereSection() {
  return (
    <section aria-label="ابدأ من هنا" className="home-start-here">
      <div className="hsh-header">
        <span className="hsh-eyebrow">للزائر الجديد</span>
        <h2 className="hsh-title">ابدأ من هنا</h2>
      </div>
      <ol className="hsh-steps">
        {START_STEPS.map((s) => (
          <li key={s.num} className="hsh-step">
            <span className="hsh-step__num" aria-hidden="true">{s.num}</span>
            <div className="hsh-step__body">
              <strong className="hsh-step__title">{s.title}</strong>
              <p className="hsh-step__desc">{s.desc}</p>
              <Link href={s.href} className="hsh-step__cta">{s.cta} ←</Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ExplorePlatformSection() {
  return (
    <section aria-labelledby="features-heading" style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.1rem" }}>
        {/* أيقونة هندسية للعنوان */}
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <polygon points="11,1 13.5,8 21,8 15,13 17.5,20 11,16 4.5,20 7,13 1,8 8.5,8" fill="none" stroke="#173D35" strokeWidth="1.2"/>
          <circle cx="11" cy="11" r="3.5" fill="none" stroke="#173D35" strokeWidth="0.8"/>
        </svg>
        <h2 id="features-heading" style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
          استكشف المنصة
        </h2>
      </div>

      {/* بطاقات بارزة */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.8rem",
        marginBottom: "2.25rem",
      }}>
        {FEATURED.map(({ href, Icon, title, desc, cta }) => (
          <Link key={href} href={href} aria-label={title} style={{
            display: "flex", flexDirection: "column", gap: "0.65rem",
            padding: "1.2rem 1.1rem", borderRadius: "1.1rem", textDecoration: "none",
            background: "linear-gradient(145deg, #112a1e 0%, #1a3d2b 40%, #173D35 80%, #173D35 100%)",
            color: "#fff",
            boxShadow: "0 4px 16px rgba(15,50,30,0.28), inset 0 1px 0 rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.12)",
            position: "relative", overflow: "hidden",
          }}>
            {/* زخرفة هندسية في الخلفية */}
            <svg aria-hidden="true" style={{
              position: "absolute", top: "-10px", left: "-10px", opacity: 0.07, pointerEvents: "none",
            }} width="80" height="80" viewBox="0 0 80 80">
              <polygon points="40,5 55,25 75,20 65,40 75,60 55,55 40,75 25,55 5,60 15,40 5,20 25,25" fill="none" stroke="white" strokeWidth="1"/>
              <circle cx="40" cy="40" r="15" fill="none" stroke="white" strokeWidth="0.6"/>
            </svg>
            <Icon size={22} strokeWidth={1.5} style={{ opacity: 0.92, position: "relative" }} />
            <strong style={{ fontSize: "0.97rem", fontWeight: 800, position: "relative", lineHeight: 1.3 }}>{title}</strong>
            <p style={{ fontSize: "0.79rem", opacity: 0.75, lineHeight: 1.6, margin: 0, position: "relative" }}>{desc}</p>
            <span style={{
              fontSize: "0.76rem", fontWeight: 700, marginTop: "auto",
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              color: "rgba(210,240,225,0.95)", position: "relative",
              borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.5rem",
            }}>{cta} ←</span>
          </Link>
        ))}
      </div>

      {/* أقسام بالتصنيف — معاينة مختصرة (٤ عناصر) + رابط لعرض الكل، تقليلاً للازدحام.
          القائمة الكاملة (والأشمل) متاحة دائماً عبر /sitemap. لا حذف لأي رابط —
          كل عنصر لا يظهر هنا موجود ضمن دليل "كل الأقسام". */}
      {FEATURE_CATS.map(cat => {
        const PREVIEW_COUNT = 4;
        const preview = cat.items.slice(0, PREVIEW_COUNT);
        const remaining = cat.items.length - preview.length;
        return (
          <div key={cat.id} style={{ marginBottom: "2rem" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              marginBottom: "0.85rem", paddingBottom: "0.7rem",
              borderBottom: "1.5px solid #ddeee5",
            }}>
              {/* زخرفة هندسية بدل المربع */}
              <svg aria-hidden="true" width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
                <polygon points="14,2 20,9 27,9 22,16 25,24 14,20 3,24 6,16 1,9 8,9" fill="#173D35"/>
                <polygon points="14,6 18,11 23,11 19,15.5 21,21 14,18 7,21 9,15.5 5,11 10,11" fill="#173D35" opacity="0.6"/>
                <circle cx="14" cy="14" r="3" fill="#F7F4ED"/>
              </svg>
              <h3 style={{ fontSize: "0.98rem", fontWeight: 800, color: "#173D35", margin: 0 }}>{cat.label}</h3>
              <span style={{
                marginRight: "auto", fontSize: "0.68rem", color: "#173D35", fontWeight: 700,
                background: "#e8f4ed", padding: "0.15rem 0.6rem", borderRadius: "999px",
                border: "1px solid #c8e6d5",
              }}>{cat.items.length} قسم</span>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))",
              gap: "0.5rem",
            }}>
              {preview.map(({ href, Icon: ItemIcon, title, desc }) => (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "flex-start", gap: "0.6rem",
                  padding: "0.75rem 0.8rem", borderRadius: "0.8rem",
                  textDecoration: "none", background: "#fafcfb",
                  border: "1px solid #e2ede8",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                  <span style={{
                    background: "linear-gradient(135deg,#173D35,#173D35)", color: "#F7F4ED",
                    padding: "0.38rem", borderRadius: "0.4rem",
                    display: "flex", flexShrink: 0, marginTop: "0.05rem",
                    boxShadow: "0 1px 3px rgba(15,50,30,0.2)",
                  }}>
                    <ItemIcon size={14} strokeWidth={2} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: "0.81rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.35 }}>{title}</strong>
                    <span style={{ fontSize: "0.7rem", color: "#666", lineHeight: 1.45, display: "block", marginTop: "0.1rem" }}>{desc}</span>
                  </div>
                </Link>
              ))}
              {remaining > 0 && (
                <Link href="/sitemap" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                  padding: "0.75rem 0.8rem", borderRadius: "0.8rem",
                  textDecoration: "none", background: "#eef6f2",
                  border: "1.5px dashed #b9dbcb",
                  color: "#173D35", fontSize: "0.78rem", fontWeight: 700,
                  textAlign: "center",
                }}>
                  +{remaining} أقسام أخرى ←
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {/* رابط ختامي واحد لدليل الأقسام الكامل (أشمل من القائمة أعلاه) */}
      <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
        <Link href="/sitemap" style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          padding: "0.6rem 1.4rem", borderRadius: "0.7rem",
          textDecoration: "none", background: "#173D35", color: "#F7F4ED",
          fontSize: "0.83rem", fontWeight: 800,
        }}>
          تصفّح كل أقسام المنصة ←
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { isAdmin, user } = useAuth();
  const dailyCtx = useDailyContext();

  // زر المتابعة الوحيد في البطاقة اليومية: آخر صفحة زارها المستخدم فعليًا،
  // أو دعوة افتراضية لزائر جديد بلا سجل تصفّح (يُقرأ بعد التركيب لتفادي
  // اختلاف الترطيب SSR/prerender، بنفس نمط RecentPagesBar أدناه).
  const [lastVisited, setLastVisited] = useState<RecentPage | null>(null);
  useEffect(() => {
    const pages = getRecentPages(2);
    // أول عنصر هو الصفحة الحالية غالبًا ("/")، فنأخذ أول صفحة مختلفة عنها
    const last = pages.find((p) => p.href !== "/") ?? null;
    setLastVisited(last);
  }, []);
  const continueHref  = lastVisited?.href ?? "/daily-wird";
  const continueLabel = lastVisited ? `تابع: ${lastVisited.label}` : "ابدأ يومك: الورد اليومي";

  // تخصيص أقسام الصفحة الرئيسية: محلي فورًا، مع مزامنة اختيارية من Supabase عند تسجيل الدخول
  const [homePrefs, setHomePrefs] = useState<HomepagePrefs>(() => getLocalHomepagePrefs());
  const [customizeOpen, setCustomizeOpen] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    fetchRemoteHomepagePrefs(user.id).then((remote) => {
      if (remote) { setHomePrefs(remote); saveLocalHomepagePrefs(remote); }
    });
  }, [user?.id]);

  // شريط الترويسة المُصغَّر: الصلاة القادمة والوقت المتبقي (بديل الشعار الكبير)
  const [heroPrayers, setHeroPrayers] = useState<PrayerTimesPayload | null>(null);
  useEffect(() => {
    fetchPrayerTimes().then(setHeroPrayers).catch(() => {});
  }, []);
  const [heroCountdown, setHeroCountdown] = useState<{ name: string; hms: string } | null>(null);
  useEffect(() => {
    if (!heroPrayers?.prayers?.length) return;
    const tick = () => {
      const cd = computePrayerCountdown(heroPrayers.prayers);
      const inGrace = cd.sinceSeconds != null;
      const name = inGrace && cd.graceNextSlot ? cd.graceNextSlot.name : cd.next?.name;
      const hms = inGrace && cd.graceNextHms ? cd.graceNextHms : cd.remainingHms;
      if (name && hms) setHeroCountdown({ name, hms });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [heroPrayers]);

  useEffect(() => {
    applyPageSeo({
      path: "/",
      title: "المجلس العلمي، منصة العلوم الإسلامية",
      description: "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم، الأذكار، الدروس العلمية، الأحكام الشرعية، والفقه المعاصر.",
      keywords: ["المجلس العلمي", "علوم إسلامية", "قرآن كريم", "أذكار", "أحكام شرعية", "دروس علمية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "المجلس العلمي",
          url: "https://www.majlisilm.com",
          logo: "https://www.majlisilm.com/logo.png",
          description: "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم والأذكار والدروس والأحكام الشرعية والفقه",
          inLanguage: "ar",
          areaServed: { "@type": "Country", name: "الكويت" },
          sameAs: ["https://www.majlisilm.com"],
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "المجلس العلمي",
          url: "https://www.majlisilm.com",
          inLanguage: "ar",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://www.majlisilm.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        },
      ],
    });
  }, []);


  return (
    <div className="home-page home-page--v4" dir="rtl">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      {/* ══════════════════ Hero الموحّد ══════════════════ */}
      <section
        className="hpv4-hero"
        aria-label="الصفحة الرئيسية"
        style={{
          /* تدرّج هادئ محدود بدرجتين فقط من لوحة الهوية v3 (لا تدرّج قوي متعدد المراحل) */
          background: "linear-gradient(135deg, #173D35 0%, #28584D 100%)",
          padding: "clamp(1.5rem,4vw,2rem) 1rem clamp(1.25rem,3vw,1.75rem)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* خط عاجي علوي مُتدرّج */}
        <div aria-hidden="true" style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent 0%, rgba(250,248,242,0.15) 15%, rgba(250,248,242,0.65) 50%, rgba(250,248,242,0.15) 85%, transparent 100%)",
        }} />

        {/* نمط هندسي إسلامي — نجمة 12 رأساً */}
        <div className="home-hero-pattern" aria-hidden="true" style={{ pointerEvents: "none" }} />

        {/* زخرفة الزاوية اليمنى — نجمة 8 أطراف */}
        <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" style={{
          position: "absolute", top: 0, right: 0, opacity: 0.18, pointerEvents: "none",
        }}>
          <g transform="translate(0,0)">
            <polygon points="45,5 55,25 75,15 65,35 85,45 65,55 75,75 55,65 45,85 35,65 15,75 25,55 5,45 25,35 15,15 35,25" fill="none" stroke="white" strokeWidth="0.8"/>
            <polygon points="45,20 52,35 67,30 57,42 68,55 52,50 45,65 38,50 22,55 33,42 23,30 38,35" fill="none" stroke="white" strokeWidth="0.5"/>
            <circle cx="45" cy="45" r="10" fill="none" stroke="white" strokeWidth="0.5"/>
          </g>
        </svg>

        {/* زخرفة الزاوية اليسرى — نجمة 6 أطراف */}
        <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" style={{
          position: "absolute", top: 0, left: 0, opacity: 0.18, pointerEvents: "none",
          transform: "scaleX(-1)",
        }}>
          <g transform="translate(0,0)">
            <polygon points="45,5 55,25 75,15 65,35 85,45 65,55 75,75 55,65 45,85 35,65 15,75 25,55 5,45 25,35 15,15 35,25" fill="none" stroke="white" strokeWidth="0.8"/>
            <polygon points="45,20 52,35 67,30 57,42 68,55 52,50 45,65 38,50 22,55 33,42 23,30 38,35" fill="none" stroke="white" strokeWidth="0.5"/>
            <circle cx="45" cy="45" r="10" fill="none" stroke="white" strokeWidth="0.5"/>
          </g>
        </svg>

        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", textAlign: "center" }}>

          <h1 className="hpv4-vision-title">رؤيتنا: بناء الإسلام الرقمي</h1>

          {/* ── التحية اليومية الديناميكية ── */}
          <div style={{ marginBottom: "1.1rem" }}>
            <p style={{
              color: "rgba(250,248,242,0.92)",
              fontSize: "clamp(0.88rem, 2.4vw, 1.05rem)",
              fontWeight: 700,
              letterSpacing: "0.01em",
              lineHeight: 1.5,
              margin: "0 0 0.35rem",
            }}>
              {dailyCtx.greeting}
            </p>
            {dailyCtx.subGreeting && (
              <p style={{
                color: "rgba(250,248,242,0.55)",
                fontSize: "clamp(0.72rem, 1.9vw, 0.82rem)",
                margin: 0,
              }}>
                {dailyCtx.subGreeting}
              </p>
            )}
            {dailyCtx.event && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                marginTop: "0.5rem",
                background: `${dailyCtx.accentColor}33`,
                border: `1px solid ${dailyCtx.accentColor}66`,
                color: "#F7F4ED",
                padding: "0.22rem 0.9rem",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}>
                ✦ {dailyCtx.event}
              </div>
            )}
            {/* شريط التاريخ والصلاة القادمة — بديل الشعار الكبير واسم التطبيق
                (يبقى الشعار في شاشة البداية وصفحة "عن التطبيق" والأيقونة فقط) */}
            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center",
              gap: "0.4rem", marginTop: "0.45rem",
            }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.22)",
                color: "rgba(250,248,242,0.75)",
                padding: "0.18rem 0.75rem",
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}>
                <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="9" cy="9" r="7"/><path d="M9 2C6.5 4 5 6.3 5 9s1.5 5 4 7"/><path d="M9 2c2.5 2 4 4.3 4 7s-1.5 5-4 7"/><path d="M2 9h14"/>
                </svg>
                {getHijriDateString()}
              </span>
              {heroCountdown && (
                <Link href="/prayer-times" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.35rem",
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#F7F4ED",
                  padding: "0.18rem 0.75rem",
                  borderRadius: "999px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  textDecoration: "none",
                }}>
                  <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="9" r="7.5"/><path d="M9 5v4l3 2"/>
                  </svg>
                  {heroCountdown.name} بعد <span dir="ltr">{heroCountdown.hms}</span>
                </Link>
              )}
            </div>
          </div>

          {/* فاصل هندسي مُحسَّن — ماسة وخطوط */}
          <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", opacity: 0.45 }}>
            <svg width="280" height="20" viewBox="0 0 280 20">
              <line x1="0" y1="10" x2="118" y2="10" stroke="rgba(255,255,255,0.8)" strokeWidth="0.7"/>
              <polygon points="130,4 140,10 130,16 120,10" fill="rgba(255,255,255,0.9)"/>
              <polygon points="150,7 157,10 150,13 143,10" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5"/>
              <polygon points="130,4 140,10 130,16 120,10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" transform="translate(20,0) scale(0.7) translate(-140,-10)"/>
              <line x1="162" y1="10" x2="280" y2="10" stroke="rgba(255,255,255,0.8)" strokeWidth="0.7"/>
            </svg>
          </div>

          {/* زر متابعة واحد — العنصر الثالث من البطاقة اليومية (ديناميكي: آخر صفحة
              زارها المستخدم، أو دعوة افتراضية لبدء الورد اليومي لزائر جديد) */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link href={continueHref} className="hpv4-hero__cta-primary" style={{
              background: "#F7F4ED", color: "#173D35", padding: "0.7rem 1.6rem",
              borderRadius: "0.65rem", fontWeight: 800, fontSize: "0.9rem",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
            }}>
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3l8 6-8 6V3z"/></svg>
              {continueLabel}
            </Link>
          </div>

          {/* إحصائيات المنصة — للمشرف فقط */}
          {isAdmin && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.45rem",
              marginTop: "1.5rem", paddingTop: "1.2rem",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}>
              {[
                { num: toArabicDigits(contentCounts.scholars),      label: "عالم مرجعي",   icon: "👤" },
                { num: toArabicDigits(contentCounts.quizQuestions), label: "سؤال اختباري", icon: "🧠" },
                { num: toArabicDigits(contentCounts.fawaid),        label: "فائدة علمية",  icon: "💡" },
                { num: toArabicDigits(contentCounts.books),         label: "كتاب علمي",    icon: "📚" },
              ].map(({ num, label, icon }) => (
                <div key={label} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.65rem", padding: "0.65rem 0.4rem", textAlign: "center",
                }}>
                  <div style={{ fontSize: "1rem", marginBottom: "0.15rem", lineHeight: 1 }}>{icon}</div>
                  <div style={{ color: "#F7F4ED", fontSize: "1.1rem", fontWeight: 800, lineHeight: 1.1 }}>{num}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.62rem", marginTop: "0.18rem", lineHeight: 1.3 }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ مجلس اليوم ══ */}
      <div style={{ maxWidth: 760, margin: "1rem auto 0", padding: "0 1rem" }}>
        <SectionErrorBoundary name="مجلس اليوم">
          <HomeMajlisToday />
        </SectionErrorBoundary>
      </div>

      {/* ══ زرتَ مؤخراً ══ */}
      <RecentPagesBar />

      {/* ملاحظة: "لوحة المستخدم الشخصية" (ترحيب + آخر نشاطين) حُذفت من هنا —
          كانت تكرارًا حرفيًا لودجت "استمر من حيث توقفت" (HomeContinueWidget)
          الذي يعرض نفس البيانات (useRecentProgress) بمعالجة حالات أشمل
          (تسجيل دخول/تحميل/فراغ) ضمن قسم "أكمل من حيث توقفت" أدناه — لا حذف
          وظيفة، فقط إزالة ازدواج بصري (إعادة هيكلة الرئيسية، الأولوية 1). */}

      {/* ══ وصول سريع ══ */}
      <nav aria-label="وصول سريع" style={{ maxWidth: 760, margin: "2rem auto 0", padding: "0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.7rem" }}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <polygon points="9,1 12,7 18,7 13,11 15,17 9,13 3,17 5,11 0,7 6,7" fill="#173D35" opacity="0.85"/>
          </svg>
          <p style={{ color: "#173D35", fontSize: "0.82rem", fontWeight: 800, margin: 0, letterSpacing: "0.03em" }}>وصول سريع</p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "0.45rem",
        }}>
          {QUICK_LINKS.map(({ href, Icon: Ico, label, desc }) => (
            <Link key={label + href} href={href} aria-label={label} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.6rem 0.65rem",
              background: "#fff",
              border: "1px solid #e5efea",
              borderRadius: "0.75rem",
              textDecoration: "none",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <span style={{
                background: "linear-gradient(135deg,#edf6f1,#daf0e8)",
                color: "#173D35", padding: "0.38rem", borderRadius: "0.4rem",
                display: "flex", flexShrink: 0,
              }}>
                <Ico size={14} strokeWidth={2} />
              </span>
              <div style={{ minWidth: 0 }}>
                {/* لون ثابت (#202725/#9ca3af) لا يتكيّف مع السمة الليلية — بطاقة
                    "وصول سريع" تتحول خلفيتها للداكن في الوضع الليلي (قاعدة
                    CSS منفصلة) بينما بقي النص هنا داكنًا ثابتًا = شبه غير
                    مقروء (تباين ~1:1، شُخِّص 2026-07-19). متغيّرات CSS تعمل
                    داخل style inline في React وتتكيّف تلقائيًا مع السمة. */}
                <div style={{ color: "var(--majalis-ink, #202725)", fontSize: "0.77rem", fontWeight: 700, lineHeight: 1.25 }}>{label}</div>
                <div style={{ color: "var(--majalis-ink-soft, #9ca3af)", fontSize: "0.66rem", lineHeight: 1.3, marginTop: 1 }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* ══ بانرات المناسبات المؤقتة (جمعة/صيام/شهر هجري) — مجمّعة في حاوية
          واحدة بتباعد داخلي موحّد بدل ثلاث حاويات منفصلة، تقليلاً للتكرار
          البصري. كل بانر يبقى شرطي الظهور كما كان تماماً. ══ */}
      <div style={{
        maxWidth: 760, margin: "2rem auto 0", padding: "0 1rem",
        display: "flex", flexDirection: "column", gap: "0.75rem",
      }}>
        <SafeHomeSection name="FridayBanner">
          <FridayBanner />
        </SafeHomeSection>
        <HomeSawmReminder />
        <SafeHomeSection name="HijriSacredMonthBanner">
          <HijriSacredMonthBanner />
        </SafeHomeSection>
      </div>

      {/* ══ ابدأ من هنا ══ */}
      <StartHereSection />

      <div style={{ maxWidth: 760, margin: "0.5rem auto 0", padding: "0 1rem", textAlign: "center" }}>
        <button type="button" className="hpv4-customize-trigger" onClick={() => setCustomizeOpen(true)}>
          <Wrench size={13} strokeWidth={2} aria-hidden="true" /> تخصيص الصفحة الرئيسية
        </button>
      </div>

      {/* ══════════════════ Main Content ══════════════════ */}
      <main className="home-container home-main home-main--v3">

        {visibleWidgetOrder(homePrefs).map((id) => (
          <SafeHomeSection key={id} name={WIDGET_LABEL[id] ?? id}>
            {WIDGET_RENDERERS[id]?.()}
          </SafeHomeSection>
        ))}

        <SafeHomeSection name="عن المجلس العلمي">
          <HomeAboutSection />
        </SafeHomeSection>

      </main>

      <HomeCustomizeSheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onChange={setHomePrefs}
      />
    </div>
  );
}
