import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { getAllSurahStories, getSurahStory } from "@/lib/surah-stories";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { truncateAtWord } from "@/lib/utils";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";

export default function SurahStoriesPage() {
  useEffect(() => {
    const allStories = getAllSurahStories();
    applyPageSeo({
      path: "/quran/surah-stories",
      title: "قصص سور القرآن | سُنّة",
      description: "سبب التسمية ومحاور السور وقصصها من القرآن والسنة الصحيحة — بلا إسرائيليات ولا روايات ضعيفة في الفضائل. يُستغنى بما ثبت في الصحيح — سياسة",
      keywords: ["قصص القرآن", "سور القرآن", "تفسير", "سبب التسمية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "قصص سور القرآن الكريم",
          description: "قصص وأسباب نزول ١١٤ سورة من سور القرآن الكريم؛ محتوى معتمد في منهج سُنّة؛ ؛ يُعرض للتذكّر والاعتبار بما ثبت من القرآن والسنة الصحيحة",
          numberOfItems: 114,
          itemListElement: allStories.slice(0, 20).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `سورة ${s.name}`,
            url: `https://majlisilm.com/quran/surah-stories/${s.number}`,
          })),
        },
      ],
    });
  }, []);
  const stories = getAllSurahStories();

  return (
    <SectionTemplatePage
      route="/quran/surah-stories"
      eyebrow="القرآن وعلومه"
      title="قصص القرآن"
      subtitle="سبب التسمية، زمان ومكان النزول، المحاور، والقصص القرآنية الموثقة: ١١٤ سورة."
      groupTitle="سور القرآن"
    >
    <div className="page-shell surah-stories-page ds-page">

      <aside className="ui-card quran-method-note" role="note" aria-label="تنبيه منهجي" style={{ maxWidth: 720, margin: "0 auto 1.25rem", padding: "0.9rem 1.1rem", lineHeight: 1.7 }}>
        <strong>منهج القسم:</strong> نقتصر على ما ثبت في القرآن والسنة الصحيحة في القصص والفضائل.
        لا نسرد إسرائيليات ولا نعيّن أسماء/أعدادًا لم يرد بها نص، وأسباب النزول تُذكر عند ثبوتها لا بالتشهي.
      </aside>

      <nav className="quran-subnav" aria-label="أقسام القرآن وعلومه">
        <Link href="/quran-knowledge" className="quran-subnav__link">القرآن وعلومه</Link>
        <Link href="/quran-hub/tajweed" className="quran-subnav__link">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link is-active">قصص القرآن</Link>
      </nav>

      <div className="surah-stories-grid">
        {stories.map((s) => (
          <Link key={s.number} href={`/quran/surah-stories/${s.number}`} className="surah-story-card ui-card">
            <span className="surah-story-num">{s.number}</span>
            <strong>{s.name}</strong>
            <p>{truncateAtWord(s.namingReason, 80)}</p>
            <span className="surah-story-meta">{s.ayahCount} آية · {s.revelationPlace}</span>
          </Link>
        ))}
      </div>

      <ExploreAlsoNav
        title="استكشف أيضًا"
        links={[
          { href: "/quran-knowledge", label: "القرآن وعلومه" },
          { href: "/mushaf", label: "المصحف" },
          { href: "/stories", label: "القصص الإسلامية" },
          { href: "/ulum-quran", label: "علوم القرآن" },
        ]}
      />
    </div>
    </SectionTemplatePage>
  );
}

export function SurahStoryDetailPage({ surahNumber }: { surahNumber: number }) {
  const story = getSurahStory(surahNumber >= 1 && surahNumber <= 114 ? surahNumber : 1);
  const prev = story.number > 1 ? getSurahStory(story.number - 1) : null;
  const next = story.number < 114 ? getSurahStory(story.number + 1) : null;

  useEffect(() => {
    const path = `/quran/surah-stories/${story.number}`;
    applyPageSeo({
      path,
      title: `قصة سورة ${story.name} | سُنّة`,
      description: `${story.namingReason} — ${story.revelationTime}، ${story.revelationPlace}، ${story.ayahCount} آية. ${story.virtues || ""}`.slice(0, 300),
      keywords: [story.name, "قصص القرآن", "أسباب النزول", ...story.keywords],
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `قصة سورة ${story.name}`,
          description: story.namingReason,
          url: `https://majlisilm.com${path}`,
          inLanguage: "ar",
        },
      ],
    });
  }, [story.number, story.name, story.namingReason, story.revelationTime, story.revelationPlace, story.ayahCount, story.virtues, story.keywords]);

  return (
    <div className="page-shell surah-story-detail">
      <PageHeader eyebrow={`سورة ${story.number}`} title={story.name} subtitle={story.revelationPlace} />

      <nav className="quran-subnav" aria-label="تنقّل قصص السور">
        <Link href="/quran/surah-stories" className="quran-subnav__link">← كل القصص</Link>
        {prev && (
          <Link href={`/quran/surah-stories/${prev.number}`} className="quran-subnav__link">
            السابقة: {prev.name}
          </Link>
        )}
        {next && (
          <Link href={`/quran/surah-stories/${next.number}`} className="quran-subnav__link">
            التالية: {next.name}
          </Link>
        )}
      </nav>

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
        <Link href={`/mushaf/${story.number}`} className="mj-btn">قراءة السورة</Link>

        <div className="twh-share">
          <ShareButtons title={`${story.name} — قصص سور القرآن | سُنّة`} url={`https://majlisilm.com/quran/surah-stories/${story.number}`} />
        </div>
        <div className="px-4 pb-6 mt-4">
          <SectionQuiz sectionId="quran" title="اختبر معلوماتك في القرآن الكريم" count={4} />
        </div>
      </article>

      <ExploreAlsoNav
        title="استكشف أيضًا"
        links={[
          { href: `/mushaf/${story.number}`, label: `قراءة سورة ${story.name}` },
          { href: "/quran/surah-stories", label: "كل قصص السور" },
          { href: "/stories", label: "القصص الإسلامية" },
          { href: "/ulum-quran", label: "علوم القرآن" },
        ]}
      />
    </div>
  );
}
