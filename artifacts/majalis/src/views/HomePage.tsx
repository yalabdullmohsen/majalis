"use client";

import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeFeaturedLibrary } from "@/components/home/HomeFeaturedLibrary";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

const QUICK_LINKS = [
  { href: "/quran", label: "القرآن", meta: "مصحف وتلاوة" },
  { href: "/lessons", label: "الدروس", meta: "أحدث وقادمة" },
  { href: "/qa", label: "الأسئلة", meta: "فتاوى وإجابات" },
  { href: "/rulings", label: "الأحكام", meta: "موسوعة شرعية" },
  { href: "/library", label: "المكتبة", meta: "كتب ومتون" },
  { href: "/fawaid", label: "الفوائد", meta: "مختصرات" },
  { href: "/miracles", label: "الإعجاز", meta: "علمي" },
  { href: "/quran/surah-stories", label: "القصص", meta: "قرآنية" },
  { href: "/search", label: "البحث", meta: "ذكي" },
  { href: "/assistant", label: "المساعد", meta: "علمي" },
  { href: "/calendar", label: "التقويم", meta: "دروس" },
  { href: "/adhkar", label: "الأذكار", meta: "يومي" },
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
            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label="البحث">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث..."
              />
              <button type="submit">بحث</button>
            </form>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--v3">
        <SafeHomeSection name="أحدث الدروس">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <SafeHomeSection name="الدورات">
          <HomeUpcomingCourses />
        </SafeHomeSection>

        <section className="home-section ds-section">
          <div className="ds-section__head">
            <h2 className="ds-section__title">أقسام المنصة</h2>
            <Link href="/settings" className="ds-section__link">
              الإعدادات
            </Link>
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

        <section className="home-daily-row">
          <SafeHomeSection name="ذكر اليوم">
            <HomeDailyDhikr />
          </SafeHomeSection>
          <SafeHomeSection name="سؤال اليوم">
            <HomeDailyQuestion />
          </SafeHomeSection>
          <SafeHomeSection name="فائدة اليوم">
            <HomeDailyFaida />
          </SafeHomeSection>
        </section>

        <SafeHomeSection name="مواقيت الصلاة">
          <HomePrayerTimes />
        </SafeHomeSection>

        <SafeHomeSection name="المكتبة">
          <HomeFeaturedLibrary />
        </SafeHomeSection>

        <SafeHomeSection name="آخر التحديثات">
          <HomeLatestUpdates />
        </SafeHomeSection>

        <SafeHomeSection name="المزيد من الأقسام">
          <HomeMoreSections />
        </SafeHomeSection>
      </main>
    </div>
  );
}
