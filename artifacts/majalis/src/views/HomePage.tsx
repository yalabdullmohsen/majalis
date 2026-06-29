"use client";

import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { IslamicGeometricPattern } from "@/components/islamic/IslamicOrnament";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeFeatureCards } from "@/components/home/HomeFeatureCards";
import { HomeLiveSection } from "@/components/home/HomeLiveSection";
import { HomeResearchSection } from "@/components/home/HomeResearchSection";
import { HomeCirclesSection } from "@/components/home/HomeCirclesSection";
import { HomeSheikhsSection } from "@/components/home/HomeSheikhsSection";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeQuranSection } from "@/components/home/HomeQuranSection";
import { HomeRadioSection } from "@/components/home/HomeRadioSection";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomeFeaturedLibrary } from "@/components/home/HomeFeaturedLibrary";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { HomePlatformStats } from "@/components/home/HomePlatformStats";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

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
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      {/* 1. Hero */}
      <section className="home-hero home-hero--v3" aria-label="ترحيب">
        <div className="islamic-pattern-layer">
          <IslamicGeometricPattern opacity={0.12} />
        </div>
        <div className="home-container home-hero-grid home-hero-grid--v3">
          <div className="home-hero-copy home-hero-copy--v3">
            <img
              src="/logo.png"
              alt="المجلس العلمي"
              className="home-hero-logo"
              width={64}
              height={64}
              loading="eager"
              decoding="async"
            />
            <h1 className="home-hero-title home-hero-title--v3">المجلس العلمي</h1>
            <p className="home-hero-lead home-hero-lead--v3">
              منصة علمية إسلامية متكاملة — دروس وقرآن وأبحاث وعبادة في تجربة واحدة هادئة ومنظّمة.
            </p>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--v3">
        {/* 2. Search */}
        <section className="home-section home-search-section" aria-label="البحث">
          <form onSubmit={submitSearch} className="home-search home-search--v3 home-search--standalone">
            <Search size={18} aria-hidden="true" style={{ marginInlineStart: "0.5rem", opacity: 0.5 }} />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث في الدروس والفتاوى والقرآن والأبحاث..."
              aria-label="البحث في المنصة"
            />
            <button type="submit">بحث</button>
          </form>
        </section>

        {/* 3. Quick access */}
        <SafeHomeSection name="الوصول السريع">
          <HomeFeatureCards />
        </SafeHomeSection>

        {/* 4. Latest lessons */}
        <SafeHomeSection name="الدروس">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        {/* 5. Live broadcast */}
        <SafeHomeSection name="البث المباشر">
          <HomeLiveSection />
        </SafeHomeSection>

        {/* 6. Research */}
        <SafeHomeSection name="الأبحاث">
          <HomeResearchSection />
        </SafeHomeSection>

        {/* 7. Circles */}
        <SafeHomeSection name="الحلقات">
          <HomeCirclesSection />
        </SafeHomeSection>

        {/* 8. Sheikhs */}
        <SafeHomeSection name="المشايخ">
          <HomeSheikhsSection />
        </SafeHomeSection>

        {/* 9. Q&A game */}
        <SafeHomeSection name="سؤال وجواب">
          <HomeDailyQuestion />
        </SafeHomeSection>

        {/* 10. Quran */}
        <SafeHomeSection name="القرآن">
          <HomeQuranSection />
        </SafeHomeSection>

        {/* 11. Radio */}
        <SafeHomeSection name="الإذاعة">
          <HomeRadioSection />
        </SafeHomeSection>

        {/* 12. Courses */}
        <SafeHomeSection name="الدورات">
          <HomeUpcomingCourses />
        </SafeHomeSection>

        {/* 13. Library */}
        <SafeHomeSection name="المكتبة">
          <HomeFeaturedLibrary />
        </SafeHomeSection>

        {/* Daily worship strip — compact, non-intrusive */}
        <section className="home-daily-strip" aria-label="يومك العلمي">
          <SafeHomeSection name="الفوائد">
            <HomeDailyFaida />
          </SafeHomeSection>
          <SafeHomeSection name="الأذكار">
            <HomeDailyDhikr />
          </SafeHomeSection>
          <SafeHomeSection name="مواقيت الصلاة">
            <HomePrayerTimes />
          </SafeHomeSection>
        </section>

        {/* 14. Latest updates */}
        <SafeHomeSection name="آخر الإضافات">
          <HomeLatestUpdates />
        </SafeHomeSection>

        {/* More sections */}
        <SafeHomeSection name="أقسام إضافية">
          <HomeMoreSections />
        </SafeHomeSection>

        {/* 15. Stats */}
        <SafeHomeSection name="الإحصائيات">
          <HomePlatformStats />
        </SafeHomeSection>
      </main>
    </div>
  );
}
