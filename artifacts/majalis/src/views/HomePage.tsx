"use client";

import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomeCompactPrayer } from "@/components/home/HomeCompactPrayer";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeDailyHadith } from "@/components/home/HomeDailyHadith";
import { HomePrayerRanks } from "@/components/home/HomePrayerRanks";
import { HomeFeaturedLibrary } from "@/components/home/HomeFeaturedLibrary";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { HomeTawheed } from "@/components/home/HomeTawheed";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeRecommendations } from "@/components/home/HomeRecommendations";
import { IslamicDivider } from "@/components/design/IslamicDivider";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { HomeContinueReading } from "@/components/home/HomeContinueReading";
import { HijriSacredMonthBanner } from "@/components/HijriSacredMonthBanner";
import {
  BookOpen, GraduationCap, Moon, BookMarked, MessageCircleQuestion, Scale,
  Headphones, Star, Globe, Landmark, ScrollText, Layers,
} from "lucide-react";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function HomeQuranCirclesPreview() {
  return (
    <section className="home-section" aria-labelledby="circles-home-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">حفظ القرآن</p>
          <h2 id="circles-home-heading">حلقات التحفيظ</h2>
          <p style={{ color: "var(--elite-ink-soft, #4A4A4A)", fontSize: "0.875rem" }}>
            انضم لحلقة علمية متخصصة في حفظ القرآن ومراجعته.
          </p>
        </div>
        <Link href="/quran-circles" className="home-section-link">عرض الكل</Link>
      </div>
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          background: "var(--elite-sage-2, #F0FDF4)",
          borderRadius: "var(--elite-r-lg, 16px)",
          border: "1px solid var(--elite-border-green, rgba(22,101,52,0.15))",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🕌</div>
        <p style={{ color: "var(--elite-ink-soft, #4A4A4A)", fontSize: "0.875rem", margin: 0 }}>
          سيتوفر هنا عرض للحلقات القادمة — تواصل مع الإدارة لإضافة حلقتك.
        </p>
      </div>
    </section>
  );
}

const QUICK_LINKS = [
  { href: "/quran",        label: "القرآن",              meta: "مصحف وتلاوة" },
  { href: "/lessons",      label: "الدروس",              meta: "أحدث وقادمة" },
  { href: "/qa",           label: "الأسئلة",             meta: "فتاوى وإجابات" },
  { href: "/rulings",      label: "الأحكام",             meta: "موسوعة شرعية" },
  { href: "/library",      label: "المكتبة",             meta: "كتب ومتون" },
  { href: "/fawaid",       label: "الفوائد",             meta: "مختصرات" },
  { href: "/hadith",       label: "الأحاديث",            meta: "موثقة" },
  { href: "/stories",      label: "القصص",               meta: "إسلامية" },
  { href: "/adhkar",       label: "الأذكار",             meta: "يومي" },
  { href: "/assistant",    label: "المساعد",             meta: "علمي" },
  { href: "/calendar",     label: "التقويم",             meta: "دروس" },
  { href: "/muezzins",     label: "المؤذنون",            meta: "أذانات العالم" },
  { href: "/learning-plan", label: "خطة التعلّم",       meta: "مسار شخصي" },
  { href: "/flashcards",   label: "البطاقات",            meta: "مراجعة ذكية" },
  { href: "/car-mode",     label: "وضع السيارة",         meta: "صوتيات" },
  { href: "/vault",        label: "المحفظة",             meta: "محفوظاتك" },
  { href: "/researcher",   label: "ملف الباحث",          meta: "سيرتك البحثية" },
  { href: "/institutions", label: "المؤسسات",            meta: "مساجد وجامعات" },
];

const FEATURE_STRIP = [
  { href: "/quran",   Icon: BookOpen,             name: "القرآن",  meta: "اقرأ واستمع" },
  { href: "/lessons", Icon: GraduationCap,        name: "الدروس",  meta: "مباشر ومسجل" },
  { href: "/adhkar",  Icon: Moon,                 name: "الأذكار", meta: "يومية وموثقة" },
  { href: "/library", Icon: BookMarked,           name: "المكتبة", meta: "كتب ومتون" },
  { href: "/qa",      Icon: MessageCircleQuestion, name: "الأسئلة", meta: "فتاوى علمية" },
  { href: "/rulings", Icon: Scale,                name: "الأحكام", meta: "موسوعة شرعية" },
];

const PLATFORM_STATS = [
  { Icon: BookOpen,   value: "١٢٠٠+",  label: "درس علمي موثق" },
  { Icon: GraduationCap, value: "٥٠٠+", label: "شيخ وعالم" },
  { Icon: ScrollText, value: "٣٠٠٠+",  label: "كتاب ومرجع" },
  { Icon: Star,       value: "٢٧٠٠٠+", label: "مستخدم نشط" },
];

