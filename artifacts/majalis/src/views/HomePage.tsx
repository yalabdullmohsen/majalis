"use client";

import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeQuranSection } from "@/components/home/HomeQuranSection";
import { HomeRadioSection } from "@/components/home/HomeRadioSection";
import { HomeLiveSection } from "@/components/home/HomeLiveSection";
import { HomePlatformStats } from "@/components/home/HomePlatformStats";
import { HomeFeatureGrid } from "@/components/home/HomeFeatureGrid";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
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
    <div className="home-page home-page--v2026">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <section className="home-hero home-hero--v2026" aria-label="المقدمة">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <span className="home-hero__badge">منصة علمية عربية · 2026</span>
            <h1 className="home-hero__title">
              <em>المجلس العلمي</em>
              <br />
              دروس وعلم وقرآن
            </h1>
            <p className="home-hero__lead">
              منصة موثّقة تجمع الدروس الشرعية والدورات والقرآن والأذكار والأبحاث — في تجربة واحدة
              سلسة لطالب العلم.
            </p>
            <div className="home-hero__actions">
              <Link href="/lessons" className="home-hero__cta home-hero__cta--primary">
                استكشف الدروس
              </Link>
              <Link href="/scholar-search" className="home-hero__cta home-hero__cta--ghost">
                الباحث العلمي
              </Link>
            </div>
          </div>
          <div className="home-hero__visual" aria-hidden="true">
            <div className="home-hero__logo-wrap">
              <img src="/logo.png" alt="" width={120} height={120} loading="eager" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      <div className="home-search home-search--v2026" aria-label="البحث">
        <form onSubmit={submitSearch}>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="ابحث في الدروس والفتاوى والقرآن والمشايخ..."
            aria-label="البحث في المنصة"
          />
          <button type="submit">بحث</button>
        </form>
      </div>

      <main className="home-main home-main--v2026">
        <SafeHomeSection name="الإحصائيات">
          <HomePlatformStats />
        </SafeHomeSection>

        <SafeHomeSection name="الأقسام">
          <HomeFeatureGrid />
        </SafeHomeSection>

        <SafeHomeSection name="الدروس">
          <div className="home-section--v2026">
            <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
          </div>
        </SafeHomeSection>

        <div className="home-grid-2--v2026">
          <SafeHomeSection name="الأسئلة">
            <div className="home-section--v2026">
              <HomeDailyQuestion />
            </div>
          </SafeHomeSection>

          <SafeHomeSection name="الفوائد">
            <div className="home-section--v2026">
              <HomeDailyFaida />
            </div>
          </SafeHomeSection>
        </div>

        <SafeHomeSection name="القرآن">
          <div className="home-section--v2026">
            <HomeQuranSection />
          </div>
        </SafeHomeSection>

        <div className="home-grid-2--v2026">
          <SafeHomeSection name="الأذكار">
            <div className="home-section--v2026">
              <HomeDailyDhikr />
            </div>
          </SafeHomeSection>

          <SafeHomeSection name="مواقيت الصلاة">
            <div className="home-section--v2026">
              <HomePrayerTimes />
            </div>
          </SafeHomeSection>
        </div>

        <div className="home-grid-2--v2026">
          <SafeHomeSection name="الإذاعة">
            <div className="home-section--v2026">
              <HomeRadioSection />
            </div>
          </SafeHomeSection>

          <SafeHomeSection name="البث المباشر">
            <div className="home-section--v2026">
              <HomeLiveSection />
            </div>
          </SafeHomeSection>
        </div>

        <SafeHomeSection name="المزيد">
          <HomeMoreSections />
        </SafeHomeSection>
      </main>
    </div>
  );
}
