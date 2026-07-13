import { useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { getAllSurahStories, getSurahStory, searchSurahStories } from "@/lib/surah-stories";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";

export default function SurahStoriesPage() {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const allStories = getAllSurahStories();
    applyPageSeo({
      path: "/surah-stories",
      title: "قصص سور القرآن | المجلس العلمي",
      description: "قصص وأسباب نزول سور القرآن الكريم، تعرّف على مناسبات النزول والقصص المرتبطة بكل سورة.",
      keywords: ["قصص القرآن", "أسباب النزول", "سور القرآن", "قصص إسلامية", "تفسير قرآني"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "قصص سور القرآن الكريم",
          description: "قصص وأسباب نزول ١١٤ سورة من سور القرآن الكريم",
          numberOfItems: 114,
          itemListElement: allStories.slice(0, 20).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `سورة ${s.name}`,
            url: `https://majlisilm.com/surah-stories/${s.number}`,
          })),
        },
      ],
    });
  }, []);
  const stories = search.trim() ? searchSurahStories(search) : getAllSurahStories();

  return (
    <div className="page-shell surah-stories-page ds-page">
      <PageHeader
        eyebrow="القرآن"
        title="قصص القرآن"
        subtitle="سبب التسمية، زمان ومكان النزول، المحاور، والقصص القرآنية الموثقة: ١١٤ سورة."
      />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran-hub" className="quran-subnav__link">مركز القرآن</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link is-active">قصص القرآن</Link>
        <Link href="/quran-live" className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link">الإذاعات</Link>
      </nav>

      <input
        className="quran-search ui-card"
        placeholder="ابحث في السور..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="بحث في قصص القرآن"
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

export function SurahStoryDetailPage({ surahNumber }: { surahNumber: number }) {
  const story = getSurahStory(surahNumber >= 1 && surahNumber <= 114 ? surahNumber : 1);

  return (
    <div className="page-shell surah-story-detail">
      <PageHeader eyebrow={`سورة ${story.number}`} title={story.name} subtitle={story.revelationPlace} />

      <article className="ui-card surah-story-article">
        <SectionErrorBoundary name="سبب التسمية">
          <section><h2>سبب التسمية</h2><p>{story.namingReason}</p></section>
        </SectionErrorBoundary>
        <SectionErrorBoundary name="زمان النزول">
          <section><h2>زمان ومكان النزول</h2><p>{story.revelationTime}، {story.revelationPlace}</p></section>
        </SectionErrorBoundary>
        <section><h2>عدد الآيات</h2><p>{story.ayahCount} آية</p></section>
        {story.mainThemes.length > 0 && (
          <SectionErrorBoundary name="المحاور الرئيسية">
            <section><h2>المحاور الرئيسية</h2><ul>{story.mainThemes.map((t) => <li key={t}>{t}</li>)}</ul></section>
          </SectionErrorBoundary>
        )}
        {story.mainStories.length > 0 && (
          <SectionErrorBoundary name="القصص">
            <section><h2>أبرز القصص</h2><ul>{story.mainStories.map((t) => <li key={t}>{t}</li>)}</ul></section>
          </SectionErrorBoundary>
        )}
        {story.keyRulings.length > 0 && (
          <SectionErrorBoundary name="الأحكام">
            <section><h2>أبرز الأحكام</h2><ul>{story.keyRulings.map((t) => <li key={t}>{t}</li>)}</ul></section>
          </SectionErrorBoundary>
        )}
        {story.lessons.length > 0 && (
          <SectionErrorBoundary name="الدروس">
            <section><h2>الدروس المستفادة</h2><ul>{story.lessons.map((t) => <li key={t}>{t}</li>)}</ul></section>
          </SectionErrorBoundary>
        )}
        {story.keyTopics.length > 0 && (
          <SectionErrorBoundary name="الموضوعات">
            <section><h2>أهم الموضوعات</h2><ul>{story.keyTopics.map((t) => <li key={t}>{t}</li>)}</ul></section>
          </SectionErrorBoundary>
        )}
        {story.virtues && (
          <SectionErrorBoundary name="فضل السورة">
            <section><h2>فضل السورة</h2><p>{story.virtues}</p></section>
          </SectionErrorBoundary>
        )}
        {story.connectionToPrevious && (
          <section><h2>المناسبة مع السورة السابقة</h2><p>{story.connectionToPrevious}</p></section>
        )}
        {story.keywords.length > 0 && (
          <section><h2>الكلمات المفتاحية</h2><p>{story.keywords.join("، ")}</p></section>
        )}
        {story.sources.length > 0 && (
          <SectionErrorBoundary name="المصادر">
            <section><h2>المصادر العلمية</h2><ul>{story.sources.map((t) => <li key={t}>{t}</li>)}</ul></section>
          </SectionErrorBoundary>
        )}
        <p className="quran-source-note">{story.trustNote}{story.lastReviewed ? ` · آخر مراجعة: ${story.lastReviewed}` : ""}</p>
        <Link href={`/quran?surah=${story.number}`} className="page-action-btn">قراءة السورة</Link>

        <div className="twh-share">
          <ShareButtons title={`${story.name} — قصص سور القرآن | المجلس العلمي`} url={`https://majlisilm.com/surah-stories/${story.number}`} />
        </div>
        <div className="px-4 pb-6 mt-4">
          <SectionQuiz categoryId="quran" title="اختبر معلوماتك في القرآن الكريم" count={4} />
        </div>
      </article>
    </div>
  );
}
