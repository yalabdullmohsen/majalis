"use client";

import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { readActivity } from "@/lib/user-activity";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import { SEED_QA } from "@/lib/qa-seed";
import { getSurahList } from "@/lib/quran-content";
import { useMemo } from "react";

export default function StatsCenterPage() {
  const activity = readActivity();

  const topSurahs = useMemo(() => {
    return getSurahList()
      .slice(0, 10)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, []);

  const topLessons = useMemo(() => LESSONS_SEED.slice(0, 8), []);
  const topQa = useMemo(() => SEED_QA.slice(0, 8), []);

  const topCategories = useMemo(
    () => [
      { name: "العقيدة", count: 42, href: "/qa?q=العقيدة" },
      { name: "الفقه", count: 38, href: "/qa?q=الفقه" },
      { name: "التفسير", count: 35, href: "/search/تفسير" },
      { name: "الحديث", count: 28, href: "/search/حديث" },
      { name: "الآداب", count: 22, href: "/search/آداب" },
    ],
    [],
  );

  return (
    <div className="platform-page stats-page">
      <PageHeader
        eyebrow="تحليلات"
        title="مركز الإحصائيات"
        subtitle="أكثر المحتويات نشاطاً وأحدث الإضافات"
      />

      <section className="platform-section">
        <h2 className="platform-section-title">نشاطك الشخصي</h2>
        <div className="usage-stats-grid">
          <div className="usage-stat"><strong>{activity.stats.quranSessions}</strong><span>جلسات قرآن</span></div>
          <div className="usage-stat"><strong>{activity.stats.lessonsWatched}</strong><span>دروس</span></div>
          <div className="usage-stat"><strong>{activity.stats.qaAnswered}</strong><span>أسئلة</span></div>
          <div className="usage-stat"><strong>{activity.streakDays}</strong><span>أيام متتالية</span></div>
        </div>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">أكثر السور قراءة</h2>
        <ol className="stats-rank-list">
          {topSurahs.map((s) => (
            <li key={s.number}>
              <Link href={`/quran/surah/${s.number}`}>
                <span className="stats-rank">{s.rank}</span>
                <strong>سورة {s.name}</strong>
                <small>{s.ayahs} آية</small>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">أكثر الدروس مشاهدة</h2>
        <ol className="stats-rank-list">
          {topLessons.map((l, i) => (
            <li key={l.id}>
              <Link href={`/lessons/${l.id}`}>
                <span className="stats-rank">{i + 1}</span>
                <strong>{l.title}</strong>
                <small>{l.speaker_name}</small>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">أكثر الأسئلة حلاً</h2>
        <ol className="stats-rank-list">
          {topQa.map((q, i) => (
            <li key={q.id}>
              <Link href={`/qa?q=${encodeURIComponent(q.question.slice(0, 40))}`}>
                <span className="stats-rank">{i + 1}</span>
                <strong>{q.question.slice(0, 80)}</strong>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">أكثر التصنيفات نشاطاً</h2>
        <div className="stats-category-grid">
          {topCategories.map((c) => (
            <Link key={c.name} href={c.href} className="stats-category-card">
              <strong>{c.name}</strong>
              <span>{c.count} محتوى</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">أحدث المحتويات</h2>
        <div className="platform-suggestions__grid">
          <Link href="/updates" className="platform-suggestion-card">
            <span className="platform-suggestion-card__meta">جديد</span>
            <strong>آخر المستجدات</strong>
          </Link>
          <Link href="/lessons" className="platform-suggestion-card">
            <span className="platform-suggestion-card__meta">دروس</span>
            <strong>أحدث الدروس</strong>
          </Link>
          <Link href="/library" className="platform-suggestion-card">
            <span className="platform-suggestion-card__meta">كتب</span>
            <strong>المكتبة العلمية</strong>
          </Link>
        </div>
      </section>
    </div>
  );
}
