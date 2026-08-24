/**
 * صفحة فهرس التجويد — أبواب مستقلة بمصادر وأمثلة مربوطة بالمصحف.
 * تلوين الأحكام داخل المصحف: TAJWEED_COLORING_FLAG = false (لا بيانات مراجعة).
 */
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import {
  TAJWEED_CHAPTERS,
  TAJWEED_COLORING_FLAG,
  TAJWEED_HUB_INTRO,
  getTajweedChapter,
} from "@/lib/quran-tajweed/chapters";
import { formatArabicNumber } from "@/lib/numerals";
import { findMushafPageForAyah } from "@/features/mushaf-madinah/mushaf-page-for-ayah";
import "@/styles/pages/tajweed.css";

function mushafHref(surah: number, ayah: number): string {
  const page = findMushafPageForAyah(surah, ayah);
  return `/mushaf?page=${page}&ayah=${surah}:${ayah}`;
}

export function TajweedChapterView() {
  const params = useParams<{ chapter?: string }>();
  const chapter = getTajweedChapter(params.chapter ?? "");

  useEffect(() => {
    if (!chapter) return;
    applyPageSeo({
      path: `/quran-hub/tajweed/${chapter.id}`,
      title: `${chapter.title} — التجويد | المجلس العلمي`,
      description: chapter.summary,
      keywords: ["تجويد", chapter.title],
    });
  }, [chapter]);

  if (!chapter) {
    return (
      <div className="tj-page" dir="rtl" data-quran-tajweed="1">
        <p className="tj-empty">الباب غير موجود.</p>
        <Link href="/quran-hub/tajweed">العودة لفهرس التجويد</Link>
      </div>
    );
  }

  return (
    <div className="tj-page" dir="rtl" data-quran-tajweed="1" data-tajweed-chapter={chapter.id}>
      <nav className="tj-crumb" aria-label="مسار">
        <Link href="/quran-hub">مركز القرآن</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/quran-hub/tajweed">التجويد</Link>
        <span aria-hidden="true"> · </span>
        <span>{chapter.title}</span>
      </nav>
      <header className="tj-chapter-head">
        <p className="tj-kicker">باب {formatArabicNumber(chapter.order)}</p>
        <h1>{chapter.title}</h1>
        <p className="tj-summary">{chapter.summary}</p>
      </header>
      <article className="tj-article">
        {chapter.body.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
        <p className="tj-source">
          <strong>المصدر:</strong> {chapter.source}
        </p>
        {chapter.examples.length > 0 ? (
          <section aria-label="أمثلة من المصحف">
            <h2>أمثلة من المصحف</h2>
            <ul className="tj-examples">
              {chapter.examples.map((ex) => (
                <li key={`${ex.ayahRef.surah}:${ex.ayahRef.ayah}:${ex.text}`}>
                  <span className="tj-examples__text">{ex.text}</span>
                  {ex.note ? <span className="tj-examples__note">{ex.note}</span> : null}
                  <Link href={mushafHref(ex.ayahRef.surah, ex.ayahRef.ayah)}>
                    افتح الآية {formatArabicNumber(ex.ayahRef.surah)}:
                    {formatArabicNumber(ex.ayahRef.ayah)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <div className="tj-quiz-card">
          <h2>اختبر نفسك</h2>
          <p>{chapter.quizHint ?? "راجع الحكم ثم اختبر حفظك من بطاقات المراجعة."}</p>
          <Link href="/flashcards" className="tj-quiz-card__link">
            بطاقات الحفظ والمراجعة
          </Link>
        </div>
      </article>
    </div>
  );
}

export default function QuranTajweedHubView() {
  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub/tajweed",
      title: "التجويد — المجلس العلمي",
      description: TAJWEED_HUB_INTRO.paragraphs[0],
      keywords: ["تجويد", "أحكام النون", "المدود", "مخارج", "حفص"],
    });
  }, []);

  return (
    <SectionTemplatePage
      route="/quran-hub/tajweed"
      title={TAJWEED_HUB_INTRO.title}
      subtitle={TAJWEED_HUB_INTRO.paragraphs[0]}
      groupTitle="أبواب التجويد"
    >
    <div className="tj-page" dir="rtl" data-quran-tajweed="1">
      <header className="tj-hub-head">
        {TAJWEED_HUB_INTRO.paragraphs.slice(1).map((p) => (
          <p key={p.slice(0, 20)}>{p}</p>
        ))}
        <p className="tj-source">
          <strong>المصدر:</strong> {TAJWEED_HUB_INTRO.source}
        </p>
        <p className="tj-related">
          لمعرفة أصل تعدد الأوجه والتيسير انظر{" "}
          <Link href="/quran-hub/seven-ahruf">الأحرف السبعة</Link>
          {" · "}
          <Link href="/quran-hub/qiraat">القراءات العشر</Link>.
        </p>
        {!TAJWEED_COLORING_FLAG ? (
          <p className="tj-flag-note" role="note">
            تلوين أحكام التجويد داخل المصحف غير مفعّل — لا يُعرض إلا ببيانات أحكام مراجَعة لكل كلمة.
          </p>
        ) : null}
      </header>
      <ol className="tj-chapter-list">
        {TAJWEED_CHAPTERS.map((ch) => (
          <li key={ch.id}>
            <Link href={`/quran-hub/tajweed/${ch.id}`} className="tj-chapter-card">
              <span className="tj-chapter-card__n">{formatArabicNumber(ch.order)}</span>
              <span className="tj-chapter-card__body">
                <strong>{ch.title}</strong>
                <span>{ch.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
    </SectionTemplatePage>
  );
}
