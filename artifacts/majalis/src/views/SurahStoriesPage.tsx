"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { getAllSurahStories, getSurahStory, searchSurahStories } from "@/lib/surah-stories";
import { useTrackActivity } from "@/components/UserActivityProvider";
import { LocalFavoriteButton } from "@/components/platform/LocalFavoriteButton";
import { ContentSuggestions } from "@/components/platform/ContentSuggestions";
import { BookmarkNoteButton } from "@/components/platform/BookmarkNoteButton";

function parseAyahLink(ref: string): string {
  const [surah, ayah] = ref.split(":");
  return `/quran/surah/${surah}?ayah=${ayah}`;
}

export default function SurahStoriesPage() {
  const [search, setSearch] = useState("");
  const stories = useMemo(
    () => (search.trim() ? searchSurahStories(search) : getAllSurahStories()),
    [search],
  );

  return (
    <div className="page-shell surah-stories-page calm-page">
      <PageHeader
        eyebrow="القرآن"
        title="قصص السور"
        subtitle="114 سورة — ملخصات سريعة وقراءة مريحة للقصص القرآنية الموثقة."
      />

      <QuranSubnav />

      <div className="surah-stories-toolbar">
        <input
          className="page-search-input full"
          placeholder="ابحث بالاسم أو الرقم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="بحث في قصص السور"
        />
        <span className="surah-stories-count">{stories.length} سورة</span>
      </div>

      <div className="surah-stories-grid surah-stories-grid--compact">
        {stories.map((s) => (
          <article key={s.number} className="surah-story-card-v2">
            <div className="surah-story-card-v2__head">
              <span className="surah-story-card-v2__num">{s.number}</span>
              <div>
                <h2 className="surah-story-card-v2__name">{s.name}</h2>
                <p className="surah-story-card-v2__meta">
                  {s.revelationType} · {s.ayahCount} آية
                </p>
              </div>
            </div>
            <p className="surah-story-card-v2__summary">{s.storySummary}</p>
            <Link href={`/quran/surah-stories/${s.number}`} className="calm-btn calm-btn--primary">
              اقرأ القصة
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SurahStoryDetailPage({ surahNumber }: { surahNumber: number }) {
  const story = getSurahStory(surahNumber >= 1 && surahNumber <= 114 ? surahNumber : 1);
  const prev = story.number > 1 ? story.number - 1 : null;
  const next = story.number < 114 ? story.number + 1 : null;
  const track = useTrackActivity();

  useEffect(() => {
    track({
      kind: "surah-story",
      id: String(story.number),
      title: story.name,
      href: `/quran/surah-stories/${story.number}`,
      meta: story.mainThemes[0],
    });
  }, [story.number, story.name, story.mainThemes, track]);

  return (
    <div className="page-shell surah-story-detail calm-page calm-reading reading-surface-target">
      <nav className="surah-story-detail-nav" aria-label="تنقل القصص">
        <Link href="/quran/surah-stories" className="calm-btn calm-btn--ghost">← كل القصص</Link>
        <div className="surah-story-detail-nav__pager">
          {prev && <Link href={`/quran/surah-stories/${prev}`} className="calm-btn calm-btn--ghost">السابقة</Link>}
          {next && <Link href={`/quran/surah-stories/${next}`} className="calm-btn calm-btn--ghost">التالية</Link>}
        </div>
      </nav>

      <header className="surah-story-detail-hero">
        <p className="page-eyebrow">سورة {story.number}</p>
        <h1 className="surah-story-detail-title">{story.name}</h1>
        <p className="surah-story-detail-lead">
          {story.revelationType} · {story.ayahCount} آية · {story.revelationPlace}
        </p>
      </header>

      <article className="surah-story-article-v2">
        <section className="surah-story-section">
          <h2>سبب التسمية</h2>
          <p>{story.namingReason}</p>
        </section>

        <section className="surah-story-section">
          <h2>المحاور الرئيسة</h2>
          <ul>{story.mainThemes.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>

        <section className="surah-story-section surah-story-section--prose">
          <h2>القصة</h2>
          {story.fullStory.split("\n\n").map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </section>

        <section className="surah-story-section">
          <h2>أهم الدروس المستفادة</h2>
          <ul>{story.lessons.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>

        <section className="surah-story-section">
          <h2>أبرز الآيات</h2>
          <ul className="surah-story-ayah-links">
            {story.highlightAyahs.map((a) => (
              <li key={a.ref}>
                <Link href={parseAyahLink(a.ref)}>{a.label} ({a.ref})</Link>
              </li>
            ))}
          </ul>
        </section>

        {story.relatedSurahs.length > 0 && (
          <section className="surah-story-section">
            <h2>سور مرتبطة</h2>
            <ul className="surah-story-related">
              {story.relatedSurahs.map((r) => (
                <li key={r.number}>
                  <Link href={`/quran/surah-stories/${r.number}`}>{r.name}</Link>
                  <span>{r.reason}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="surah-story-footer">
          <div className="surah-story-actions">
            <LocalFavoriteButton
              type="surah-story"
              id={String(story.number)}
              title={story.name}
              href={`/quran/surah-stories/${story.number}`}
              meta={story.mainThemes[0]}
            />
            <BookmarkNoteButton
              contentKey={`surah-story:${story.number}`}
              title={story.name}
              href={`/quran/surah-stories/${story.number}`}
            />
          </div>
          <p className="quran-source-note">{story.trustNote}</p>
          <Link href={`/quran/surah/${story.number}`} className="calm-btn calm-btn--primary">
            قراءة السورة في المصحف
          </Link>
          <ContentSuggestions keywords={story.keywords} category={story.mainThemes[0]} />
        </footer>
      </article>
    </div>
  );
}
