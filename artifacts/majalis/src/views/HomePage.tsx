import { useEffect, useState, type FormEvent } from "react";
import contentCounts from "@/data/content-counts.json";
import { applyPageSeo } from "@/lib/seo";
import { Link, useLocation } from "wouter";
import { useDailyContext } from "@/lib/daily-context";
import { useAuth } from "@/components/AuthProvider";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";
import { History } from "lucide-react";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeCompactPrayer } from "@/components/home/HomeCompactPrayer";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeDailyCorner } from "@/components/home/HomeDailyCorner";
import { HomeSunnahByTime } from "@/components/home/HomeSunnahByTime";
import { HomeSawmReminder } from "@/components/home/HomeSawmReminder";
import { HomeIslamicOccasions } from "@/components/home/HomeIslamicOccasions";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeContinueWidget } from "@/components/home/HomeContinueWidget";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomePrayerRanks } from "@/components/home/HomePrayerRanks";
import { HomeFeaturedLibrary } from "@/components/home/HomeFeaturedLibrary";
import { HomeQuizCard } from "@/components/home/HomeQuizCard";
import { HomeAsmaCard } from "@/components/home/HomeAsmaCard";
import { HomeWeekStreak } from "@/components/home/HomeWeekStreak";
import { HomeNawawiHadith } from "@/components/home/HomeNawawiHadith";
import { HomeInterestingTopics } from "@/components/home/HomeInterestingTopics";
import { HomeMindMapSection } from "@/components/home/HomeMindMapSection";
import { HomeMajlisToday } from "@/components/home/HomeMajlisToday";
import { HomePersonalDashboard } from "@/components/home/HomePersonalDashboard";
import { FridayBanner } from "@/components/FridayBanner";
import { HijriSacredMonthBanner } from "@/components/HijriSacredMonthBanner";
import { getHijriDateString } from "@/lib/hijri-utils";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerTimesPayload } from "@/lib/prayer-times";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
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

/* ── روابط الوصول السريع ── */
const QUICK_LINKS: { href: string; Icon: LucideIcon; label: string; desc: string }[] = [
  { href: "/adhkar",         Icon: Star,          label: "الأذكار",         desc: "صباح ومساء ونوم" },
  { href: "/quran/recitation-test-ai", Icon: Bot, label: "اختبار التسميع", desc: "بالذكاء الاصطناعي" },
  { href: "/prayer-times",   Icon: Clock,         label: "أوقات الصلاة",    desc: "الكويت لحظياً" },
  { href: "/lessons",        Icon: GraduationCap, label: "الدروس",           desc: "علماء الكويت" },
  { href: "/hadith",         Icon: Scroll,        label: "الأحاديث",         desc: "صحيح وضعيف" },
  { href: "/quran-hub",      Icon: BookMarked,    label: "القرآن",            desc: "تجويد، تلاوة، وأكثر" },
  { href: "/fawaid",         Icon: Lightbulb,     label: "الفوائد",          desc: "فوائد منتقاة" },
  { href: "/qa",             Icon: HelpCircle,    label: "الأسئلة",           desc: "أسئلة شرعية موثّقة" },
  { href: "/tasbih",         Icon: RotateCw,      label: "التسبيح",          desc: "عداد إلكتروني" },
  { href: "/seerah",         Icon: Moon,          label: "السيرة",            desc: "حياته ﷺ كاملة" },
  { href: "/rulings",        Icon: Scale,         label: "الأحكام الشرعية",  desc: "مسائل معاصرة" },
  { href: "/quiz",           Icon: Target,        label: "المسابقات",         desc: "اختبار المعلومات" },
  { href: "/muezzins",       Icon: Mic2,          label: "المؤذنون",          desc: "أجمل الأصوات" },
  { href: "/library",        Icon: BookOpen,      label: "المكتبة",           desc: "كتب ومتون علمية" },
  { href: "/qibla",          Icon: Compass,       label: "القِبلة",           desc: "اتجاه الكعبة" },
  { href: "/salah-guide",    Icon: Scroll,        label: "دليل الصلاة",       desc: "للمبتدئ والمتقن" },
  { href: "/calendar",       Icon: CalendarDays,  label: "التقويم",           desc: "التاريخ الهجري" },
  { href: "/mawarith",       Icon: Scale,         label: "المواريث",          desc: "الفرائض والتركات" },
  { href: "/knowledge-map",  Icon: Map,           label: "خريطة المعرفة",     desc: "حقول العلوم الشرعية مترابطة" },
  { href: "/scholars",       Icon: Users,         label: "العلماء",            desc: "رواد الفقه والحديث" },
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
      { href: "/submit",       Icon: Upload,      title: "أضف محتوى",       desc: "ساهم في إثراء المنصة" },
    ],
  },
];

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>;
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
  "prayer-ranks": () => <HomePrayerRanks />,
  "interesting-topics": () => <HomeInterestingTopics />,
  "mind-map": () => <HomeMindMapSection />,
};

