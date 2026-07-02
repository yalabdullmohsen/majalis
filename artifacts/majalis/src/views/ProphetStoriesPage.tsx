"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/ui-common";
import {
  PROPHETS,
  getProphet,
  searchProphets,
  type ProphetRecord,
} from "@/lib/prophets-data";

// ─── Detail view ─────────────────────────────────────────────────────────────

function ProphetDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const p = getProphet(slug);
  if (!p) return (
    <div className="page-shell narrow">
      <button type="button" className="prophets-back-btn" onClick={onBack}>← العودة</button>
      <p>نبي غير موجود.</p>
    </div>
  );

  return (
    <div className="page-shell narrow">
      <button type="button" className="prophets-back-btn" onClick={onBack}>
        ← العودة إلى قائمة الأنبياء
      </button>

      <article className="prophet-detail ui-card">
        {/* Header */}
        <header className="prophet-detail__header">
          <span className="prophet-detail__num">النبي {p.id} من 25</span>
          <h1 className="prophet-detail__name">{p.arabicName} عليه السلام</h1>
          <p className="prophet-detail__title">{p.title}</p>
          {p.quranTitle && (
            <span className="prophet-detail__quran-title">
              ﴾ {p.quranTitle} ﴿
            </span>
          )}
        </header>

        {/* Meta */}
        <div className="prophet-detail__meta-row">
          <span className="prophet-detail__meta-item">
            <strong>قومه / بلده:</strong> {p.peopleOrPlace}
          </span>
          <span className="prophet-detail__meta-item">
            <strong>الحقبة:</strong> {p.era}
          </span>
          <span className="prophet-detail__meta-item">
            <strong>عدد السور التي ذُكر فيها:</strong> {p.surahCount} سورة
          </span>
        </div>

        {/* Biography */}
        <section className="prophet-detail__section">
          <h2>نبذة تعريفية</h2>
          <p>{p.briefBio}</p>
        </section>

        {/* Main Surahs */}
        <section className="prophet-detail__section">
          <h2>أبرز السور التي تذكره</h2>
          <div className="prophet-chips">
            {p.mainSurahs.map((s) => (
              <Link key={s} href={`/quran`} className="prophet-chip prophet-chip--surah">
                سورة {s}
              </Link>
            ))}
          </div>
        </section>

        {/* Attributes */}
        <section className="prophet-detail__section">
          <h2>أبرز صفاته ومعجزاته</h2>
          <ul className="prophet-list">
            {p.keyAttributes.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>

        {/* Lessons */}
        <section className="prophet-detail__section">
          <h2>أبرز الدروس والعبر</h2>
          <ul className="prophet-list prophet-list--lessons">
            {p.lessons.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>

        <footer className="prophet-detail__footer">
          <p>⚠️ هذا المحتوى موسوعي تعريفي — يرجى الرجوع إلى كتب التفسير المعتمدة للتفاصيل الشرعية.</p>
        </footer>
      </article>

      {/* Prev / Next navigation */}
      <div className="prophet-nav-row">
        {p.id > 1 && (
          <button
            type="button"
            className="prophet-nav-btn"
            onClick={() => {
              const prev = PROPHETS[p.id - 2];
              if (prev) onBack();
            }}
          >
            <Link href={`/prophets/${PROPHETS[p.id - 2]?.slug}`} className="prophet-nav-btn__link">
              ← {PROPHETS[p.id - 2]?.arabicName}
            </Link>
          </button>
        )}
        {p.id < 25 && (
          <button
            type="button"
            className="prophet-nav-btn prophet-nav-btn--next"
          >
            <Link href={`/prophets/${PROPHETS[p.id]?.slug}`} className="prophet-nav-btn__link">
              {PROPHETS[p.id]?.arabicName} ←
            </Link>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Grid view ────────────────────────────────────────────────────────────────

function ProphetCard({ prophet, onClick }: { prophet: ProphetRecord; onClick: () => void }) {
  return (
    <article
      className="prophet-card ui-card"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      tabIndex={0}
      role="button"
      aria-label={`عرض قصة نبي الله ${prophet.arabicName}`}
    >
      <div className="prophet-card__num">{prophet.id}</div>
      <div className="prophet-card__body">
        <h3 className="prophet-card__name">{prophet.arabicName} <span className="prophet-card__pbuh">عليه السلام</span></h3>
        <p className="prophet-card__title">{prophet.title}</p>
        {prophet.quranTitle && (
          <span className="prophet-card__quran-title">﴾ {prophet.quranTitle} ﴿</span>
        )}
        <p className="prophet-card__people">{prophet.peopleOrPlace}</p>
        <p className="prophet-card__bio">{prophet.briefBio.slice(0, 120)}…</p>
        <div className="prophet-card__footer">
          <span>{prophet.surahCount} سورة</span>
          <span>{prophet.mainSurahs[0] && `سورة ${prophet.mainSurahs[0]}`}</span>
        </div>
      </div>
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProphetStoriesPage() {
  const { isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const results = searchProphets(search);

  if (selectedSlug) {
    return (
      <ProphetDetail
        slug={selectedSlug}
        onBack={() => setSelectedSlug(null)}
      />
    );
  }

  return (
    <div className="page-shell prophets-page">
      <PageHeader
        eyebrow="السيرة والتاريخ"
        title="قصص الأنبياء"
        subtitle="الأنبياء الخمسة والعشرون المذكورون بالاسم في القرآن الكريم — نبذات تعريفية وعبر ودروس."
      />

      <div className="prophets-disclaimer ui-card">
        <p>
          ⚠️ <strong>تنبيه:</strong> هذا المحتوى موسوعي تعريفي مختصر. للاستزادة راجع كتب التفسير المعتمدة كتفسير ابن كثير وقصص الأنبياء للأئمة الموثوقين.
        </p>
      </div>

      {/* Search */}
      <input
        className="prophets-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأنبياء..."
        aria-label="بحث في قصص الأنبياء"
      />

      <div className="prophets-stats">
        {isAdmin && <span>{results.length} من 25 نبياً</span>}
        {search && (
          <button type="button" className="prophets-clear-btn" onClick={() => setSearch("")}>
            مسح البحث ✕
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="prophets-empty">
          <p>لا توجد نتائج لـ «{search}»</p>
        </div>
      ) : (
        <div className="prophets-grid">
          {results.map((p) => (
            <ProphetCard
              key={p.slug}
              prophet={p}
              onClick={() => setSelectedSlug(p.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
