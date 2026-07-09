"use client";

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
import { HomeIslamicOccasions } from "@/components/home/HomeIslamicOccasions";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomePrayerRanks } from "@/components/home/HomePrayerRanks";
import { HomeFeaturedLibrary } from "@/components/home/HomeFeaturedLibrary";
import { HomeQuizCard } from "@/components/home/HomeQuizCard";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { HijriSacredMonthBanner } from "@/components/HijriSacredMonthBanner";
import {
  BookMarked, BookOpen, Bot, Building2, CalendarDays, Car, Clock,
  Compass, FlaskConical, GraduationCap, Heart, HelpCircle, Landmark, Layers,
  Lightbulb, Map, Mic2, Monitor, Moon, Network, Newspaper,
  Radio, RotateCw, Scale, Scroll, Star, Target, Upload, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── روابط الوصول السريع ── */
const QUICK_LINKS: { href: string; Icon: LucideIcon; label: string }[] = [
  { href: "/quran",        Icon: BookMarked,    label: "القرآن" },
  { href: "/adhkar",       Icon: Star,          label: "الأذكار" },
  { href: "/prayer-times", Icon: Clock,         label: "أوقات الصلاة" },
  { href: "/lessons",      Icon: GraduationCap, label: "الدروس" },
  { href: "/hadith",       Icon: Scroll,        label: "الأحاديث" },
  { href: "/fawaid",       Icon: Lightbulb,     label: "الفوائد" },
  { href: "/qa",           Icon: HelpCircle,    label: "الأسئلة" },
  { href: "/tasbih",       Icon: Layers,        label: "التسبيح" },
  { href: "/seerah",       Icon: Moon,          label: "السيرة" },
  { href: "/fatwa",        Icon: Scale,         label: "الفتاوى" },
  { href: "/quiz",         Icon: Target,        label: "المسابقات" },
  { href: "/muezzins",     Icon: Mic2,          label: "المؤذنون" },
  { href: "/updates",      Icon: Newspaper,     label: "المستجدات" },
  { href: "/library",      Icon: BookOpen,      label: "المكتبة" },
];

const QUICK_SEARCHES = ["صلاة الفجر", "آية الكرسي", "دعاء القنوت", "أذكار الصباح", "صيام الاثنين", "حديث النية", "أركان الإسلام", "زكاة المال"];

/* ── المميزات البارزة (4 بطاقات كبيرة) ── */
const FEATURED: { href: string; Icon: LucideIcon; title: string; desc: string; cta: string }[] = [
  { href: "/quran",   Icon: BookMarked,    title: "القرآن الكريم",    desc: "مصحف رقمي كامل برواية حفص — تصفح الصفحات ببساطة",         cta: "افتح المصحف" },
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
      { href: "/scholarly-research", Icon: FlaskConical, title: "الباحث الشرعي",     desc: "بحث بالذكاء الاصطناعي" },
      { href: "/academic-research",  Icon: GraduationCap, title: "الأبحاث العلمية", desc: "رسائل وأبحاث أكاديمية" },
    ],
  },
  {
    id: "haramain",
    Icon: Building2,
    label: "الحرمان الشريفان",
    items: [
      { href: "/lessons?filter=haramain", Icon: Building2,    title: "دروس المسجد الحرام",  desc: "دروس مكة المكرمة والمسجد الحرام" },
      { href: "/lessons?filter=nabawi",   Icon: Landmark,     title: "دروس المسجد النبوي",  desc: "دروس المدينة المنورة والمسجد النبوي" },
      { href: "/fiqh-council",            Icon: Scale,        title: "المجمع الفقهي",        desc: "قرارات المجامع الفقهية الكبرى" },
      { href: "/annual-courses",          Icon: GraduationCap, title: "الدورات العلمية",     desc: "دورات العلماء والمؤسسات الشرعية" },
    ],
  },
  {
    id: "worship",
    Icon: RotateCw,
    label: "العبادة والأذكار",
    items: [
      { href: "/adhkar",      Icon: Star,        title: "الأذكار",              desc: "أذكار الصباح والمساء" },
      { href: "/duas",        Icon: Heart,       title: "الأدعية الشرعية",    desc: "25 دعاءً موثقاً مع المعنى والمصدر" },
      { href: "/fawaid",      Icon: Lightbulb,   title: "الفوائد الدينية",      desc: "فوائد علمية منتقاة" },
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
      { href: "/quran",                Icon: BookOpen,   title: "المصحف الشريف",     desc: "٦٠٤ صفحة كاملة برواية حفص" },
      { href: "/quran/surah-stories",  Icon: Star,       title: "قصص القرآن",        desc: "أسباب النزول و١١٤ سورة" },
      { href: "/quran/tajweed",        Icon: Mic2,       title: "علم التجويد",        desc: "أحكام التجويد الشاملة" },
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
      title: "المجلس العلمي — منصة العلوم الإسلامية",
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
    <div className="home-page home-page--v3">
      <HijriSacredMonthBanner />
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      {/* ══════════════════ Hero ══════════════════ */}
      <section className="home-hero home-hero--v3" aria-label="الصفحة الرئيسية">
        <div className="home-container home-hero-grid home-hero-grid--v3">
          <div className="home-hero-copy home-hero-copy--v3">
            <div className="home-hero-identity">
              <img
                src="/logo.png"
                alt=""
                className="home-hero-logo"
                width={52}
                height={52}
                loading="eager"
                decoding="async"
                aria-hidden="true"
              />
              <h1 className="home-hero-title home-hero-title--v3">المجلس العلمي</h1>
            </div>

            <span className="home-hero-badge">
              نؤمن أن التقنية وسيلة، ورسالتنا أن نجعلها في خدمة الإسلام والمعرفة النافعة
            </span>

            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label="البحث">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث في القرآن والأحاديث والفوائد..."
                aria-label="البحث في التطبيق"
              />
              <button type="submit">بحث</button>
            </form>
            <div className="home-quick-searches" aria-label="بحث سريع">
              {QUICK_SEARCHES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => quickSearch(q)}
                  className="home-quick-search-chip"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ إحصائيات المنصة ══ */}
      <div className="hp-stats-bar" aria-label="إحصائيات المنصة">
        {[
          { value: "١٠٨",  label: "كتاب شرعي" },
          { value: "٧٦+",  label: "عالم وشيخ" },
          { value: "٦٨٠+", label: "سؤال تعليمي" },
          { value: "٦٠٤",  label: "صفحة مصحف" },
        ].map(({ value, label }) => (
          <div key={label} className="hp-stat-item">
            <strong className="hp-stat-value">{value}</strong>
            <span className="hp-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ══ زرتَ مؤخراً ══ */}
      <RecentPagesBar />

      {/* ══ وصول سريع ══ */}
      <nav className="hp-quick-nav" aria-label="وصول سريع">
        <div className="hp-quick-nav__track">
          {QUICK_LINKS.map(({ href, Icon, label }) => (
            <Link key={href} href={href} className="hp-quick-link" aria-label={label}>
              <span className="hp-quick-link__icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <span className="hp-quick-link__label">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* ══════════════════ Main Content ══════════════════ */}
      <main className="home-container home-main home-main--v3">

        {/* الدروس — أول قسم */}
        <SafeHomeSection name="الدروس">
          <HomeUpcomingLessons />
        </SafeHomeSection>

        {/* الدورات القادمة */}
        <SafeHomeSection name="الدورات القادمة">
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

        {/* سنن الوقت */}
        <SafeHomeSection name="سنن الوقت">
          <HomeSunnahByTime />
        </SafeHomeSection>

        {/* ══ استكشف المنصة — تسويقي ══ */}
        <section className="hp-features" aria-labelledby="features-heading">
          <div className="hp-features__head">
            <p className="home-eyebrow">استكشف المنصة</p>
            <h2 id="features-heading">ما يقدمه المجلس العلمي</h2>
          </div>

          {/* مميزات بارزة */}
          <div className="hp-featured-grid">
            {FEATURED.map(({ href, Icon, title, desc, cta }) => (
              <Link key={href} href={href} className="hp-featured-card" aria-label={title}>
                <div className="hp-featured-card__icon" aria-hidden="true">
                  <Icon size={28} strokeWidth={1.6} />
                </div>
                <div className="hp-featured-card__body">
                  <strong className="hp-featured-card__title">{title}</strong>
                  <p className="hp-featured-card__desc">{desc}</p>
                </div>
                <span className="hp-featured-card__cta" aria-hidden="true">{cta} ←</span>
              </Link>
            ))}
          </div>

          {/* أقسام بالتصنيف */}
          {FEATURE_CATS.map(cat => (
            <div key={cat.id} className="hp-cat">
              <div className="hp-cat__head">
                <span className="hp-cat__icon" aria-hidden="true">
                  <cat.Icon size={18} strokeWidth={1.8} />
                </span>
                <h3 className="hp-cat__title">{cat.label}</h3>
              </div>
              <div className="hp-cat__grid">
                {cat.items.map(({ href, Icon: ItemIcon, title, desc }) => (
                  <Link key={href} href={href} className="hp-cat-card">
                    <span className="hp-cat-card__icon" aria-hidden="true">
                      <ItemIcon size={18} strokeWidth={1.8} />
                    </span>
                    <div className="hp-cat-card__body">
                      <strong className="hp-cat-card__title">{title}</strong>
                      <span className="hp-cat-card__desc">{desc}</span>
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

        {/* الركن اليومي — مدمج */}
        <SafeHomeSection name="الركن اليومي">
          <HomeDailyCorner />
        </SafeHomeSection>

        {/* مراتب الناس في الصلاة */}
        <SafeHomeSection name="مراتب الصلاة">
          <HomePrayerRanks />
        </SafeHomeSection>

        <SafeHomeSection name="عن المجلس العلمي">
          <HomeAboutSection />
        </SafeHomeSection>

      </main>
    </div>
  );
}
