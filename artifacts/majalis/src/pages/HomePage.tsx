import { type FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { HOME_MAINTENANCE_MESSAGE } from "@/lib/home-content";
import { TodayBoard } from "@/components/home/TodayBoard";
import { HomeKuwaitLessons } from "@/components/home/HomeKuwaitLessons";
import { HomeSeriesSection } from "@/components/home/HomeSeriesSection";
import { HomeBooksSection } from "@/components/home/HomeBooksSection";

export default function HomePage() {
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-pattern" />
        <div className="home-container home-hero-grid home-hero-grid--compact">
          <div className="home-hero-copy">
            <div className="home-hero-brand">
              <img src="/logo.png" alt="المجلس العلمي" className="home-hero-logo" />
            </div>
            <h1 className="visually-hidden">المجلس العلمي</h1>
            <div className="home-maintenance-card ui-card" role="status">
              <p className="home-maintenance-banner">{HOME_MAINTENANCE_MESSAGE}</p>
            </div>
            <form onSubmit={submitSearch} className="home-search" aria-label="البحث في المنصة">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث عن درس، شيخ، كتاب، مسجد..."
              />
              <button type="submit">بحث</button>
            </form>
          </div>
        </div>
      </section>

      <main className="home-container home-main">
        <TodayBoard />
        <HomeKuwaitLessons />
        <HomeSeriesSection />
        <HomeBooksSection />

        <section className="home-cta-banner ui-card">
          <div>
            <p className="home-eyebrow">المساعد العلمي</p>
            <h2>اسأل وابحث داخل المنصة</h2>
            <p>المساعد يرشدك إلى الدروس والكتب، ويحيل الفتوى الخاصة إلى أهل العلم.</p>
          </div>
          <Link href="/assistant" className="home-primary-action">افتح المساعد العلمي</Link>
        </section>
      </main>
    </div>
  );
}
