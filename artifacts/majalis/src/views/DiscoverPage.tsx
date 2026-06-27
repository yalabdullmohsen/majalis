"use client";

import { useMemo } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyHadith } from "@/components/home/HomeDailyHadith";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import { getAllSurahStories } from "@/lib/surah-stories";
import { SEED_FAWAID } from "@/lib/fawaid-seed";
import { readActivity } from "@/lib/user-activity";

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function daySeed() {
  const d = new Date();
  return d.getFullYear() * 1000 + d.getMonth() * 50 + d.getDate();
}

export default function DiscoverPage() {
  const seed = daySeed();
  const activity = readActivity();

  const randomLesson = useMemo(() => pickRandom(LESSONS_SEED, seed), [seed]);
  const randomStory = useMemo(() => pickRandom(getAllSurahStories(), seed + 7), [seed]);
  const randomFaida = useMemo(() => pickRandom(SEED_FAWAID, seed + 13), [seed]);

  const popular = useMemo(() => {
    return [
      { title: "المصحف الشريف", href: "/quran", meta: "الأكثر زيارة" },
      { title: "الأسئلة الشرعية", href: "/qa", meta: "الأكثر زيارة" },
      { title: "قصص السور", href: "/quran/surah-stories", meta: "الأكثر زيارة" },
      { title: "الدروس", href: "/lessons", meta: "الأكثر زiارة" },
    ];
  }, []);

  const surpriseLinks = useMemo(() => {
    const lessons = [...LESSONS_SEED].sort(() => (seed % 2 ? 1 : -1)).slice(0, 4);
    return lessons.map((l) => ({
      title: l.title,
      href: `/lessons/${l.id}`,
      meta: l.speaker_name,
    }));
  }, [seed]);

  return (
    <div className="platform-page discover-page">
      <PageHeader
        eyebrow="استكشاف"
        title="اكتشف"
        subtitle="محتوى يومي، اقتراحات عشوائية، وأكثر ما يقرأه الزوار"
      />

      <div className="discover-daily-grid">
        <section className="discover-daily-card">
          <h2>سؤال اليوم</h2>
          <HomeDailyQuestion />
        </section>
        <section className="discover-daily-card">
          <h2>فائدة اليوم</h2>
          <HomeDailyFaida />
        </section>
        <section className="discover-daily-card">
          <h2>حديث اليوم</h2>
          <HomeDailyHadith />
        </section>
      </div>

      <section className="platform-section">
        <h2 className="platform-section-title">درس مميز</h2>
        <Link href={`/lessons/${randomLesson.id}`} className="discover-feature-card">
          <span>{randomLesson.speaker_name}</span>
          <strong>{randomLesson.title}</strong>
          <p>{randomLesson.description?.slice(0, 120)}</p>
        </Link>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">قصة سورة مقترحة</h2>
        <Link href={`/quran/surah-stories/${randomStory.number}`} className="discover-feature-card">
          <span>سورة {randomStory.number}</span>
          <strong>{randomStory.name}</strong>
          <p>{randomStory.storySummary.slice(0, 140)}</p>
        </Link>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">فائدة عشوائية</h2>
        <Link href="/fawaid" className="discover-feature-card discover-feature-card--quote">
          <p>{randomFaida.text}</p>
          {randomFaida.author_name && <span>— {randomFaida.author_name}</span>}
        </Link>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">اكتشف عشوائياً</h2>
        <div className="platform-suggestions__grid">
          {surpriseLinks.map((item) => (
            <Link key={item.href} href={item.href} className="platform-suggestion-card">
              <span className="platform-suggestion-card__meta">{item.meta}</span>
              <strong>{item.title}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">الأكثر زيارة</h2>
        <div className="platform-suggestions__grid">
          {popular.map((item) => (
            <Link key={item.href} href={item.href} className="platform-suggestion-card">
              <span className="platform-suggestion-card__meta">{item.meta}</span>
              <strong>{item.title}</strong>
            </Link>
          ))}
        </div>
      </section>

      {activity.recent.length > 0 && (
        <section className="platform-section">
          <h2 className="platform-section-title">آخر ما شاهدته</h2>
          <div className="platform-suggestions__grid">
            {activity.recent.slice(0, 6).map((item) => (
              <Link key={`${item.kind}-${item.id}-${item.at}`} href={item.href} className="platform-suggestion-card">
                <span className="platform-suggestion-card__meta">{item.kind}</span>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