const WIDGET_LABEL: Record<string, string> = Object.fromEntries(HOME_WIDGET_DEFS.map((w) => [w.id, w.label]));

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
function toArabicDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

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
    desc: "٨ محطات علمية مرتبة من العقيدة إلى التوسع، ٣ روابط لكل محطة",
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
          <polygon points="11,1 13.5,8 21,8 15,13 17.5,20 11,16 4.5,20 7,13 1,8 8.5,8" fill="none" stroke="#176B57" strokeWidth="1.2"/>
          <circle cx="11" cy="11" r="3.5" fill="none" stroke="#176B57" strokeWidth="0.8"/>
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
            background: "linear-gradient(145deg, #112a1e 0%, #1a3d2b 40%, #176B57 80%, #176B57 100%)",
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

      {/* أقسام بالتصنيف */}
      {FEATURE_CATS.map(cat => (
        <div key={cat.id} style={{ marginBottom: "2rem" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            marginBottom: "0.85rem", paddingBottom: "0.7rem",
            borderBottom: "1.5px solid #ddeee5",
          }}>
            {/* زخرفة هندسية بدل المربع */}
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
              <polygon points="14,2 20,9 27,9 22,16 25,24 14,20 3,24 6,16 1,9 8,9" fill="#176B57"/>
              <polygon points="14,6 18,11 23,11 19,15.5 21,21 14,18 7,21 9,15.5 5,11 10,11" fill="#176B57" opacity="0.6"/>
              <circle cx="14" cy="14" r="3" fill="#FAF8F2"/>
            </svg>
            <h3 style={{ fontSize: "0.98rem", fontWeight: 800, color: "#176B57", margin: 0 }}>{cat.label}</h3>
            <span style={{
              marginRight: "auto", fontSize: "0.68rem", color: "#176B57", fontWeight: 700,
              background: "#e8f4ed", padding: "0.15rem 0.6rem", borderRadius: "999px",
              border: "1px solid #c8e6d5",
            }}>{cat.items.length} قسم</span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))",
            gap: "0.5rem",
          }}>
            {cat.items.map(({ href, Icon: ItemIcon, title, desc }) => (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "flex-start", gap: "0.6rem",
                padding: "0.75rem 0.8rem", borderRadius: "0.8rem",
                textDecoration: "none", background: "#fafcfb",
                border: "1px solid #e2ede8",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <span style={{
                  background: "linear-gradient(135deg,#176B57,#176B57)", color: "#FAF8F2",
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
          </div>
        </div>
      ))}
    </section>
  );
}

