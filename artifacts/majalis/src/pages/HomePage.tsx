import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeDailyHadith } from "@/components/home/HomeDailyHadith";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeHeroBanner } from "@/components/home/HomeHeroBanner";
import { HomeSunnahByTime } from "@/components/home/HomeSunnahByTime";
import { HomeFeatureCards } from "@/components/home/HomeFeatureCards";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { HomeIslamicOccasions } from "@/components/home/HomeIslamicOccasions";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";

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
              منصة علمية شرعية تجمع الدروس والفتاوى والقرارات والأذكار والمحتوى الموثّق في مكان واحد.
            </p>
            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label="البحث في المنصة">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث عن درس، ذكر، سورة، فائدة..."
              />
              <button type="submit">بحث</button>
            </form>
            <Link href="/assistant" className="home-hero-assistant-link home-hero-assistant-link--v3">
              المساعد العلمي
            </Link>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--v3">
        <HomeUpcomingLessons />
        <HomeLatestUpdates />
        <HomeUpcomingCourses />
        <HomePrayerTimes />
        <HomeDailyFaida />
        <HomeDailyDhikr />
        <HomeDailyHadith />
        <HomeDailyQuestion />
        <HomeHeroBanner />
        <HomeSunnahByTime />
        <HomeFeatureCards />
        <HomeDailyProgress />
        <HomeMoreSections />
        <HomeIslamicOccasions />
      </main>
    </div>
  );
}