const PLATFORM_FEATURES = [
  {
    href: "/quran",
    Icon: BookOpen,
    name: "القرآن الكريم",
    desc: "المصحف الشريف مع التلاوات والتفسير والبحث الآيي",
  },
  {
    href: "/lessons",
    Icon: GraduationCap,
    name: "الدروس العلمية",
    desc: "أكثر من ألف درس موثق من علماء معتمدين، مباشر ومسجل",
  },
  {
    href: "/library",
    Icon: BookMarked,
    name: "المكتبة الإسلامية",
    desc: "آلاف الكتب والمتون والمصادر الشرعية المنظمة",
  },
  {
    href: "/rulings",
    Icon: Scale,
    name: "الأحكام الشرعية",
    desc: "موسوعة شاملة في الفقه الإسلامي والفتاوى الموثقة",
  },
  {
    href: "/seerah",
    Icon: Globe,
    name: "السيرة النبوية",
    desc: "حياة النبي ﷺ من الميلاد إلى الوفاة بالتفصيل",
  },
  {
    href: "/adhkar",
    Icon: Moon,
    name: "الأذكار اليومية",
    desc: "أذكار الصباح والمساء ودعاء الأوقات بأسانيدها",
  },
  {
    href: "/muezzins",
    Icon: Headphones,
    name: "مكتبة الأذانات",
    desc: "استمع إلى أصوات المؤذنين من أشهر المساجد حول العالم",
  },
  {
    href: "/institutions",
    Icon: Landmark,
    name: "دليل المؤسسات",
    desc: "مساجد وجامعات ومراكز إسلامية في العالم العربي والإسلامي",
  },
];

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>;
}

