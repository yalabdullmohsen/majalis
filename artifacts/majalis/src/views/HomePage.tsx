"use client";

import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeFeatureCards } from "@/components/home/HomeFeatureCards";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { HomeQuranSection } from "@/components/home/HomeQuranSection";
import { HomeRadioSection } from "@/components/home/HomeRadioSection";
import { HomeLiveSection } from "@/components/home/HomeLiveSection";
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

      <section className="home-hero home-hero--v3">
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
              دروس وفتاوى وقرآن ومحتوى موثّق في منصة واحدة.
            </p>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--v3">
        <section className="home-section home-search-section" aria-label="البحث">
          <form onSubmit={submitSearch} className="home-search home-search--v3 home-search--standalone">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث في الدروس والفتاوى والقرآن..."
              aria-label="البحث في المنصة"
            />
            <button type="submit">بحث</button>
          </form>
        </section>

        <SafeHomeSection name="الوصول السريع">
          <HomeFeatureCards />
        </SafeHomeSection>

        <SafeHomeSection name="الدروس">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <SafeHomeSection name="الأسئلة">
          <HomeDailyQuestion />
        </SafeHomeSection>

        <SafeHomeSection name="الفوائد">
          <HomeDailyFaida />
        </SafeHomeSection>

        <SafeHomeSection name="القرآن">
          <HomeQuranSection />
        </SafeHomeSection>

        <SafeHomeSection name="الأذكار">
          <HomeDailyDhikr />
        </SafeHomeSection>

        <SafeHomeSection name="مواقيت الصلاة">
          <HomePrayerTimes />
        </SafeHomeSection>

        <SafeHomeSection name="الإذاعة">
          <HomeRadioSection />
        </SafeHomeSection>

        <SafeHomeSection name="البث المباشر">
          <HomeLiveSection />
        </SafeHomeSection>

        <SafeHomeSection name="المزيد">
          <HomeMoreSections />
        </SafeHomeSection>
      </main>
    </div>
  );
}
