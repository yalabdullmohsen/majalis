"use client";

import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { QuranPagesSubnav } from "@/components/quran/QuranPagesSubnav";
import { useTajweedProgress } from "@/hooks/useTajweedProgress";
import {
  getTajweedLesson,
  getTajweedSectionsWithLessons,
  type TajweedLesson,
  type TajweedQuizItem,
  type TajweedSectionId,
} from "@/lib/quran-tajweed";
import "@/styles/quran-pages.css";

function TajweedQuiz({ items, onComplete }: { items: TajweedQuizItem[]; onComplete: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = items.every((_, i) => answers[i] !== undefined && answers[i] !== null);

  return (
    <div className="tajweed-quiz-card">
      <h3 className="tajweed-panel-card__title">اختبار الدرس</h3>
      {items.map((q, qi) => (
        <div key={qi} style={{ marginBottom: qi < items.length - 1 ? "1.5rem" : 0 }}>
          <p className="tajweed-quiz__question">{q.question}</p>
          <ul className="tajweed-quiz__choices">
            {q.choices.map((choice, ci) => {
              const picked = answers[qi] === ci;
              const showResult = submitted && picked;
              const isCorrect = ci === q.correctIndex;
              return (
                <li key={ci}>
                  <button
                    type="button"
                    className={`tajweed-quiz__choice${showResult ? (isCorrect ? " is-correct" : " is-wrong") : ""}${submitted && isCorrect ? " is-correct" : ""}`}
                    onClick={() => !submitted && setAnswers((a) => ({ ...a, [qi]: ci }))}
                    disabled={submitted}
                  >
                    {choice}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {!submitted ? (
        <button
          type="button"
          className="quran-media-btn quran-media-btn--primary"
          disabled={!allAnswered}
          onClick={() => {
            setSubmitted(true);
            const score = items.filter((q, i) => answers[i] === q.correctIndex).length;
            if (score === items.length) onComplete();
          }}
        >
          تحقق من الإجابات
        </button>
      ) : (
        <p className="tajweed-panel-card__text">
          النتيجة: {items.filter((q, i) => answers[i] === q.correctIndex).length} من {items.length}
        </p>
      )}
    </div>
  );
}

function TajweedLessonPanel({
  lesson,
  onComplete,
}: {
  lesson: TajweedLesson;
  onComplete: () => void;
}) {
  return (
    <div className="tajweed-content-panel">
      <article className="tajweed-panel-card">
        <header style={{ marginBottom: "1.25rem" }}>
          <p style={{ margin: "0 0 0.35rem", fontSize: "0.8125rem", color: "var(--majalis-brass-deep)", fontWeight: 700 }}>
            {lesson.material}
          </p>
          <h2 className="tajweed-panel-card__title" style={{ marginBottom: "0.35rem" }}>{lesson.title}</h2>
          <p className="tajweed-panel-card__text" style={{ fontSize: "0.875rem", color: "var(--majalis-ink-soft)" }}>
            المستوى: {lesson.level}
          </p>
        </header>
        <p className="tajweed-panel-card__text">{lesson.summary}</p>
      </article>

      <article className="tajweed-panel-card">
        <h3 className="tajweed-panel-card__title">الشرح</h3>
        <p className="tajweed-panel-card__text">{lesson.explanation}</p>
      </article>

      <article className="tajweed-panel-card">
        <h3 className="tajweed-panel-card__title">أمثلة</h3>
        {lesson.examples.map((ex) => (
          <div key={ex} className="tajweed-example-box">{ex}</div>
        ))}
      </article>

      <article className="tajweed-panel-card">
        <h3 className="tajweed-panel-card__title">آيات تطبيقية</h3>
        {lesson.practiceAyahs.map((p) => (
          <div key={p.note} className="tajweed-ayah-box">
            <Link href={`/quran?surah=${p.surah}`}>
              سورة {p.surah} — آيات {p.ayahs.join("، ")}
            </Link>
            {" — "}{p.note}
          </div>
        ))}
      </article>

      <TajweedQuiz items={lesson.quiz} onComplete={onComplete} />

      <p className="quran-source-note">المصدر: {lesson.source} · آخر مراجعة: {lesson.lastReviewed}</p>
    </div>
  );
}

export default function QuranTajweedPage() {
  const sections = getTajweedSectionsWithLessons();
  const { percent, milestones, markComplete, isComplete, completedCount, total } = useTajweedProgress();
  const [activeSection, setActiveSection] = useState<TajweedSectionId>(sections[0]?.id || "basics");
  const section = sections.find((s) => s.id === activeSection) || sections[0];
  const [activeLessonId, setActiveLessonId] = useState<string>(section?.lessons[0]?.id || "");
  const activeLesson = useMemo(() => getTajweedLesson(activeLessonId), [activeLessonId]);

  const selectSection = (id: TajweedSectionId) => {
    setActiveSection(id);
    const first = sections.find((s) => s.id === id)?.lessons[0]?.id;
    if (first) setActiveLessonId(first);
  };

  return (
    <div className="page-shell tajweed-page quran-pages">
      <PageHeader
        eyebrow="القرآن"
        title="علم التجويد"
        subtitle="دروس منظمة — شرح، أمثلة، آيات تطبيقية، واختبار مع متابعة التقدم."
      />

      <QuranPagesSubnav active="tajweed" />

      <section className="tajweed-progress" aria-label="تقدم الدروس">
        <div className="tajweed-progress__head">
          <h2 className="tajweed-progress__title">تقدمك في التجويد</h2>
          <p className="tajweed-progress__pct">{completedCount} من {total} — {percent}%</p>
        </div>
        <div className="tajweed-progress__bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="tajweed-progress__fill" style={{ width: `${percent}%` }} />
        </div>
        <ul className="tajweed-progress__milestones">
          {milestones.map((m) => (
            <li key={m.value} className={m.reached ? "is-reached" : undefined}>
              {m.reached ? "✓" : "○"} {m.value === 0 ? "البداية" : `${m.value}%`}
            </li>
          ))}
        </ul>
      </section>

      <div className="tajweed-chips" role="tablist" aria-label="أبواب التجويد">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={activeSection === s.id}
            className={`tajweed-chip${activeSection === s.id ? " is-active" : ""}`}
            onClick={() => selectSection(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>

      {section && (
        <div className="tajweed-layout">
          <nav aria-label="قائمة الدروس">
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "var(--majalis-ink-soft)", lineHeight: 1.6 }}>
              {section.description}
            </p>
            <ul className="tajweed-lesson-list">
              {section.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <button
                    type="button"
                    className={`tajweed-lesson-list__item${activeLessonId === lesson.id ? " is-active" : ""}${isComplete(lesson.id) ? " is-done" : ""}`}
                    onClick={() => setActiveLessonId(lesson.id)}
                  >
                    <span className="tajweed-lesson-list__title">{lesson.title}</span>
                    <span className="tajweed-lesson-list__meta">{lesson.level} · {lesson.material}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {activeLesson ? (
            <TajweedLessonPanel
              lesson={activeLesson}
              onComplete={() => markComplete(activeLesson.id)}
            />
          ) : (
            <p className="tajweed-panel-card__text">اختر درساً من القائمة.</p>
          )}
        </div>
      )}
    </div>
  );
}
