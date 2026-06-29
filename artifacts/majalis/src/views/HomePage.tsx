"use client";

import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeQuranSection } from "@/components/home/HomeQuranSection";
import { HomeRadioSection } from "@/components/home/HomeRadioSection";
import { HomeLiveSection } from "@/components/home/HomeLiveSection";
import { HomeFeatureCards } from "@/components/home/HomeFeatureCards";
import { HomeFeaturedLibrary } from "@/components/home/HomeFeaturedLibrary";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomeFeaturedSheikhs } from "@/components/home/HomeFeaturedSheikhs";
import { HomeResearchSpotlight } from "@/components/home/HomeResearchSpotlight";
import { HomeCirclesSpotlight } from "@/components/home/HomeCirclesSpotlight";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { Icon } from "@/lib/icons";
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
    <div className="home-page home-page--v4">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <section className="home-hero home-hero--v4">
        <div className="home-container home-hero-grid home-hero-grid--v4">
          <div className="home-hero-copy home-hero-copy--v4">
            <img
              src="/logo.png"
              alt="المجلس العلمي"
              className="home-hero-logo"
              width={72}
              height={72}
              loading="eager"
              decoding="async"
            />
            <h1 className="home-hero-title home-hero-title--v4">المجلس العلمي</h1>
            <p className="home-hero-lead home-hero-lead--v4">
              منصة عالمية للعلوم الشرعية — دروس، قرآن، أبحاث، ومكتبة في مكان واحد.
            </p>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--v4">
        <section className="home-section home-search-section" aria-label="البحث">
          <form onSubmit={submitSearch} className="home-search home-search--v4">
            <Icon name="search" size={20} className="home-search__icon" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث في الدروس والفتاوى والقرآن والأبحاث..."
              aria-label="البحث في المنصة"
            />
            <button type="submit">بحث</button>
          </form>
        </section>

        <SafeHomeSection name="وصول سريع">
          <HomeFeatureCards />
        </SafeHomeSection>

        <SafeHomeSection name="الدروس">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <SafeHomeSection name="البث المباشر">
          <HomeLiveSection />
        </SafeHomeSection>

        <SafeHomeSection name="المشايخ">
          <HomeFeaturedSheikhs />
        </SafeHomeSection>

        <SafeHomeSection name="الأبحاث">
          <HomeResearchSpotlight />
        </SafeHomeSection>

        <SafeHomeSection name="الحلقات">
          <HomeCirclesSpotlight />
        </SafeHomeSection>

        <SafeHomeSection name="الدورات">
          <HomeUpcomingCourses />
        </SafeHomeSection>

        <SafeHomeSection name="المكتبة">
          <HomeFeaturedLibrary />
        </SafeHomeSection>

        <SafeHomeSection name="القرآن">
          <HomeQuranSection />
        </SafeHomeSection>

        <SafeHomeSection name="الأذكار">
          <HomeDailyDhikr />
        </SafeHomeSection>

        <SafeHomeSection name="الأسئلة">
          <HomeDailyQuestion />
        </SafeHomeSection>

        <SafeHomeSection name="الفوائد">
          <HomeDailyFaida />
        </SafeHomeSection>

        <SafeHomeSection name="مواقيت الصلاة">
          <HomePrayerTimes />
        </SafeHomeSection>

        <SafeHomeSection name="الإذاعة">
          <HomeRadioSection />
        </SafeHomeSection>

        <SafeHomeSection name="آخر الإضافات">
          <HomeLatestUpdates />
        </SafeHomeSection>

        <SafeHomeSection name="المزيد">
          <HomeMoreSections />
        </SafeHomeSection>
      </main>
    </div>
  );
}
