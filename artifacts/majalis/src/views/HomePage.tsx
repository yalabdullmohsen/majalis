"use client";

import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeCompactPrayer } from "@/components/home/HomeCompactPrayer";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeDailyHadith } from "@/components/home/HomeDailyHadith";
import { IslamicDivider } from "@/components/design/IslamicDivider";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { HijriSacredMonthBanner } from "@/components/HijriSacredMonthBanner";

const SITE_ANNOUNCEMENTS = [
  {
    href: "/lessons",
    icon: "🎓",
    title: "الدروس العلمية",
    desc: "دروس أسبوعية ودورات علمية مرتّبة حسب أقرب موعد",
  },
  {
    href: "/seerah",
    icon: "🌙",
    title: "السيرة النبوية",
    desc: "حياة النبي محمد ﷺ من الميلاد إلى الوفاة",
  },
  {
    href: "/prophets",
    icon: "⭐",
    title: "قصص الأنبياء",
    desc: "من آدم إلى محمد ﷺ، قصص الرسل والأنبياء",
  },
  {
    href: "/islamic-stories",
    icon: "🏛",
    title: "صحابة وفتوحات",
    desc: "سير الصحابة الكرام والفتوحات الإسلامية",
  },
  {
    href: "/fawaid",
    icon: "💡",
    title: "الفوائد الدينية",
    desc: "مختصرات وفوائد علمية منتقاة",
  },
  {
    href: "/adhkar",
    icon: "📿",
    title: "الأذكار",
    desc: "أذكار الصباح والمساء وأذكار اليوم الموثقة",
  },
  {
    href: "/quran",
    icon: "📖",
    title: "القرآن الكريم",
    desc: "مصحف رقمي مع تلاوات ومعاني",
  },
  {
    href: "/library",
    icon: "📚",
    title: "المكتبة العلمية",
    desc: "كتب شرعية ومتون علمية في فنون متعددة",
  },
  {
    href: "/qa",
    icon: "❓",
    title: "الأسئلة والأجوبة",
    desc: "فتاوى وأجوبة شرعية من العلماء",
  },
  {
    href: "/hadith",
    icon: "📜",
    title: "الأحاديث النبوية",
    desc: "أحاديث موثقة ومسندة مع شرحها",
  },
  {
    href: "/rulings",
    icon: "⚖️",
    title: "الأحكام الشرعية",
    desc: "موسوعة شرعية في الفقه والعبادات والمعاملات",
  },
  {
    href: "/stories",
    icon: "🗺️",
    title: "القصص الإسلامية",
    desc: "قصص ووقائع من التاريخ الإسلامي العريق",
  },
  {
    href: "/tawhid",
    icon: "🕋",
    title: "التوحيد",
    desc: "العقيدة الإسلامية وأصول الدين",
  },
  {
    href: "/learning-path",
    icon: "🗺️",
    title: "خارطة طالب العلم",
    desc: "مسار علمي منظم من المبتدئ إلى المتقدم",
  },
  {
    href: "/flashcards",
    icon: "🃏",
    title: "البطاقات الدعوية",
    desc: "مراجعة ذكية للمعلومات الشرعية",
  },
  {
    href: "/car-mode",
    icon: "🚗",
    title: "وضع السيارة",
    desc: "صوتيات وتلاوات للاستماع أثناء القيادة",
  },
];

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>;
}

export default function HomePage() {
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
                placeholder="ابحث في القرآن والأحاديث..."
                aria-label="البحث في التطبيق"
              />
              <button type="submit">بحث</button>
            </form>
          </div>
        </div>
      </section>

      {/* ══════════════════ Main Content ══════════════════ */}
      <main className="home-container home-main home-main--v3">

        {/* الدروس — أول قسم */}
        <SafeHomeSection name="الدروس">
          <HomeUpcomingLessons />
        </SafeHomeSection>

        <IslamicDivider />

        {/* مواقيت الصلاة */}
        <SafeHomeSection name="مواقيت الصلاة">
          <HomeCompactPrayer />
        </SafeHomeSection>

        <IslamicDivider />

        {/* أقسام الموقع كإعلانات تسويقية */}
        <section className="home-section home-stories-section home-announce-section" aria-labelledby="announcements-heading">
          <div className="home-section-head home-announce-head">
            <div>
              <p className="home-eyebrow">استكشف المنصة</p>
              <h2 id="announcements-heading">ما يقدمه المجلس العلمي</h2>
              <p className="home-announce-sub">محتوى علمي متنوع في مكان واحد: الدروس والقرآن والأحاديث والفتاوى وأكثر.</p>
            </div>
          </div>
          <div className="home-stories-grid">
            {SITE_ANNOUNCEMENTS.map(({ href, icon, title, desc }) => (
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

        <SafeHomeSection name="عن المجلس العلمي">
          <HomeAboutSection />
        </SafeHomeSection>

      </main>
    </div>
  );
}
