"use client";

import { useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import {
  getTajweedLesson,
  getTajweedSectionsWithLessons,
  type TajweedLesson,
} from "@/lib/quran-tajweed";
import "@/styles/quran-media.css";

function TajweedLessonDetail({ lesson, onClose }: { lesson: TajweedLesson; onClose: () => void }) {
  return (
    <article className="tajweed-detail ui-card" id={`tajweed-${lesson.id}`}>
      <header className="tajweed-detail__head">
        <div>
          <p className="tajweed-detail__section">{lesson.material}</p>
          <h2 className="tajweed-detail__title">{lesson.title}</h2>
          <p className="tajweed-detail__level">المستوى: {lesson.level}</p>
        </div>
        <button type="button" className="ui-card-btn" onClick={onClose}>إغلاق</button>
      </header>

      <p className="tajweed-detail__summary">{lesson.summary}</p>

      <section className="tajweed-detail__block">
        <h3 className="tajweed-detail__heading">الشرح</h3>
        <p>{lesson.explanation}</p>
      </section>

      <section className="tajweed-detail__block">
        <h3 className="tajweed-detail__heading">أمثلة</h3>
        <ul className="tajweed-detail__list">
          {lesson.examples.map((ex) => (
            <li key={ex}>{ex}</li>
          ))}
        </ul>
      </section>

      <section className="tajweed-detail__block">
        <h3 className="tajweed-detail__heading">آيات تطبيقية</h3>
        {lesson.practiceAyahs.map((p) => (
          <p key={p.note} className="tajweed-detail__ayah">
            <Link href={`/quran?surah=${p.surah}`}>
              سورة {p.surah} — آيات {p.ayahs.join("، ")}
            </Link>
            {" — "}{p.note}
          </p>
        ))}
      </section>

      <p className="quran-source-note">المصدر: {lesson.source} · آخر مراجعة: {lesson.lastReviewed}</p>
    </article>
  );
}

export default function QuranTajweedPage() {
  const sections = getTajweedSectionsWithLessons();
  const [openId, setOpenId] = useState<string | null>(null);
  const openLesson = openId ? getTajweedLesson(openId) : null;

  const openLessonPanel = (id: string) => {
    setOpenId(id);
    requestAnimationFrame(() => {
      document.getElementById(`tajweed-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="page-shell tajweed-page">
      <PageHeader
        eyebrow="القرآن"
        title="علم التجويد"
        subtitle="دروس منظمة حسب الأبواب — بطاقات واضحة بدون تداخل في العناوين."
      />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="quran-subnav__link">المصحف</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link is-active">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link">قصص القرآن</Link>
        <Link href="/quran-live" className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link">الإذاعات</Link>
      </nav>

      {sections.map((section) => (
        <section key={section.id} className="tajweed-section" aria-labelledby={`tajweed-section-${section.id}`}>
          <header className="tajweed-section__head">
            <h2 id={`tajweed-section-${section.id}`} className="tajweed-section__title">{section.title}</h2>
            <p className="tajweed-section__desc">{section.description}</p>
          </header>

          <ul className="tajweed-card-grid">
            {section.lessons.map((lesson) => (
              <li key={lesson.id}>
                <article className="tajweed-card ui-card">
                  <h3 className="tajweed-card__title">{lesson.title}</h3>
                  <dl className="tajweed-card__meta">
                    <div>
                      <dt>المستوى</dt>
                      <dd>{lesson.level}</dd>
                    </div>
                    <div>
                      <dt>المادة</dt>
                      <dd>{lesson.material}</dd>
                    </div>
                  </dl>
                  <p className="tajweed-card__summary">{lesson.summary}</p>
                  <button
                    type="button"
                    className="lesson-unified-card__btn lesson-unified-card__btn--primary tajweed-card__open"
                    onClick={() => openLessonPanel(lesson.id)}
                  >
                    فتح الدرس
                  </button>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {openLesson && (
        <TajweedLessonDetail lesson={openLesson} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
