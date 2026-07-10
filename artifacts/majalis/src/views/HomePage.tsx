import { useEffect, useState, type FormEvent } from "react";
import { applyPageSeo } from "@/lib/seo";
import { Link, useLocation } from "wouter";
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
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { HijriSacredMonthBanner } from "@/components/HijriSacredMonthBanner";
import {
  BookMarked, BookOpen, Bot, CalendarDays, Car, Check, Clock,
  Compass, Droplets, FlaskConical, GraduationCap, Heart, HelpCircle, Landmark, Layers,
  Lightbulb, Map, Mic2, Monitor, Moon, Network, Newspaper,
  Radio, RotateCw, Scale, Scroll, Sparkles, Star, Target, Upload, Users, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── روابط الوصول السريع ── */
const QUICK_LINKS: { href: string; Icon: LucideIcon; label: string; desc: string }[] = [
  { href: "/adhkar",         Icon: Star,          label: "الأذكار",         desc: "صباح ومساء ونوم" },
  { href: "/prayer-times",   Icon: Clock,         label: "أوقات الصلاة",    desc: "الكويت لحظياً" },
  { href: "/lessons",        Icon: GraduationCap, label: "الدروس",           desc: "علماء الكويت" },
  { href: "/hadith",         Icon: Scroll,        label: "الأحاديث",         desc: "صحيح وضعيف" },
  { href: "/quran",          Icon: BookMarked,    label: "القرآن",            desc: "مصحف رقمي كامل" },
  { href: "/fawaid",         Icon: Lightbulb,     label: "الفوائد",          desc: "فوائد منتقاة" },
  { href: "/qa",             Icon: HelpCircle,    label: "الأسئلة",           desc: "فتاوى موثّقة" },
  { href: "/tasbih",         Icon: RotateCw,      label: "التسبيح",          desc: "عداد إلكتروني" },
  { href: "/seerah",         Icon: Moon,          label: "السيرة",            desc: "حياته ﷺ كاملة" },
  { href: "/fatwa",          Icon: Scale,         label: "الفتاوى",           desc: "أحكام معاصرة" },
  { href: "/quiz",           Icon: Target,        label: "المسابقات",         desc: "اختبار المعلومات" },
  { href: "/muezzins",       Icon: Mic2,          label: "المؤذنون",          desc: "أجمل الأصوات" },
  { href: "/library",        Icon: BookOpen,      label: "المكتبة",           desc: "كتب ومتون علمية" },
  { href: "/prayer-times",   Icon: Compass,       label: "القِبلة",           desc: "اتجاه الكعبة" },
  { href: "/salah-guide",    Icon: Scroll,        label: "دليل الصلاة",       desc: "للمبتدئ والمتقن" },
  { href: "/calendar",       Icon: CalendarDays,  label: "التقويم",           desc: "التاريخ الهجري" },
];

const QUICK_SEARCHES = ["صلاة الفجر", "آية الكرسي", "دعاء القنوت", "أذكار الصباح", "صيام الاثنين", "حديث النية", "أركان الإسلام", "زكاة المال"];

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
      { href: "/islamic-stories", Icon: Landmark, title: "صحابة وفتوحات",    desc: "سير الصحابة والفتوحات" },
      { href: "/stories",         Icon: Map,      title: "القصص الإسلامية",  desc: "وقائع من التاريخ الإسلامي" },
    ],
  },
  {
    id: "fiqh",
    Icon: Scale,
    label: "الفقه والأحكام",
    items: [
      { href: "/qa",                 Icon: HelpCircle,   title: "الأسئلة والأجوبة",  desc: "فتاوى من العلماء" },
      { href: "/rulings",            Icon: Scale,        title: "الأحكام الشرعية",   desc: "موسوعة الفقه والعبادات" },
      { href: "/tawhid",             Icon: BookMarked,   title: "التوحيد",            desc: "العقيدة الإسلامية" },
      { href: "/arkan",              Icon: Landmark,     title: "أركان الإسلام",     desc: "الأركان الخمسة مع الأدلة والتفاصيل" },
      { href: "/arkan-iman",         Icon: Star,         title: "أركان الإيمان",     desc: "الأركان الستة مع الأدلة وأقوال العلماء" },
      { href: "/asma-husna",         Icon: Star,         title: "الأسماء الحسنى",    desc: "99 اسماً لله بمعانيها ومنافعها" },
      { href: "/akhlaq",             Icon: Heart,        title: "الأخلاق الإسلامية", desc: "مكارم الأخلاق مع الآيات والأحاديث" },
      { href: "/hadith-science",      Icon: Scroll,       title: "مصطلح الحديث",      desc: "30+ مصطلح في علوم الحديث والإسناد" },
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
      { href: "/duas",        Icon: Heart,       title: "الأدعية الشرعية",    desc: "25 دعاءً موثقاً مع المعنى والمصدر" },
      { href: "/duas-quran",  Icon: BookOpen,    title: "أدعية القرآن",        desc: "12 دعاءً قرآنياً للأنبياء والمؤمنين" },
      { href: "/fawaid",       Icon: Lightbulb,   title: "الفوائد الدينية",      desc: "فوائد علمية منتقاة" },
      { href: "/hikam-salaf",  Icon: BookOpen,    title: "حكم السلف الصالح",     desc: "أقوال الأئمة والصحابة والتابعين" },
      { href: "/fadail-aamal",      Icon: Star,      title: "فضائل الأعمال",         desc: "56+ حديث في فضائل العبادات والأخلاق" },
      { href: "/islamic-glossary",  Icon: BookOpen,       title: "المصطلحات الإسلامية",  desc: "قاموس شامل للمصطلحات في ستة علوم شرعية" },
      { href: "/adab-talab-ilm",   Icon: GraduationCap,  title: "آداب طالب العلم",      desc: "دليل طالب العلم من الفضل إلى الكتب المقررة" },
      { href: "/tawba",        Icon: RotateCw,    title: "التوبة والاستغفار",      desc: "شروط التوبة النصوح وأفضل صيغ الاستغفار" },
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
      { href: "/learning-path",   Icon: Map,         title: "خارطة طالب العلم",  desc: "مسار من المبتدئ إلى المتقدم" },
      { href: "/flashcards",      Icon: Layers,      title: "البطاقات الدعوية",   desc: "مراجعة ذكية" },
      { href: "/quiz",            Icon: Target,      title: "لعبة سؤال وجواب",   desc: "اختبر معلوماتك الإسلامية" },
      { href: "/assistant",       Icon: Bot,         title: "المساعد العلمي",    desc: "إرشاد فوري بالذكاء الاصطناعي" },
      { href: "/calendar",        Icon: CalendarDays, title: "التقويم الهجري",   desc: "التواريخ والأيام المميزة" },
      { href: "/knowledge-graph", Icon: Network,     title: "خارطة المعرفة التفاعلية",     desc: "علاقات المعرفة الإسلامية بالرسم البياني" },
      { href: "/knowledge-map",   Icon: Map,         title: "الخريطة المعرفية 2.0",         desc: "١٤ علماً إسلامياً مترابطاً" },
    ],
  },
  {
    id: "quran-hub",
    Icon: BookMarked,
    label: "القرآن الكريم",
    items: [
      { href: "/quran-hub",            Icon: BookMarked, title: "مركز القرآن",       desc: "جميع أقسام القرآن في مكان واحد" },
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

export default function HomePage() {
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();
  const quickSearch = (q: string) => { navigate(`/search/${encodeURIComponent(q)}`); };

  useEffect(() => {
    applyPageSeo({
      path: "/",
      title: "المجلس العلمي، منصة العلوم الإسلامية",
      description: "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم، الأذكار، الدروس العلمية، الفتاوى، والفقه المعاصر.",
      keywords: ["المجلس العلمي", "علوم إسلامية", "قرآن كريم", "أذكار", "فتاوى", "دروس علمية"],
    });
  }, []);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

  return (
    <div className="home-page home-page--v4" dir="rtl">
      <HijriSacredMonthBanner />
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      {/* ══════════════════ Hero ══════════════════ */}
      <section
        className="hpv4-hero"
        aria-label="الصفحة الرئيسية"
        style={{
          background: "linear-gradient(160deg, #1F4D3A 0%, #163728 55%, #0e2619 100%)",
          padding: "2rem 1rem 1.75rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", textAlign: "center" }}>
          {/* الشعار والاسم */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.65rem", marginBottom: "0.75rem" }}>
            <img src="/logo.png" alt="" width={50} height={50} loading="eager" aria-hidden="true"
              style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.25)" }} />
            <h1 style={{ color: "#fff", fontSize: "clamp(1.5rem, 5vw, 2.2rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              المجلس العلمي
            </h1>
          </div>

          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "clamp(0.85rem, 2.2vw, 0.97rem)", lineHeight: 1.65, maxWidth: 520, margin: "0 auto 1rem" }}>
            منصة علمية إسلامية للقرآن الكريم، الأحاديث النبوية الموثّقة، دروس علماء الكويت، الفقه والفتاوى، والأذكار اليومية
          </p>

          {/* شريحات الجمهور — تصميم جديد */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginBottom: "1.25rem" }}>
            {[
              { emoji: "🎓", label: "طالب العلم",      bg: "rgba(255,255,255,0.15)" },
              { emoji: "🕌", label: "المسلم اليومي",   bg: "rgba(255,255,255,0.10)" },
              { emoji: "👨‍👩‍👧", label: "الأسرة المسلمة", bg: "rgba(255,255,255,0.10)" },
              { emoji: "📖", label: "العالم والباحث",  bg: "rgba(255,255,255,0.10)" },
            ].map(({ emoji, label, bg }) => (
              <span key={label} style={{
                background: bg, color: "#fff",
                padding: "0.35rem 0.9rem", borderRadius: "999px",
                fontSize: "0.8rem", fontWeight: 700,
                border: "1px solid rgba(255,255,255,0.22)",
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
              }}>
                <span style={{ fontSize: "1rem" }}>{emoji}</span>{label}
              </span>
            ))}
          </div>

          {/* خانة البحث — مصغّرة وموضوعة بشكل ثانوي */}
          <form onSubmit={submitSearch} style={{
            display: "flex", gap: "0", borderRadius: "0.6rem", overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.25)", maxWidth: 460, margin: "0 auto 1.1rem",
          }} aria-label="البحث">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث في المنصة..."
              aria-label="البحث"
              style={{
                flex: 1, padding: "0.6rem 0.85rem", border: "none", outline: "none",
                fontSize: "0.88rem", direction: "rtl", fontFamily: "inherit",
                background: "rgba(255,255,255,0.96)"
              }}
            />
            <button type="submit" style={{
              background: "#2d7a5a", color: "#fff", border: "none", cursor: "pointer",
              padding: "0.6rem 1rem", fontWeight: 700, fontSize: "0.84rem", fontFamily: "inherit",
              whiteSpace: "nowrap"
            }}>بحث</button>
          </form>

          {/* أزرار الإجراء */}
          <div style={{ display: "flex", gap: "0.55rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/lessons" style={{
              background: "#fff", color: "#1F4D3A", padding: "0.6rem 1.3rem",
              borderRadius: "0.55rem", fontWeight: 800, fontSize: "0.88rem",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem"
            }}>🎓 الدروس</Link>
            <Link href="/quran" style={{
              background: "rgba(255,255,255,0.12)", color: "#fff", padding: "0.6rem 1.1rem",
              borderRadius: "0.55rem", fontWeight: 700, fontSize: "0.88rem",
              textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)"
            }}>📖 القرآن</Link>
            <Link href="/adhkar" style={{
              background: "rgba(255,255,255,0.12)", color: "#fff", padding: "0.6rem 1.1rem",
              borderRadius: "0.55rem", fontWeight: 700, fontSize: "0.88rem",
              textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)"
            }}>📿 الأذكار</Link>
            <Link href="/prayer-times" style={{
              background: "rgba(255,255,255,0.12)", color: "#fff", padding: "0.6rem 1.1rem",
              borderRadius: "0.55rem", fontWeight: 700, fontSize: "0.88rem",
              textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)"
            }}>🕐 الصلاة</Link>
          </div>
        </div>
      </section>

      {/* ══ زرتَ مؤخراً ══ */}
      <RecentPagesBar />

      {/* ══ وصول سريع — شبكة مفصّلة ══ */}
      <nav aria-label="وصول سريع" style={{ maxWidth: 760, margin: "1.25rem auto 0", padding: "0 1rem" }}>
        <p style={{ color: "#666", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>وصول سريع</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: "0.5rem",
        }}>
          {[...QUICK_LINKS, { href: "/sitemap", Icon: Layers, label: "كل الأقسام", desc: "خريطة الموقع" }].map(({ href, Icon: Ico, label, desc }) => (
            <Link key={label + href} href={href} aria-label={label} style={{
              display: "flex", alignItems: "center", gap: "0.55rem",
              padding: "0.6rem 0.7rem",
              background: "#fff",
              border: "1px solid #e8f0ec",
              borderRadius: "0.7rem",
              textDecoration: "none",
              transition: "border-color 0.13s, box-shadow 0.13s",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <span style={{ background: "#f0f7f4", color: "#1F4D3A", padding: "0.4rem", borderRadius: "0.4rem", display: "flex", flexShrink: 0 }}>
                <Ico size={15} strokeWidth={2} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#1a1a1a", fontSize: "0.78rem", fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
                <div style={{ color: "#888", fontSize: "0.68rem", lineHeight: 1.3, marginTop: 1 }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* ══ تذكير صيام ══ */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 1rem" }}>
        <HomeSawmReminder />
      </div>

      {/* ══════════════════ Main Content ══════════════════ */}
      <main className="home-container home-main home-main--v3">

        {/* الدروس والدورات */}
        <SafeHomeSection name="الدروس والدورات">
          <HomeUpcomingLessons />
          <HomeUpcomingCourses />
        </SafeHomeSection>

        {/* مواقيت الصلاة */}
        <SafeHomeSection name="مواقيت الصلاة">
          <HomeCompactPrayer />
        </SafeHomeSection>

        {/* التقدم اليومي */}
        <SafeHomeSection name="التقدم اليومي">
          <HomeDailyProgress />
        </SafeHomeSection>

        {/* سجل الأسبوع */}
        <SafeHomeSection name="سجل الأسبوع">
          <HomeWeekStreak />
        </SafeHomeSection>

        {/* اسم الله اليومي */}
        <SafeHomeSection name="اسم الله اليومي">
          <HomeAsmaCard />
        </SafeHomeSection>

        {/* حديث اليوم من الأربعين النووية */}
        <SafeHomeSection name="حديث اليوم">
          <HomeNawawiHadith />
        </SafeHomeSection>

        {/* سنن الوقت */}
        <SafeHomeSection name="سنن الوقت">
          <HomeSunnahByTime />
        </SafeHomeSection>

        {/* ══ استكشف المنصة ══ */}
        <section aria-labelledby="features-heading" style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <div style={{ width: 3, height: 22, background: "#1F4D3A", borderRadius: 2 }} />
            <h2 id="features-heading" style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
              استكشف المنصة
            </h2>
          </div>

          {/* بطاقات بارزة */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem",
            marginBottom: "2rem"
          }}>
            {FEATURED.map(({ href, Icon, title, desc, cta }) => (
              <Link key={href} href={href} aria-label={title} style={{
                display: "flex", flexDirection: "column", gap: "0.6rem",
                padding: "1.1rem 1rem", borderRadius: "1rem", textDecoration: "none",
                background: "linear-gradient(135deg, #1F4D3A 0%, #2d7a5a 100%)",
                color: "#fff", transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: "0 2px 8px rgba(31,77,58,0.2)"
              }}>
                <Icon size={24} strokeWidth={1.6} style={{ opacity: 0.9 }} />
                <strong style={{ fontSize: "0.97rem", fontWeight: 800 }}>{title}</strong>
                <p style={{ fontSize: "0.8rem", opacity: 0.82, lineHeight: 1.5, margin: 0 }}>{desc}</p>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, opacity: 0.9, marginTop: "auto" }}>{cta} ←</span>
              </Link>
            ))}
          </div>

          {/* أقسام بالتصنيف — تصميم جديد */}
          {FEATURE_CATS.map(cat => (
            <div key={cat.id} style={{ marginBottom: "1.75rem" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                marginBottom: "0.75rem", paddingBottom: "0.5rem",
                borderBottom: "2px solid #f0f7f4"
              }}>
                <span style={{
                  background: "#1F4D3A", color: "#fff", padding: "0.35rem",
                  borderRadius: "0.4rem", display: "flex"
                }}>
                  <cat.Icon size={15} strokeWidth={2} />
                </span>
                <h3 style={{ fontSize: "0.97rem", fontWeight: 800, color: "#1F4D3A", margin: 0 }}>{cat.label}</h3>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
                gap: "0.5rem"
              }}>
                {cat.items.map(({ href, Icon: ItemIcon, title, desc }) => (
                  <Link key={href} href={href} style={{
                    display: "flex", alignItems: "center", gap: "0.65rem",
                    padding: "0.7rem 0.8rem", borderRadius: "0.75rem",
                    textDecoration: "none", background: "#fff",
                    border: "1px solid #e8f0ec",
                    transition: "border-color 0.15s, box-shadow 0.15s, transform 0.12s",
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                  }}>
                    <span style={{
                      background: "#f0f7f4", color: "#1F4D3A",
                      padding: "0.4rem", borderRadius: "0.45rem",
                      display: "flex", flexShrink: 0
                    }}>
                      <ItemIcon size={15} strokeWidth={2} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{title}</strong>
                      <span style={{ fontSize: "0.71rem", color: "#777", lineHeight: 1.4, display: "block" }}>{desc}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* مواسم التعلم */}
        <SafeHomeSection name="مواسم التعلم">
          <HomeLearningSeasonsWidget />
        </SafeHomeSection>

        {/* المناسبات الإسلامية */}
        <SafeHomeSection name="المناسبات الإسلامية">
          <HomeIslamicOccasions />
        </SafeHomeSection>

        {/* آخر التحديثات */}
        <SafeHomeSection name="آخر التحديثات">
          <HomeLatestUpdates />
        </SafeHomeSection>

        {/* المكتبة العلمية */}
        <SafeHomeSection name="المكتبة العلمية">
          <HomeFeaturedLibrary />
        </SafeHomeSection>

        {/* لعبة المسابقة */}
        <SafeHomeSection name="المسابقة">
          <HomeQuizCard />
        </SafeHomeSection>

        {/* الركن اليومي */}
        <SafeHomeSection name="الركن اليومي">
          <HomeDailyCorner />
        </SafeHomeSection>

        {/* مراتب الناس في الصلاة */}
        <SafeHomeSection name="مراتب الصلاة">
          <HomePrayerRanks />
        </SafeHomeSection>

        {/* مواضيع مشوقة */}
        <SafeHomeSection name="مواضيع مشوقة">
          <HomeInterestingTopics />
        </SafeHomeSection>

        {/* الخرائط الذهنية */}
        <SafeHomeSection name="الخرائط الذهنية">
          <HomeMindMapSection />
        </SafeHomeSection>

        <SafeHomeSection name="عن المجلس العلمي">
          <HomeAboutSection />
        </SafeHomeSection>

      </main>
    </div>
  );
}
