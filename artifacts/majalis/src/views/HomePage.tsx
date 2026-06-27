"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomePersonalized } from "@/components/home/HomePersonalized";
import { HomeHeroBanner } from "@/components/home/HomeHeroBanner";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { HomeFeatureCards } from "@/components/home/HomeFeatureCards";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeIslamicOccasions } from "@/components/home/HomeIslamicOccasions";
import { SearchSuggestions } from "@/components/SearchSuggestions";
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
  const [showMore, setShowMore] = useState(false);
  const [, navigate] = useLocation();

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/search/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="home-page home-page--v3 home-page--streamlined">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <section className="home-hero home-hero--v3">
        <div className="home-hero-pattern" aria-hidden="true" />
        <div className="home-container home-hero-grid home-hero-grid--v3">
          <div className="home-hero-copy home-hero-copy--v3">
            <div className="home-hero-logo-card">
              <img
                src="/logo.png"
                alt="المجلس العلمي"
                className="home-hero-logo"
                width={96}
                height={96}
                loading="eager"
                decoding="async"
              />
            </div>
            <p className="home-kicker home-kicker--v3">المنصة العلمية الشرعية</p>
            <h1 className="home-hero-title home-hero-title--v3">المجلس العلمي</h1>
            <p className="home-hero-lead home-hero-lead--v3">
              مرجع علمي متكامل — دروس، قرآن، أسئلة، ومحتوى موثّق في مكان واحد.
            </p>
            <SearchSuggestions
              value={term}
              onChange={setTerm}
              onSubmit={submitSearch}
              placeholder="ابحث في القرآن والدروس والأسئلة والمكتبة..."
              inputClassName="home-search home-search--v3"
              compact
            />
            <div className="home-hero-quick-row">
              <Link href="/discover" className="home-hero-assistant-link home-hero-assistant-link--v3">
                اكتشف
              </Link>
              <Link href="/continue" className="home-hero-assistant-link home-hero-assistant-link--v3">
                واصل القراءة
              </Link>
              <Link href="/assistant" className="home-hero-assistant-link home-hero-assistant-link--v3">
                المساعد العلمي
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--v3">
        <SafeHomeSection name="مخصص">
          <HomePersonalized initialFeaturedLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <SafeHomeSection name="مواقيت الصلاة">
          <HomePrayerTimes />
        </SafeHomeSection>

        {!showMore ? (
          <button type="button" className="home-more-toggle" onClick={() => setShowMore(true)}>
            عرض المزيد من الأقسام ↓
          </button>
        ) : (
          <>
            <SafeHomeSection name="روابط سريعة"><HomeFeatureCards /></SafeHomeSection>
            <SafeHomeSection name="بقية الأقسام"><HomeMoreSections /></SafeHomeSection>
            <SafeHomeSection name="المناسبات"><HomeIslamicOccasions /></SafeHomeSection>
            <SafeHomeSection name="المساعد"><HomeHeroBanner /></SafeHomeSection>
          </>
        )}
      </main>
    </div>
  );
}