export default function HomePage({
  initialFeaturedLessons,
}: {
  initialFeaturedLessons?: KuwaitLessonRecord[];
} = {}) {
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();

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

            {/* 1. وحدة الهوية: أيقونة + شعار خطي معًا — كتلة بصرية واحدة */}
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
              <h1 className="home-hero-title home-hero-title--v3">
                <img
                  src="/logo-calligraphy.png"
                  alt="المجلس العلمي"
                  className="home-hero-calligraphy"
                  loading="eager"
                  decoding="async"
                />
              </h1>
            </div>

            {/* 2. الجملة التعريفية */}
            <span className="home-hero-badge">
              نؤمن أن التقنية وسيلة، ورسالتنا أن نجعلها في خدمة الإسلام والمعرفة النافعة
            </span>

            {/* 4. شريط البحث */}
            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label="البحث">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث في القرآن والأحاديث..."
                aria-label="البحث في التطبيق"
              />
              <button type="submit">بحث</button>
            </form>

          </div>
        </div>
      </section>

      {/* ══════════════════ Feature Strip ══════════════════ */}
      <div className="home-container" style={{ paddingTop: "1.5rem", paddingBottom: "0.75rem" }}>
        <div className="home-feature-strip">
          {FEATURE_STRIP.map(({ href, Icon, name, meta }) => (
            <Link key={href} href={href} className="home-feature-strip-card">
              <span className="home-feature-strip-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.7} />
              </span>
              <span className="home-feature-strip-name">{name}</span>
              <span className="home-feature-strip-meta">{meta}</span>
            </Link>
          ))}
        </div>
      </div>


      {/* ══════════════════ Main Content ══════════════════ */}
      <main className="home-container home-main home-main--v3">

        {/* الدروس — أهم محتوى */}
        <SafeHomeSection name="أحدث الدروس">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <IslamicDivider />

        {/* التوحيد */}
        <SafeHomeSection name="التوحيد">
          <HomeTawheed />
        </SafeHomeSection>

        <IslamicDivider />

        {/* حلقات التحفيظ */}
        <SafeHomeSection name="حلقات التحفيظ">
          <HomeQuranCirclesPreview />
        </SafeHomeSection>

        <IslamicDivider />

        {/* مواقيت الصلاة */}
        <SafeHomeSection name="مواقيت الصلاة">
          <HomeCompactPrayer />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="تابع من حيث توقفت">
          <HomeContinueReading />
        </SafeHomeSection>

        <SafeHomeSection name="توصيات مخصصة">
          <HomeRecommendations />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="مواسم التعلّم">
          <HomeLearningSeasonsWidget />
        </SafeHomeSection>

        <IslamicDivider />

        {/* خارطة طالب العلم */}
        <section className="home-section ds-section">
          <Link href="/learning-path" style={{ textDecoration: "none", display: "block" }}>
            <div className="home-learning-path-card">
              <span className="home-learning-path-card-icon" aria-hidden="true">🗺️</span>
              <div className="home-learning-path-card-body">
                <p className="home-learning-path-card-title">ابدأ طلب العلم — خارطة طالب العلم</p>
                <p className="home-learning-path-card-desc">
                  مسار علمي منظم في العقيدة والحديث والفقه والتفسير وغيرها،
                  كتاباً كتاباً من المبتدئ إلى المتقدم.
                </p>
              </div>
              <span className="home-learning-path-card-arrow" aria-hidden="true">←</span>
            </div>
          </Link>
        </section>

        <IslamicDivider />

        {/* لعبة سؤال وجواب */}
        <section className="home-section ds-section">
          <Link href="/quiz" style={{ textDecoration: "none", display: "block" }}>
            <div className="home-quiz-card">
              <span className="home-quiz-card-icon" aria-hidden="true">⭐</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="home-quiz-card-title">لعبة سؤال وجواب الإسلامية</p>
                <p className="home-quiz-card-desc">
                  تنافس مع فريقك في أسئلة القرآن والحديث والفقه والتاريخ الإسلامي
                </p>
              </div>
              <span className="home-quiz-card-btn">ابدأ اللعب ←</span>
            </div>
          </Link>
        </section>

        <IslamicDivider />

        <SafeHomeSection name="الدورات">
          <HomeUpcomingCourses />
        </SafeHomeSection>

        <IslamicDivider />

        {/* أقسام التطبيق */}
        <section className="home-section ds-section">
          <div className="ds-section__head">
            <h2 className="ds-section__title">استكشف جميع الأقسام</h2>
            <Link href="/settings" className="ds-section__link">الإعدادات</Link>
          </div>
          <div className="home-quick-grid">
            {QUICK_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="home-quick-link">
                {item.label}
                <span>{item.meta}</span>
              </Link>
            ))}
          </div>
        </section>

        <IslamicDivider />

        {/* محتوى يومي */}
        <section className="home-daily-row">
          <SafeHomeSection name="ذكر اليوم">
            <HomeDailyDhikr />
          </SafeHomeSection>
          <SafeHomeSection name="حديث اليوم">
            <HomeDailyHadith />
          </SafeHomeSection>
          <SafeHomeSection name="سؤال اليوم">
            <HomeDailyQuestion />
          </SafeHomeSection>
          <SafeHomeSection name="فائدة اليوم">
            <HomeDailyFaida />
          </SafeHomeSection>
        </section>

        <IslamicDivider />

        <SafeHomeSection name="مراتب الصلاة">
          <HomePrayerRanks />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="المكتبة">
          <HomeFeaturedLibrary />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="آخر التحديثات">
          <HomeLatestUpdates />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="عن المجلس العلمي">
          <HomeAboutSection />
        </SafeHomeSection>

        <IslamicDivider />

        {/* القصص والسِّيَر */}
        <section className="home-section home-stories-section" aria-labelledby="stories-home-heading">
          <div className="home-section-head">
            <div>
              <p className="home-eyebrow">التاريخ الإسلامي</p>
              <h2 id="stories-home-heading">القصص والسِّيَر</h2>
            </div>
          </div>
          <div className="home-stories-grid">
            {[
              { href: "/prophets",        icon: "⭐", title: "قصص الأنبياء",     desc: "من آدم إلى محمد ﷺ — قصص الرسل والأنبياء" },
              { href: "/islamic-stories", icon: "🏛",  title: "صحابة وفتوحات",   desc: "سير الصحابة الكرام والفتوحات الإسلامية" },
              { href: "/stories",         icon: "📖", title: "القصص الإسلامية", desc: "قصص ووقائع من تاريخ الإسلام العريق" },
              { href: "/seerah",          icon: "🌙", title: "السيرة النبوية",   desc: "حياة النبي محمد ﷺ من الميلاد إلى الوفاة" },
            ].map(({ href, icon, title, desc }) => (
              <Link key={href} href={href} className="home-story-card">
                <span className="home-story-card__icon" aria-hidden="true">{icon}</span>
                <div className="home-story-card__body">
                  <strong className="home-story-card__title">{title}</strong>
                  <span className="home-story-card__desc">{desc}</span>
                </div>
                <span className="home-story-card__arrow" aria-hidden="true">←</span>
              </Link>
            ))}
          </div>
        </section>

        <IslamicDivider />

        <SafeHomeSection name="المزيد من الأقسام">
          <HomeMoreSections />
        </SafeHomeSection>

      </main>
    </div>
  );
}
