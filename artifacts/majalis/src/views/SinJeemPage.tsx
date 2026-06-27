"use client";

import { useCallback, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import {
  YES_NO_CATEGORIES,
  filterYesNoQuestions,
  pickRandomYesNo,
  type YesNoCategory,
  type YesNoQuestion,
} from "@/lib/yes-no-game-seed";
import {
  getSinJeemFavorites,
  getSinJeemPosition,
  saveSinJeemPosition,
  toggleSinJeemFavorite,
} from "@/lib/yes-no-game-storage";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function SinJeemPage() {
  const saved = getSinJeemPosition();
  const [category, setCategory] = useState<YesNoCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [index, setIndex] = useState(saved?.index ?? 0);
  const [revealed, setRevealed] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => getSinJeemFavorites());
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(
    () => filterYesNoQuestions(category, search),
    [category, search],
  );

  const current: YesNoQuestion | undefined = filtered[index];

  const goTo = useCallback(
    (nextIndex: number) => {
      const clamped = ((nextIndex % filtered.length) + filtered.length) % filtered.length;
      setIndex(clamped);
      setRevealed(false);
      const item = filtered[clamped];
      if (item) saveSinJeemPosition(clamped, item.id);
    },
    [filtered],
  );

  const handleRandom = () => {
    const picked = pickRandomYesNo(current?.id);
    if (!picked) return;
    const idx = filtered.findIndex((q) => q.id === picked.id);
    if (idx >= 0) goTo(idx);
    else {
      setCategory("all");
      setSearch("");
      const allIdx = filterYesNoQuestions("all", "").findIndex((q) => q.id === picked.id);
      if (allIdx >= 0) {
        setIndex(allIdx);
        setRevealed(false);
        saveSinJeemPosition(allIdx, picked.id);
      }
    }
  };

  const handleResume = () => {
    const pos = getSinJeemPosition();
    if (!pos) return;
    const idx = filtered.findIndex((q) => q.id === pos.questionId);
    if (idx >= 0) goTo(idx);
  };

  const handleShare = async () => {
    if (!current) return;
    const text = `${current.question}\n\nالجواب: ${current.answer ? "نعم" : "لا"}\n${current.explanation}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "سين وجيم", text });
        return;
      } catch {
        /* cancelled */
      }
    }
    if (await copyText(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleCopy = async () => {
    if (!current) return;
    const text = `${current.question}\n\n${current.answer ? "نعم ✓" : "لا ✗"}\n${current.explanation}`;
    if (await copyText(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const toggleFav = () => {
    if (!current) return;
    setFavorites(toggleSinJeemFavorite(current.id));
  };

  return (
    <div className="page-shell narrow content-hub-page sin-jeem-page">
      <PageHeader
        eyebrow="المجلس العلمي"
        title="سين وجيم"
        subtitle="أسئلة سريعة — اضغط لإظهار الجواب، وتنقّل بين الأسئلة والتصنيفات."
      />

      <div className="page-stats-row">
        <span>{filtered.length} سؤال</span>
        <span>{favorites.length} في المفضلة</span>
        <span>
          {index + 1} / {filtered.length || 1}
        </span>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIndex(0);
          setRevealed(false);
        }}
        placeholder="ابحث في الأسئلة..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في سين وجيم"
      />

      <div className="content-hub-chips">
        <button
          type="button"
          className={category === "all" ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          onClick={() => { setCategory("all"); setIndex(0); setRevealed(false); }}
        >
          الكل
        </button>
        {YES_NO_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            onClick={() => { setCategory(cat); setIndex(0); setRevealed(false); }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="sin-jeem-actions">
        <button type="button" className="content-hub-chip" onClick={handleRandom}>عشوائي</button>
        <button type="button" className="content-hub-chip" onClick={handleResume}>متابعة من آخر سؤال</button>
        <Link href="/qa" className="content-hub-chip">الأسئلة والأجوبة</Link>
      </div>

      {current ? (
        <article className="ui-card sin-jeem-card">
          <span className="page-tag">{current.category}</span>
          <h2 className="sin-jeem-card__question">{current.question}</h2>

          {!revealed ? (
            <button type="button" className="page-action-btn sin-jeem-reveal-btn" onClick={() => setRevealed(true)}>
              اضغط لإظهار الجواب
            </button>
          ) : (
            <div className="sin-jeem-card__answer">
              <p className={`sin-jeem-verdict sin-jeem-verdict--${current.answer ? "yes" : "no"}`}>
                {current.answer ? "نعم ✓" : "لا ✗"}
              </p>
              <p className="sin-jeem-explanation">{current.explanation}</p>
            </div>
          )}

          <div className="sin-jeem-toolbar">
            <button type="button" className="reading-toolbar__btn" onClick={() => goTo(index - 1)} disabled={filtered.length <= 1}>
              السابق
            </button>
            <button type="button" className="reading-toolbar__btn" onClick={() => goTo(index + 1)} disabled={filtered.length <= 1}>
              التالي
            </button>
            <button type="button" className="reading-toolbar__btn" onClick={handleCopy}>
              {copied ? "تم النسخ" : "نسخ"}
            </button>
            <button type="button" className="reading-toolbar__btn" onClick={handleShare}>مشاركة</button>
            <button
              type="button"
              className={`reading-toolbar__btn${favorites.includes(current.id) ? " reading-toolbar__btn--active" : ""}`}
              onClick={toggleFav}
            >
              {favorites.includes(current.id) ? "★ مفضلة" : "☆ مفضلة"}
            </button>
          </div>
        </article>
      ) : (
        <p className="settings-note">لا توجد أسئلة مطابقة.</p>
      )}
    </div>
  );
}
