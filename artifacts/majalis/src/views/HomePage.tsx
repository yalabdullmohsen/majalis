import { lazy, Suspense, useEffect, useState, type CSSProperties } from "react";
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
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeContinueWidget } from "@/components/home/HomeContinueWidget";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomeMajlisToday } from "@/components/home/HomeMajlisToday";
import { FridayBanner } from "@/components/FridayBanner";
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
  Compass, Droplets, GraduationCap, Heart, HelpCircle, Landmark, Layers,
  Lightbulb, Map, Mic2, Monitor, Moon, Network,
  RotateCw, Scale, Scroll, Sparkles, Star, Target, Upload, Users, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "@/styles/pages/home.css";

// الودجتات الاختيارية لا تدخل حزمة الرئيسية للمستخدم الجديد. تُحمَّل فقط
// إذا فعّلها المستخدم من شاشة التخصيص، مع بقاء الوظيفة والحالة المحفوظة.
const HomeCompactPrayer = lazy(() => import("@/components/home/HomeCompactPrayer").then((m) => ({ default: m.HomeCompactPrayer })));
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
      { href: "/quiz",            Icon: Target,      title: "لعبة سين جيم – أسئلة وأجوبة",   desc: "اختبر معلوماتك من خلال لعبة أسئلة وأجوبة ممتعة ومتدرجة" },
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
      { href: "/mosque-mode",  Icon: Landmark,    title: "وضع المسجد",      desc: "عدّاد الصلاة مع تذكير بالصمت وإطفاء الصوت" },
      { href: "/submit",       Icon: Upload,      title: "أضف محتوى",       desc: "ساهم في إثراء المنصة" },
    ],
  },
];

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <SectionErrorBoundary name={name}>
      <Suspense fallback={<div className="skeleton-base hp-skel" aria-label={`تحميل ${name}`} />}>
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
  "sunnah-time": () => <HomeSunnahByTime />,
  "explore": () => <ExplorePlatformSection />,
  "learning-seasons": () => <HomeLearningSeasonsWidget />,
  "occasions": () => <HomeIslamicOccasions />,
  "latest-updates": () => <HomeLatestUpdates />,
  "library": () => <HomeFeaturedLibrary />,
  "quiz": () => <HomeQuizCard />,
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
    <section aria-labelledby="features-heading" className="hp-explore">
      <div className="hp-explore__head">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <polygon points="11,1 13.5,8 21,8 15,13 17.5,20 11,16 4.5,20 7,13 1,8 8.5,8" fill="none" stroke="#143F35" strokeWidth="1.2"/>
          <circle cx="11" cy="11" r="3.5" fill="none" stroke="#143F35" strokeWidth="0.8"/>
        </svg>
        <h2 id="features-heading" className="hp-explore__title">
          استكشف المنصة
        </h2>
      </div>

      <div className="hp-explore__featured">
        {FEATURED.map(({ href, Icon, title, desc, cta }) => (
          <Link key={href} href={href} aria-label={title} className="hp-featured-card">
            <svg aria-hidden="true" className="hp-featured-card__deco" width="80" height="80" viewBox="0 0 80 80">
              <polygon points="40,5 55,25 75,20 65,40 75,60 55,55 40,75 25,55 5,60 15,40 5,20 25,25" fill="none" stroke="white" strokeWidth="1"/>
              <circle cx="40" cy="40" r="15" fill="none" stroke="white" strokeWidth="0.6"/>
            </svg>
            <Icon size={22} strokeWidth={1.5} className="hp-featured-card__icon" />
            <strong className="hp-featured-card__title">{title}</strong>
            <p className="hp-featured-card__desc">{desc}</p>
            <span className="hp-featured-card__cta">{cta} ←</span>
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
          <div key={cat.id} className="hp-explore-cat">
            <div className="hp-explore-cat__head">
              <svg aria-hidden="true" width="28" height="28" viewBox="0 0 28 28" className="hp-explore-cat__ornament">
                <polygon points="14,2 20,9 27,9 22,16 25,24 14,20 3,24 6,16 1,9 8,9" fill="#143F35"/>
                <polygon points="14,6 18,11 23,11 19,15.5 21,21 14,18 7,21 9,15.5 5,11 10,11" fill="#143F35" opacity="0.6"/>
                <circle cx="14" cy="14" r="3" fill="#FAFAF8"/>
              </svg>
              <h3 className="hp-explore-cat__title">{cat.label}</h3>
              <span className="hp-explore-cat__count">{cat.items.length} قسم</span>
            </div>
            <div className="hp-explore-cat__grid">
              {preview.map(({ href, Icon: ItemIcon, title, desc }) => (
                <Link key={href} href={href} className="hp-explore-item">
                  <span className="hp-explore-item__icon">
                    <ItemIcon size={14} strokeWidth={2} />
                  </span>
                  <div className="hp-explore-item__body">
                    <strong className="hp-explore-item__title">{title}</strong>
                    <span className="hp-explore-item__desc">{desc}</span>
                  </div>
                </Link>
              ))}
              {remaining > 0 && (
                <Link href="/sitemap" className="hp-explore-more">
                  +{remaining} أقسام أخرى ←
                </Link>
              )}
            </div>
          </div>
        );
      })}

      <div className="hp-explore__footer">
        <Link href="/sitemap" className="hp-explore__sitemap">
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

  // "دروس اليوم" (lessons) رُفعت لتصبح ثابتة مباشرة تحت «مجلس اليوم» (طلب
  // مباشر)، فتُستثنى من حلقة الودجات القابلة لإعادة الترتيب العادية —
  // مع إبقاء احترام تفضيل الإخفاء الشخصي (visibleWidgetOrder نفسها).
  const visibleWidgets = visibleWidgetOrder(homePrefs);
  const showLessonsWidget = visibleWidgets.includes("lessons");
  const restWidgetOrder = visibleWidgets.filter((id) => id !== "lessons");

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
      <section className="hpv4-hero" aria-label="الصفحة الرئيسية">
        <div aria-hidden="true" className="hpv4-hero__edge-line" />

        <div className="home-hero-pattern" aria-hidden="true" />

        <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" className="hpv4-hero__corner hpv4-hero__corner--end">
          <g transform="translate(0,0)">
            <polygon points="45,5 55,25 75,15 65,35 85,45 65,55 75,75 55,65 45,85 35,65 15,75 25,55 5,45 25,35 15,15 35,25" fill="none" stroke="white" strokeWidth="0.8"/>
            <polygon points="45,20 52,35 67,30 57,42 68,55 52,50 45,65 38,50 22,55 33,42 23,30 38,35" fill="none" stroke="white" strokeWidth="0.5"/>
            <circle cx="45" cy="45" r="10" fill="none" stroke="white" strokeWidth="0.5"/>
          </g>
        </svg>

        <svg aria-hidden="true" width="90" height="90" viewBox="0 0 90 90" className="hpv4-hero__corner hpv4-hero__corner--start">
          <g transform="translate(0,0)">
            <polygon points="45,5 55,25 75,15 65,35 85,45 65,55 75,75 55,65 45,85 35,65 15,75 25,55 5,45 25,35 15,15 35,25" fill="none" stroke="white" strokeWidth="0.8"/>
            <polygon points="45,20 52,35 67,30 57,42 68,55 52,50 45,65 38,50 22,55 33,42 23,30 38,35" fill="none" stroke="white" strokeWidth="0.5"/>
            <circle cx="45" cy="45" r="10" fill="none" stroke="white" strokeWidth="0.5"/>
          </g>
        </svg>

        <div className="hpv4-hero__inner">

          <h1 className="hpv4-vision-title">ريادة المعرفة الإسلامية الرقمية</h1>

          <div className="hpv4-hero__greet">
            <p className="hpv4-hero__greet-main">
              {dailyCtx.greeting}
            </p>
            {dailyCtx.subGreeting && (
              <p className="hpv4-hero__greet-sub">
                {dailyCtx.subGreeting}
              </p>
            )}
            {dailyCtx.event && (
              <div
                className="hpv4-event-chip"
                style={{ "--hp-event-accent": dailyCtx.accentColor } as CSSProperties}
              >
                ✦ {dailyCtx.event}
              </div>
            )}
            {/* شريط التاريخ والصلاة القادمة — بديل الشعار الكبير واسم التطبيق
                (يبقى الشعار في شاشة البداية وصفحة "عن التطبيق" والأيقونة فقط) */}
            <div className="hpv4-meta-row">
              <span className="hpv4-meta-chip">
                <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="9" cy="9" r="7"/><path d="M9 2C6.5 4 5 6.3 5 9s1.5 5 4 7"/><path d="M9 2c2.5 2 4 4.3 4 7s-1.5 5-4 7"/><path d="M2 9h14"/>
                </svg>
                {getHijriDateString()}
              </span>
              {heroCountdown && (
                <Link href="/prayer-times" className="hpv4-prayer-chip">
                  <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="9" r="7.5"/><path d="M9 5v4l3 2"/>
                  </svg>
                  {heroCountdown.name} بعد <span dir="ltr">{heroCountdown.hms}</span>
                </Link>
              )}
            </div>
          </div>

          <div aria-hidden="true" className="hpv4-divider">
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
          <div className="hpv4-hero__cta-wrap">
            <Link href={continueHref} className="hpv4-hero__cta-primary">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3l8 6-8 6V3z"/></svg>
              {continueLabel}
            </Link>
          </div>

          {isAdmin && (
            <div className="hpv4-admin-stats">
              {[
                { num: toArabicDigits(contentCounts.scholars),      label: "عالم مرجعي",   icon: "👤" },
                { num: toArabicDigits(contentCounts.quizQuestions), label: "سؤال اختباري", icon: "🧠" },
                { num: toArabicDigits(contentCounts.fawaid),        label: "فائدة علمية",  icon: "💡" },
                { num: toArabicDigits(contentCounts.books),         label: "كتاب علمي",    icon: "📚" },
              ].map(({ num, label, icon }) => (
                <div key={label} className="hpv4-admin-stat">
                  <div className="hpv4-admin-stat__icon">{icon}</div>
                  <div className="hpv4-admin-stat__num">{num}</div>
                  <div className="hpv4-admin-stat__label">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ مجلس اليوم ══ */}
      <div className="hp-section-wrap">
        <SectionErrorBoundary name="مجلس اليوم">
          <HomeMajlisToday />
        </SectionErrorBoundary>
      </div>

      {/* ══ دروس اليوم ══ — رُفعت لتصبح مباشرة تحت «مجلس اليوم» (طلب مباشر
          2026-07-25، كانت ضمن حلقة الودجات القابلة لإعادة الترتيب أدناه
          فتظهر بعد «زرتَ مؤخرًا» و«وصول سريع» بمسافة). استُثنيت من الحلقة
          (restWidgetOrder) لتفادي التكرار، مع الإبقاء على احترام تفضيل
          إخفائها إن أخفاها المستخدم من ورقة تخصيص الرئيسية — فقط ترتيبها
          النسبي بين بقية الودجات صار ثابتًا، لا الإخفاء. */}
      {showLessonsWidget && (
        <SafeHomeSection name={WIDGET_LABEL["lessons"] ?? "lessons"}>
          {WIDGET_RENDERERS["lessons"]?.()}
        </SafeHomeSection>
      )}

      {/* ══ زرتَ مؤخراً ══ */}
      <RecentPagesBar />

      {/* ملاحظة: "لوحة المستخدم الشخصية" (ترحيب + آخر نشاطين) حُذفت من هنا —
          كانت تكرارًا حرفيًا لودجت "استمر من حيث توقفت" (HomeContinueWidget)
          الذي يعرض نفس البيانات (useRecentProgress) بمعالجة حالات أشمل
          (تسجيل دخول/تحميل/فراغ) ضمن قسم "أكمل من حيث توقفت" أدناه — لا حذف
          وظيفة، فقط إزالة ازدواج بصري (إعادة هيكلة الرئيسية، الأولوية 1). */}

      {/* ══ وصول سريع ══ */}
      <nav aria-label="وصول سريع" className="hp-quick-nav">
        <div className="hp-quick-nav__head">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <polygon points="9,1 12,7 18,7 13,11 15,17 9,13 3,17 5,11 0,7 6,7" fill="currentColor" opacity="0.85"/>
          </svg>
          <p className="hp-quick-nav__title">وصول سريع</p>
        </div>
        <div className="hp-quick-nav__grid">
          {QUICK_LINKS.map(({ href, Icon: Ico, label, desc }) => (
            <Link key={label + href} href={href} aria-label={label} className="hp-quick-card">
              <span className="hp-quick-card__icon">
                <Ico size={14} strokeWidth={2} />
              </span>
              <div className="hp-quick-card__body">
                <div className="hp-quick-card__label">{label}</div>
                <div className="hp-quick-card__desc">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* ══ بانر صلاة الجمعة — إشعار صلاة، يبقى بحسب تعليمات الحفاظ على
          إشعارات الأذان والصلوات. بانرا التذكير بالصيام والشهر الهجري
          أُزيلا من الرئيسية (2026-07-22)؛ شهر الهجري يستمر بالعمل في
          صفحة التقويم كما هو. ══ */}
      <div className="hp-section-wrap hp-section-wrap--banners">
        <SafeHomeSection name="FridayBanner">
          <FridayBanner />
        </SafeHomeSection>
      </div>

      {/* ══ ابدأ من هنا ══ */}
      <StartHereSection />

      <div className="hp-section-wrap hp-section-wrap--customize">
        <button type="button" className="hpv4-customize-trigger" onClick={() => setCustomizeOpen(true)}>
          <Wrench size={13} strokeWidth={2} aria-hidden="true" /> تخصيص الصفحة الرئيسية
        </button>
      </div>

      {/* ══════════════════ Main Content ══════════════════ */}
      <main className="home-container home-main home-main--v3">

        {restWidgetOrder.map((id) => (
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