export default function HomePage() {
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();
  const { isAdmin, user } = useAuth();
  const dailyCtx = useDailyContext();

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

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

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
          background: "linear-gradient(165deg, #071E18 0%, #123F36 40%, #0E4437 70%, #071E18 100%)",
          padding: "clamp(2rem,5vw,3rem) 1rem clamp(1.75rem,4vw,2.5rem)",
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

          {/* ── التحية اليومية الديناميكية (h1 دلالي وحيد للصفحة) ── */}
          <div style={{ marginBottom: "1.1rem" }}>
            <h1 style={{
              color: "rgba(250,248,242,0.92)",
              fontSize: "clamp(0.88rem, 2.4vw, 1.05rem)",
              fontWeight: 700,
              letterSpacing: "0.01em",
              lineHeight: 1.5,
              margin: "0 0 0.35rem",
            }}>
              {dailyCtx.greeting}
            </h1>
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
                color: "#FAF8F2",
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
                  color: "#FAF8F2",
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

          {/* الوصف */}
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "clamp(0.84rem, 2.2vw, 0.96rem)", lineHeight: 1.8, maxWidth: 510, margin: "0 auto 1.1rem" }}>
            بوّابتك الشاملة إلى العلوم الشرعية: القرآن الكريم، السنة النبوية الموثّقة، دروس علماء الكويت، الفقه والأحكام المعاصرة، والأذكار اليومية
          </p>

          {/* شريحات الجمهور */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", justifyContent: "center", marginBottom: "1.1rem" }}>
            {([
              {
                icon: <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3 1 7l8 4 8-4-8-4z"/><path d="M5 9.5v3.5a4 4 0 0 0 8 0V9.5"/></svg>,
                label: "طالب العلم", href: "/lessons",
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 17h16"/><path d="M3 17v-6a6 6 0 0 1 12 0v6"/><path d="M9 5V3"/><path d="M7.5 8h3"/></svg>,
                label: "المسلم اليومي", href: "/adhkar",
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="7" cy="6" r="3"/><path d="M1 17c0-3 2.7-5 6-5s6 2 6 5"/><circle cx="14" cy="6" r="2"/><path d="M14 11c1.7 0 3 1.3 3 4"/></svg>,
                label: "الأسرة المسلمة", href: "/qa",
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="4"/><path d="M9 12v3"/><path d="M6 15h6"/><path d="M12 5l2-3"/><path d="M6 5 4 2"/></svg>,
                label: "العالم والباحث", href: "/library",
              },
            ] as { icon: React.ReactNode; label: string; href: string }[]).map(({ icon, label, href }, i) => (
              <Link key={label} href={href} style={{
                background: i === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                color: "#FAF8F2",
                padding: "0.32rem 0.85rem", borderRadius: "999px",
                fontSize: "0.77rem", fontWeight: 700,
                border: `1px solid ${i === 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.18)"}`,
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                textDecoration: "none",
              }}>
                {icon}{label}
              </Link>
            ))}
          </div>

          {/* خانة البحث */}
          <form onSubmit={submitSearch} style={{
            display: "flex", borderRadius: "0.75rem", overflow: "hidden",
            boxShadow: "0 6px 24px rgba(0,0,0,0.4)", maxWidth: 460, margin: "0 auto 1rem",
            border: "1px solid rgba(255,255,255,0.18)",
          }} aria-label="البحث">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث في المنصة..."
              aria-label="البحث"
              className="hpv4-hero__search-input"
              style={{
                flex: 1, padding: "0.75rem 1rem", border: "none", outline: "none",
                fontSize: "0.88rem", direction: "rtl", fontFamily: "inherit",
                background: "rgba(255,255,255,0.97)", color: "#1a1a1a",
              }}
            />
            <button type="submit" style={{
              background: "linear-gradient(135deg,#176B57,#176B57)", color: "#FAF8F2", border: "none", cursor: "pointer",
              padding: "0.75rem 1.3rem", fontWeight: 800, fontSize: "0.85rem", fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}>بحث</button>
          </form>

          {/* أزرار الإجراء — شبكة 2×2 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,auto)", gap: "0.45rem", justifyContent: "center" }}>
            <Link href="/lessons" className="hpv4-hero__cta-primary" style={{
              background: "#FAF8F2", color: "#176B57", padding: "0.6rem 1.2rem",
              borderRadius: "0.6rem", fontWeight: 800, fontSize: "0.86rem",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
            }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3 1 7l8 4 8-4-8-4z"/><path d="M5 9.5v3.5a4 4 0 0 0 8 0V9.5"/></svg>
              الدروس
            </Link>
            <Link href="/quran-hub" style={{
              background: "rgba(255,255,255,0.1)", color: "#FAF8F2", padding: "0.6rem 1rem",
              borderRadius: "0.6rem", fontWeight: 700, fontSize: "0.86rem",
              textDecoration: "none", border: "1px solid rgba(255,255,255,0.28)",
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
            }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 15V4C8 2.5 6 2 3 2.5v12c3-.5 5 0 6 1.5z"/><path d="M9 15V4c1-1.5 3-2 6-1.5v12c-3-.5-5 0-6 1.5z"/></svg>
              القرآن
            </Link>
            <Link href="/adhkar" style={{
              background: "rgba(255,255,255,0.1)", color: "#FAF8F2", padding: "0.6rem 1rem",
              borderRadius: "0.6rem", fontWeight: 700, fontSize: "0.86rem",
              textDecoration: "none", border: "1px solid rgba(255,255,255,0.28)",
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
            }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="9" r="2"/><path d="M9 2v2M9 14v2M2 9h2M14 9h2"/><path d="M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4"/></svg>
              الأذكار
            </Link>
            <Link href="/prayer-times" style={{
              background: "rgba(255,255,255,0.1)", color: "#FAF8F2", padding: "0.6rem 1rem",
              borderRadius: "0.6rem", fontWeight: 700, fontSize: "0.86rem",
              textDecoration: "none", border: "1px solid rgba(255,255,255,0.28)",
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
            }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 17h16"/><path d="M3 17v-6a6 6 0 0 1 12 0v6"/><path d="M9 5V3"/><path d="M7.5 8h3"/></svg>
              الصلاة
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
                  <div style={{ color: "#FAF8F2", fontSize: "1.1rem", fontWeight: 800, lineHeight: 1.1 }}>{num}</div>
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

      {/* ══ لوحة المستخدم الشخصية — للمسجلين فقط ══ */}
      <SectionErrorBoundary name="PersonalDashboard">
        <HomePersonalDashboard />
      </SectionErrorBoundary>

      {/* ══ وصول سريع ══ */}
      <nav aria-label="وصول سريع" style={{ maxWidth: 760, margin: "1.5rem auto 0", padding: "0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.7rem" }}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <polygon points="9,1 12,7 18,7 13,11 15,17 9,13 3,17 5,11 0,7 6,7" fill="#176B57" opacity="0.85"/>
          </svg>
          <p style={{ color: "#176B57", fontSize: "0.82rem", fontWeight: 800, margin: 0, letterSpacing: "0.03em" }}>وصول سريع</p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(126px, 1fr))",
          gap: "0.45rem",
        }}>
          {[...QUICK_LINKS, { href: "/sitemap", Icon: Layers, label: "كل الأقسام", desc: "خريطة الموقع" }].map(({ href, Icon: Ico, label, desc }) => (
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
                color: "#176B57", padding: "0.38rem", borderRadius: "0.4rem",
                display: "flex", flexShrink: 0,
              }}>
                <Ico size={14} strokeWidth={2} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#111827", fontSize: "0.77rem", fontWeight: 700, lineHeight: 1.25 }}>{label}</div>
                <div style={{ color: "#9ca3af", fontSize: "0.66rem", lineHeight: 1.3, marginTop: 1 }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* ══ بانر يوم الجمعة ══ */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 1rem" }}>
        <SafeHomeSection name="FridayBanner">
          <FridayBanner />
        </SafeHomeSection>
      </div>

      {/* ══ تذكير صيام ══ */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 1rem" }}>
        <HomeSawmReminder />
      </div>

      {/* ══ تذكير الشهر الهجري ══ */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 1rem" }}>
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
