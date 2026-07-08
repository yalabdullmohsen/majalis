"use client";

import { useEffect, useState, type FormEvent } from "react";
import { applyPageSeo } from "@/lib/seo";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeCompactPrayer } from "@/components/home/HomeCompactPrayer";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeDailyCorner } from "@/components/home/HomeDailyCorner";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { HijriSacredMonthBanner } from "@/components/HijriSacredMonthBanner";

/* ── روابط الوصول السريع ── */
const QUICK_LINKS = [
  { href: "/quran",          icon: "📖", label: "القرآن" },
  { href: "/adhkar",         icon: "📿", label: "الأذكار" },
  { href: "/prayer-times",   icon: "🕌", label: "أوقات الصلاة" },
  { href: "/lessons",        icon: "🎓", label: "الدروس" },
  { href: "/hadith",         icon: "📜", label: "الأحاديث" },
  { href: "/fawaid",         icon: "💡", label: "الفوائد" },
  { href: "/qa",             icon: "❓", label: "الأسئلة" },
  { href: "/tasbih",         icon: "📿", label: "التسبيح" },
  { href: "/seerah",         icon: "🌙", label: "السيرة" },
  { href: "/flashcards",     icon: "🃏", label: "البطاقات" },
  { href: "/fatwa",          icon: "⚖️", label: "الفتاوى" },
  { href: "/quiz",           icon: "🎯", label: "المسابقات" },
  { href: "/occasions",      icon: "🌙", label: "المناسبات" },
  { href: "/muezzins",       icon: "🎙️", label: "المؤذنون" },
  { href: "/updates",        icon: "📰", label: "المستجدات" },
];

const QUICK_SEARCHES = ["صلاة الفجر", "آية الكرسي", "دعاء القنوت", "أذكار الصباح", "صيام الاثنين", "حديث النية", "أركان الإسلام", "زكاة المال"];

/* ── المميزات البارزة (4 بطاقات كبيرة) ── */
const FEATURED = [
  { href: "/quran",   icon: "📖", title: "القرآن الكريم",     desc: "مصحف رقمي كامل برواية حفص — تصفح الصفحات ببساطة",          cta: "افتح المصحف" },
  { href: "/lessons", icon: "🎓", title: "الدروس العلمية",    desc: "دروس ومحاضرات مجدولة لهذا الأسبوع من علماء الكويت",        cta: "شاهد الدروس" },
  { href: "/hadith",  icon: "📜", title: "الأحاديث النبوية",  desc: "أحاديث موثقة ومسندة مع الشرح والتخريج",                   cta: "تصفح الأحاديث" },
  { href: "/library", icon: "📚", title: "المكتبة العلمية",   desc: "كتب شرعية ومتون علمية في الفقه والعقيدة والتفسير والحديث",  cta: "استعرض الكتب" },
];

