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
        <div className="home-hero-pattern" />
        <div className="home-container home-hero-grid home-hero-grid--v3">
          <div className="home-hero-copy">
            <div className="home-hero-brand">
              <img src="/logo.png" alt="المجلس العلمي" className="home-hero-logo" />
              <p className="home-kicker">المنصة العلمية الشرعية</p>
            </div>
            <h1 className="home-hero-title">المجلس العلمي</h1>
            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label="البحث في المنصة">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث عن درس، ذكر، سورة، فائدة..."
              />
              <button type="submit">بحث</button>
            </form>
            <Link href="/assistant" className="home-hero-assistant-link">المساعد العلمي</Link>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--v3">
        <HomeUpcomingLessons />
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
