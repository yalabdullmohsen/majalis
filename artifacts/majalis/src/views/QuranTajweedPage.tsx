"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui-common";
import { TAJWEED_CATEGORIES, TAJWEED_LESSONS, getTajweedLesson } from "@/lib/quran-tajweed";

export default function QuranTajweedPage() {
  const [activeId, setActiveId] = useState(TAJWEED_LESSONS[0]?.id || "");
  const [category, setCategory] = useState<string>("الكل");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const filtered =
    category === "الكل"
      ? TAJWEED_LESSONS
      : TAJWEED_LESSONS.filter((l) => l.category === category);
  const lesson = getTajweedLesson(activeId) || filtered[0];

  return (
    <div className="page-shell tajweed-page">
      <PageHeader eyebrow="القرآن" title="علم التجويد" subtitle="دروس منظمة مع أمثلة وآيات تطبيقية واختبارات قصيرة." />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="quran-subnav__link">المصحف</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link is-active">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link">قصص السور</Link>
        <Link href="/quran-live" className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link">الإذاعات</Link>
      </nav>

      <div className="tajweed-layout">
        <aside className="tajweed-sidebar ui-card">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="quran-select"
            aria-label="تصنيف الدرس"
          >
            <option value="الكل">جميع الأقسام</option>
            {TAJWEED_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <nav className="tajweed-lesson-list">
            {filtered.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`tajweed-lesson-btn${activeId === l.id ? " is-active" : ""}`}
                onClick={() => setActiveId(l.id)}
              >
                <strong>{l.title}</strong>
                <span>{l.category}</span>
              </button>
            ))}
          </nav>
        </aside>

        {lesson && (
          <article className="tajweed-content ui-card">
            <h2>{lesson.title}</h2>
            <p className="tajweed-summary">{lesson.summary}</p>
            <section>
              <h3>الشرح</h3>
              <p>{lesson.explanation}</p>
            </section>
            <section>
              <h3>أمثلة</h3>
              <ul>{lesson.examples.map((ex) => <li key={ex}>{ex}</li>)}</ul>
            </section>
            <section>
              <h3>آيات تطبيقية</h3>
              {lesson.practiceAyahs.map((p) => (
                <p key={p.note}>
                  <Link href={`/quran?surah=${p.surah}`}>
                    سورة {p.surah} — آيات {p.ayahs.join("، ")}
                  </Link>
                  {" — "}{p.note}
                </p>
              ))}
            </section>
            {lesson.quiz.length > 0 && (
              <section className="tajweed-quiz">
                <h3>اختبار قصير</h3>
                {lesson.quiz.map((q, qi) => (
                  <div key={q.question} className="tajweed-quiz-item">
                    <p>{q.question}</p>
                    <div className="tajweed-quiz-options">
                      {q.options.map((opt, oi) => (
                        <button
                          key={opt}
                          type="button"
                          className={`tajweed-quiz-opt${
                            quizAnswers[`${lesson.id}-${qi}`] === oi
                              ? oi === q.answer
                                ? " is-correct"
                                : " is-wrong"
                              : ""
                          }`}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [`${lesson.id}-${qi}`]: oi }))}
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
    </div>
  );
}