/* ── أقسام مصنّفة ── */
const FEATURE_CATS = [
  {
    id: "seerah",
    icon: "🌙",
    label: "السيرة والتاريخ",
    items: [
      { href: "/seerah",          icon: "🌙", title: "السيرة النبوية",    desc: "حياته ﷺ من الميلاد إلى الوفاة" },
      { href: "/prophets",        icon: "⭐", title: "قصص الأنبياء",     desc: "من آدم إلى محمد ﷺ" },
      { href: "/islamic-stories", icon: "🏛", title: "صحابة وفتوحات",    desc: "سير الصحابة والفتوحات" },
      { href: "/stories",         icon: "🗺️", title: "القصص الإسلامية",  desc: "وقائع من التاريخ الإسلامي" },
    ],
  },
  {
    id: "fiqh",
    icon: "⚖️",
    label: "الفقه والأحكام",
    items: [
      { href: "/qa",                 icon: "❓", title: "الأسئلة والأجوبة",  desc: "فتاوى من العلماء" },
      { href: "/rulings",            icon: "⚖️", title: "الأحكام الشرعية",  desc: "موسوعة الفقه والعبادات" },
      { href: "/tawhid",             icon: "🕋", title: "التوحيد",           desc: "العقيدة الإسلامية" },
      { href: "/scholarly-research", icon: "🔬", title: "الباحث الشرعي",    desc: "بحث بالذكاء الاصطناعي" },
      { href: "/academic-research",  icon: "🎓", title: "الأبحاث العلمية",  desc: "رسائل وأبحاث أكاديمية" },
    ],
  },
  {
    id: "haramain",
    icon: "🕋",
    label: "الحرمان الشريفان",
    items: [
      { href: "/lessons?filter=haramain", icon: "🕋", title: "دروس المسجد الحرام",    desc: "دروس مكة المكرمة والمسجد الحرام" },
      { href: "/lessons?filter=nabawi",   icon: "🕌", title: "دروس المسجد النبوي",    desc: "دروس المدينة المنورة والمسجد النبوي" },
      { href: "/fiqh-council",            icon: "⚖️", title: "المجمع الفقهي",          desc: "قرارات المجامع الفقهية الكبرى" },
      { href: "/annual-courses",          icon: "🎓", title: "الدورات العلمية",         desc: "دورات العلماء والمؤسسات الشرعية" },
    ],
  },
  {
    id: "worship",
    icon: "📿",
    label: "العبادة والأذكار",
    items: [
      { href: "/adhkar",      icon: "📿", title: "الأذكار",              desc: "أذكار الصباح والمساء" },
      { href: "/fawaid",      icon: "💡", title: "الفوائد الدينية",      desc: "فوائد علمية منتقاة" },
      { href: "/car-mode",    icon: "🚗", title: "وضع السيارة",          desc: "تلاوات أثناء القيادة" },
      { href: "/daily-wird",  icon: "📖", title: "الورد اليومي",         desc: "ختم يومي منتظم للقرآن" },
      { href: "/occasions",   icon: "🌙", title: "المناسبات الإسلامية",  desc: "أحداث دينية مع أعمالها" },
      { href: "/tasbih",      icon: "📿", title: "التسبيح والذكر",       desc: "عداد تسبيح إلكتروني" },
    ],
  },
  {
    id: "tools",
    icon: "🛠",
    label: "أدوات التعلم",
    items: [
      { href: "/learning-path",   icon: "🗺️", title: "خارطة طالب العلم",  desc: "مسار من المبتدئ إلى المتقدم" },
      { href: "/flashcards",      icon: "🃏", title: "البطاقات الدعوية",   desc: "مراجعة ذكية" },
      { href: "/quiz",            icon: "🎯", title: "لعبة سؤال وجواب",   desc: "اختبر معلوماتك الإسلامية" },
      { href: "/assistant",       icon: "🤖", title: "المساعد العلمي",    desc: "إرشاد فوري بالذكاء الاصطناعي" },
      { href: "/calendar",        icon: "📅", title: "التقويم الهجري",    desc: "التواريخ والأيام المميزة" },
      { href: "/knowledge-graph", icon: "🗺️", title: "خارطة المعرفة",    desc: "علاقات المعرفة الإسلامية" },
    ],
  },
  {
    id: "digital",
    icon: "💻",
    label: "الأدوات الرقمية",
    items: [
      { href: "/qibla",        icon: "🧭",  title: "اتجاه القبلة",     desc: "بوصلة لمعرفة اتجاه الكعبة" },
      { href: "/prayer-times", icon: "🕌",  title: "مواقيت الصلاة",    desc: "أوقات دقيقة للكويت" },
      { href: "/muezzins",     icon: "🎙️", title: "مكتبة المؤذنين",  desc: "تلاوات وأذان بأجمل الأصوات" },
      { href: "/quran-radio",  icon: "📻",  title: "إذاعة القرآن",     desc: "بث مستمر للقرآن الكريم" },
      { href: "/submit",       icon: "📤",  title: "أضف محتوى",        desc: "ساهم في إثراء المنصة" },
    ],
  },
];

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>;
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
          { value: "٧٣+",  label: "كتاب شرعي" },
          { value: "٥٠+",  label: "عالم وشيخ" },
          { value: "٤٨٩+", label: "سؤال تعليمي" },
          { value: "٦٠٤",  label: "صفحة مصحف" },
        ].map(({ value, label }) => (
          <div key={label} className="hp-stat-item">
            <strong className="hp-stat-value">{value}</strong>
            <span className="hp-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ══ وصول سريع ══ */}
      <nav className="hp-quick-nav" aria-label="وصول سريع">
        <div className="hp-quick-nav__track">
          {QUICK_LINKS.map(({ href, icon, label }) => (
            <Link key={href} href={href} className="hp-quick-link">
              <span className="hp-quick-link__icon">{icon}</span>
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

        {/* مواقيت الصلاة */}
        <SafeHomeSection name="مواقيت الصلاة">
          <HomeCompactPrayer />
        </SafeHomeSection>

        {/* ══ استكشف المنصة — تسويقي ══ */}
        <section className="hp-features" aria-labelledby="features-heading">
          <div className="hp-features__head">
            <p className="home-eyebrow">استكشف المنصة</p>
            <h2 id="features-heading">ما يقدمه المجلس العلمي</h2>
          </div>

          {/* مميزات بارزة */}
          <div className="hp-featured-grid">
            {FEATURED.map(({ href, icon, title, desc, cta }) => (
              <Link key={href} href={href} className="hp-featured-card">
                <div className="hp-featured-card__icon" aria-hidden="true">{icon}</div>
                <div className="hp-featured-card__body">
                  <strong className="hp-featured-card__title">{title}</strong>
                  <p className="hp-featured-card__desc">{desc}</p>
                </div>
                <span className="hp-featured-card__cta">{cta} →</span>
              </Link>
            ))}
          </div>

          {/* أقسام بالتصنيف */}
          {FEATURE_CATS.map(cat => (
            <div key={cat.id} className="hp-cat">
              <div className="hp-cat__head">
                <span className="hp-cat__icon" aria-hidden="true">{cat.icon}</span>
                <h3 className="hp-cat__title">{cat.label}</h3>
              </div>
              <div className="hp-cat__grid">
                {cat.items.map(({ href, icon, title, desc }) => (
                  <Link key={href} href={href} className="hp-cat-card">
                    <span className="hp-cat-card__icon" aria-hidden="true">{icon}</span>
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

        {/* الركن اليومي — مدمج */}
        <SafeHomeSection name="الركن اليومي">
          <HomeDailyCorner />
        </SafeHomeSection>

        <SafeHomeSection name="عن المجلس العلمي">
          <HomeAboutSection />
        </SafeHomeSection>

      </main>
    </div>
  );
}
