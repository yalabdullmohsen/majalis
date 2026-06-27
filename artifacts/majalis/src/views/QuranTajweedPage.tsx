"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareCardModal } from "@/components/platform/ShareCardModal";
import {
  TAJWEED_CATEGORIES,
  TAJWEED_LESSONS,
  getTajweedLesson,
} from "@/lib/quran-tajweed";
import {
  markTajweedLessonComplete,
  readTajweedProgress,
} from "@/lib/library/reading-position";

export default function QuranTajweedPage() {
  const [activeCategory, setActiveCategory] = useState<string>(TAJWEED_CATEGORIES[0]);
  const [activeId, setActiveId] = useState(TAJWEED_LESSONS[0]?.id || "");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [focusMode, setFocusMode] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [progress, setProgress] = useState(readTajweedProgress);

  useEffect(() => {
    const refresh = () => setProgress(readTajweedProgress());
    window.addEventListener("majalis-tajweed-progress-updated", refresh);
    return () => window.removeEventListener("majalis-tajweed-progress-updated", refresh);
  }, []);

  useEffect(() => {
    const saved = readTajweedProgress();
    if (saved.lastLessonId) {
      const l = getTajweedLesson(saved.lastLessonId);
      if (l) {
        setActiveId(l.id);
        setActiveCategory(l.category);
      }
    }
  }, []);

  const categoryLessons = useMemo(
    () => TAJWEED_LESSONS.filter((l) => l.category === activeCategory),
    [activeCategory],
  );

  const lesson = getTajweedLesson(activeId) || categoryLessons[0] || TAJWEED_LESSONS[0];

  useEffect(() => {
    if (categoryLessons.length && !categoryLessons.some((l) => l.id === activeId)) {
      setActiveId(categoryLessons[0].id);
    }
  }, [activeCategory, categoryLessons, activeId]);

  const totalQuizzes = TAJWEED_LESSONS.reduce((n, l) => n + l.quiz.length, 0);
  const percent = Math.round((progress.completedLessonIds.length / TAJWEED_LESSONS.length) * 100);

  const selectLesson = (id: string) => {
    setActiveId(id);
    const p = readTajweedProgress();
    import("@/lib/library/reading-position").then(({ writeTajweedProgress }) => {
      writeTajweedProgress({ ...p, lastLessonId: id });
    });
  };

  const onQuizAnswer = (lessonId: string, qi: number, oi: number, correct: number) => {
    setQuizAnswers((prev) => ({ ...prev, [`${lessonId}-${qi}`]: oi }));
    if (oi === correct) markTajweedLessonComplete(lessonId);
  };

  return (
    <div className={`tajweed-v2 page-shell${focusMode ? " tajweed-v2--focus" : ""}`}>
      {!focusMode && (
        <>
          <PageHeader eyebrow="القرآن" title="علم التجويد" subtitle="دروس منظمة مع أمثلة قرآنية واختبارات قصيرة." />
          <QuranSubnav active="tajweed" />

          <header className="tajweed-hero">
            <p className="tajweed-summary">تعلّم أحكام التجويد خطوة بخطوة: مخارج، صفات، مدود، ووقف.</p>
            <div className="tajweed-hero__stats">
              <div className="tajweed-stat"><strong>{TAJWEED_LESSONS.length}</strong><span>درس</span></div>
              <div className="tajweed-stat"><strong>{totalQuizzes}</strong><span>اختبار</span></div>
              <div className="tajweed-stat"><strong>{TAJWEED_CATEGORIES.length}</strong><span>قسم</span></div>
              <div className="tajweed-stat"><strong>{percent}%</strong><span>إنجازك</span></div>
            </div>
          </header>

          <div className="tajweed-tabs" role="tablist" aria-label="أقسام التجويد">
            {TAJWEED_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                className={`tajweed-tab${activeCategory === cat ? " is-active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}

      {focusMode && (
        <div className="tajweed-focus-bar">
          <button type="button" className="calm-btn calm-btn--ghost" onClick={() => setFocusMode(false)}>
            ← خروج من التركيز
          </button>
        </div>
      )}

      <div className="tajweed-v2-layout">
        {!focusMode && (
          <nav className="tajweed-lesson-nav" aria-label="دروس القسم">
            {categoryLessons.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`tajweed-lesson-pill${activeId === l.id ? " is-active" : ""}`}
                onClick={() => selectLesson(l.id)}
              >
                <strong>{l.title}</strong>
                <span>{progress.completedLessonIds.includes(l.id) ? "✓ مكتمل" : l.category}</span>
              </button>
            ))}
          </nav>
        )}

        {lesson && (
          <article className="tajweed-lesson-panel reading-surface-target">
            <div className="lib-chapter__toolbar">
              <button type="button" className="calm-btn calm-btn--ghost" onClick={() => setFocusMode(true)}>
                وضع تركيز
              </button>
              <FavoriteButton contentType="lesson" contentId={`tajweed-${lesson.id}`} title={lesson.title} compact />
              <button type="button" className="calm-btn calm-btn--ghost" onClick={() => setShareOpen(true)}>
                مشاركة
              </button>
            </div>

            <h2>{lesson.title}</h2>
            <p className="tajweed-summary">{lesson.summary}</p>

            <section className="tajweed-section">
              <h3>الشرح</h3>
              <p>{lesson.explanation}</p>
            </section>

            <section className="tajweed-section">
              <h3>أمثلة</h3>
              <ul>{lesson.examples.map((ex) => <li key={ex}>{ex}</li>)}</ul>
            </section>

            {lesson.notes && lesson.notes.length > 0 && (
              <section className="tajweed-section">
                <h3>ملاحظات</h3>
                <ul>{lesson.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              </section>
            )}

            {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
              <section className="tajweed-section">
                <h3>أخطاء شائعة</h3>
                <ul className="tajweed-mistakes">{lesson.commonMistakes.map((m) => <li key={m}>{m}</li>)}</ul>
              </section>
            )}

            <section className="tajweed-section">
              <h3>آيات تطبيقية</h3>
              {lesson.practiceAyahs.map((p) => (
                <p key={p.note}>
                  <Link href={`/quran/surah/${p.surah}?ayah=${p.ayahs[0]}`}>
                    سورة {p.surah} — آيات {p.ayahs.join("، ")}
                  </Link>
                  {" — "}{p.note}
                </p>
              ))}
            </section>

            {lesson.quiz.length > 0 && (
              <section className="tajweed-section tajweed-quiz-v2">
                <h3>اختبار قصير</h3>
                {lesson.quiz.map((q, qi) => (
                  <div key={q.question} className="tajweed-quiz-item-v2">
                    <p>{q.question}</p>
                    <div className="tajweed-quiz-options-v2">
                      {q.options.map((opt, oi) => (
                        <button
                          key={opt}
                          type="button"
                          className={`tajweed-quiz-opt-v2${
                            quizAnswers[`${lesson.id}-${qi}`] === oi
                              ? oi === q.answer
                                ? " is-correct"
                                : " is-wrong"
                              : ""
                          }`}
                          onClick={() => onQuizAnswer(lesson.id, qi, oi, q.answer)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            <p className="quran-source-note">المصدر: {lesson.source} · آخر مراجعة: {lesson.lastReviewed}</p>
          </article>
        )}
      </div>

      <ShareCardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={lesson?.title || "علم التجويد"}
        subtitle={lesson?.summary}
      />
    </div>
  );
}
