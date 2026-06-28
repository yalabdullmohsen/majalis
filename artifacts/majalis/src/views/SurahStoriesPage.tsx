"use client";

import { useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QuranPagesSubnav } from "@/components/quran/QuranPagesSubnav";
import { getAllSurahStories, getSurahStory, searchSurahStories } from "@/lib/surah-stories";
import "@/styles/quran-pages.css";

export default function SurahStoriesPage() {
  const [search, setSearch] = useState("");
  const stories = search.trim() ? searchSurahStories(search) : getAllSurahStories();

  return (
    <div className="page-shell surah-stories-page quran-pages">
      <PageHeader
        eyebrow="القرآن"
        title="قصص السور"
        subtitle="114 سورة — سبب التسمية، زمان ومكان النزول، المحاور، والقصص القرآنية الموثقة."
      />

      <QuranPagesSubnav active="stories" />

      <input
        className="quran-search ui-card"
        placeholder="ابحث في السور..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="بحث في قصص السور"
      />

      <div className="surah-stories-grid">
        {stories.map((s) => (
          <Link key={s.number} href={`/quran/surah-stories/${s.number}`} className="surah-story-card ui-card">
            <span className="surah-story-num">{s.number}</span>
            <strong>{s.name}</strong>
            <p>{s.namingReason.slice(0, 80)}{s.namingReason.length > 80 ? "…" : ""}</p>
            <span className="surah-story-meta">{s.ayahCount} آية · {s.revelationPlace}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}


function StorySectionCard({ title, variant, children }: { title: string; variant: string; children: React.ReactNode }) {
  return (
    <section className={`surah-story-card surah-story-card--${variant}`} aria-labelledby={`section-${variant}`}>
      <h2 id={`section-${variant}`} className="surah-story-card__title">{title}</h2>
      <div className="surah-story-card__body">{children}</div>
    </section>
  );
}

export function SurahStoryDetailPage({ surahNumber }: { surahNumber: number }) {
  const story = getSurahStory(surahNumber >= 1 && surahNumber <= 114 ? surahNumber : 1);

  return (
    <div className="page-shell surah-story-detail quran-pages">
      <Link href="/quran/surah-stories" className="surah-story-back">← العودة إلى قائمة السور</Link>

      <header className="surah-story-hero">
        <span className="surah-story-hero__num" aria-hidden="true">{story.number}</span>
        <h1 className="surah-story-hero__name">سورة {story.name}</h1>
        <p className="surah-story-hero__meta">
          {story.revelationPlace} · {story.ayahCount} آية
        </p>
      </header>

      <div className="surah-story-sections">
        <StorySectionCard title="بطاقة تعريف" variant="intro">
          <p>
            سورة {story.name} ({story.number}) — {story.revelationPlace}، {story.ayahCount} آية.
            {story.revelationTime ? ` ${story.revelationTime}.` : ""}
          </p>
        </StorySectionCard>

        <StorySectionCard title="سبب التسمية" variant="naming">
          <p>{story.namingReason}</p>
        </StorySectionCard>

        <StorySectionCard title="زمن النزول" variant="revelation">
          <p>{story.revelationTime}</p>
          <p style={{ marginTop: "1rem" }}>مكان النزول: {story.revelationPlace}</p>
        </StorySectionCard>

        <StorySectionCard title="عدد الآيات" variant="intro">
          <p>{story.ayahCount} آية</p>
        </StorySectionCard>

        <StorySectionCard title="المحاور الرئيسية" variant="themes">
          <ul className="surah-story-card__list">
            {story.mainThemes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </StorySectionCard>

        <StorySectionCard title="أبرز القصص" variant="stories">
          <ul className="surah-story-card__list">
            {story.mainStories.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </StorySectionCard>

        <StorySectionCard title="أبرز الأحكام" variant="rulings">
          <ul className="surah-story-card__list">
            {story.keyRulings.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </StorySectionCard>

        <StorySectionCard title="الدروس المستفادة" variant="lessons">
          <ul className="surah-story-card__list">
            {story.lessons.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </StorySectionCard>

        <StorySectionCard title="أهم الموضوعات" variant="themes">
          <ul className="surah-story-card__list">
            {story.keyTopics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </StorySectionCard>

        <StorySectionCard title="فضل السورة" variant="virtues">
          <p>{story.virtues}</p>
        </StorySectionCard>

        <StorySectionCard title="المناسبات" variant="revelation">
          <p>{story.connectionToPrevious}</p>
        </StorySectionCard>

        <StorySectionCard title="الكلمات المفتاحية" variant="intro">
          <p>{story.keywords.join("، ")}</p>
        </StorySectionCard>

        <StorySectionCard title="المراجع" variant="virtues">
          <ul className="surah-story-card__list">
            {story.sources.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </StorySectionCard>
      </div>

      <footer className="surah-story-footer">
        <p className="surah-story-footer__note">
          {story.trustNote} · آخر مراجعة: {story.lastReviewed}
        </p>
        <Link href={`/quran?surah=${story.number}`} className="page-action-btn">
          قراءة السورة في المصحف
        </Link>
      </footer>
    </div>
  );
}
