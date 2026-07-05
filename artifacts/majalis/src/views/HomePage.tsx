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
import { IslamicOrnament } from "@/components/design/IslamicOrnament";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { HomeContinueReading } from "@/components/home/HomeContinueReading";
import { HijriSacredMonthBanner } from "@/components/HijriSacredMonthBanner";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function HomeQuranCirclesPreview() {
  return (
    <section className="home-section" aria-labelledby="circles-home-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">حفظ القرآن</p>
          <h2 id="circles-home-heading">حلقات التحفيظ</h2>
          <p>انضم لحلقة علمية متخصصة في حفظ القرآن ومراجعته.</p>
        </div>
        <Link href="/quran-circles" className="home-section-link">عرض الكل</Link>
      </div>
      <p style={{ color: "var(--majalis-ink-soft)", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>
        🕌 سيتوفر هنا عرض للحلقات القادمة — تواصل مع الإدارة لإضافة حلقتك.
      </p>
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
  { href: "/muezzins",     label: "مكتبة المؤذنين",      meta: "أذانات العالم" },
  { href: "/learning-plan", label: "خطة التعلّم",       meta: "مسار شخصي" },
  { href: "/flashcards",   label: "البطاقات",            meta: "مراجعة ذكية" },
  { href: "/car-mode",     label: "وضع السيارة",         meta: "صوتيات" },
  { href: "/vault",        label: "المحفظة العلمية",     meta: "محفوظاتك" },
  { href: "/researcher",   label: "ملف الباحث",          meta: "سيرتك البحثية" },
  { href: "/institutions", label: "دليل المؤسسات",       meta: "مساجد وجامعات" },
];

const FEATURE_STRIP = [
  { href: "/quran",   icon: "📖", name: "القرآن",  meta: "اقرأ واستمع" },
  { href: "/lessons", icon: "🎓", name: "الدروس",  meta: "مباشر ومسجل" },
  { href: "/adhkar",  icon: "📿", name: "الأذكار", meta: "يومية وموثقة" },
  { href: "/library", icon: "📚", name: "المكتبة", meta: "كتب ومتون" },
  { href: "/qa",      icon: "💬", name: "الأسئلة", meta: "فتاوى علمية" },
  { href: "/rulings", icon: "⚖️", name: "الأحكام", meta: "موسوعة شرعية" },
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

      {/* ── Hero ── */}
      <section className="home-hero home-hero--v3">
        <div className="home-container home-hero-grid home-hero-grid--v3">
          <div className="home-hero-copy home-hero-copy--v3">
            {/* شارة علوية */}
            <span className="home-hero-badge" aria-hidden="true">
              ✦ منصة علمية متكاملة
            </span>

            <img
              src="/logo.png"
              alt="المجلس العلمي"
              className="home-hero-logo"
              width={72}
              height={72}
              loading="eager"
              decoding="async"
            />
            <h1 className="home-hero-title home-hero-title--v3">المجلس العلمي</h1>
            <p className="home-hero-lead home-hero-lead--v3">
              دروس وفتاوى وقرآن ومحتوى موثّق في تطبيق واحد.
            </p>

            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label="البحث">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث في التطبيق..."
                aria-label="البحث في التطبيق"
              />
              <button type="submit">بحث</button>
            </form>

          </div>
        </div>
        <IslamicOrnament
          className="islamic-ornament-strip"
          style={{ color: "rgba(14, 110, 82, 0.30)", position: "relative", zIndex: 2 }}
        />
      </section>

      {/* ── Feature Strip ── */}
      <div className="home-container" style={{ paddingTop: "1rem", paddingBottom: "0.5rem" }}>
        <div className="home-feature-strip">
          {FEATURE_STRIP.map((item) => (
            <Link key={item.href} href={item.href} className="home-feature-strip-card">
              <span className="home-feature-strip-icon" aria-hidden="true">{item.icon}</span>
              <span className="home-feature-strip-name">{item.name}</span>
              <span className="home-feature-strip-meta">{item.meta}</span>
            </Link>
          ))}
        </div>
      </div>

      <main className="home-container home-main home-main--v3">

        {/* الدروس أولاً — أهم محتوى في التطبيق */}
        <SafeHomeSection name="أحدث الدروس">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <IslamicDivider />

        {/* التوحيد — العقيدة أساس الدين */}
        <SafeHomeSection name="التوحيد">
          <HomeTawheed />
        </SafeHomeSection>

        <IslamicDivider />

        {/* معاينة حلقات التحفيظ */}
        <SafeHomeSection name="حلقات التحفيظ">
          <HomeQuranCirclesPreview />
        </SafeHomeSection>

        <IslamicDivider />

        {/* مواقيت الصلاة */}
        <SafeHomeSection name="مواقيت الصلاة المدمجة">
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

        {/* بطاقة خارطة طالب العلم */}
        <section className="home-section ds-section">
          <Link href="/learning-path" style={{ textDecoration: "none", display: "block" }}>
            <div className="home-learning-path-card">
              <span className="home-learning-path-card-icon">🗺️</span>
              <div className="home-learning-path-card-body">
                <p className="home-learning-path-card-title">ابدأ طلب العلم — خارطة طالب العلم</p>
                <p className="home-learning-path-card-desc">
                  مسار علمي منظم في العقيدة والحديث والفقه والتفسير وغيرها،
                  كتاباً كتاباً من المبتدئ إلى المتقدم.
                </p>
              </div>
              <span className="home-learning-path-card-arrow">←</span>
            </div>
          </Link>
        </section>

        <IslamicDivider />

        {/* بطاقة لعبة سؤال وجواب */}
        <section className="home-section ds-section">
          <Link href="/quiz" style={{ textDecoration: "none", display: "block" }}>
            <div className="home-quiz-card">
              <span className="home-quiz-card-icon">🕌</span>
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
            <h2 className="ds-section__title">أقسام التطبيق</h2>
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

        <SafeHomeSection name="المزيد من الأقسام">
          <HomeMoreSections />
        </SafeHomeSection>

      </main>
    </div>
  );
}
