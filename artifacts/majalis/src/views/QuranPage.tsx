"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getMushafPageUrl,
  getMushafPageFallbackUrl,
  getSurahForPage,
  getSurahList,
  SURAH_START_PAGES,
} from "@/lib/quran-api";
import "@/styles/quran.css";

// ─── Storage helpers ──────────────────────────────────────────────────────────

const PAGE_KEY = "mj-quran-page-v1";

function ls<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ─── نجمة هندسية إسلامية ثمانية الرؤوس — للزوايا الزخرفية ──────────────────

function EightStar({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <path
        d="M14 1.5 L16 8.5 L22.5 5.5 L19.5 11.8 L26.5 14 L19.5 16.2 L22.5 22.5 L16 19.5 L14 26.5 L12 19.5 L5.5 22.5 L8.5 16.2 L1.5 14 L8.5 11.8 L5.5 5.5 L12 8.5 Z"
        fill="none"
        stroke="#B8874A"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="14" r="2.5" fill="none" stroke="#B8874A" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

// ─── Mushaf Image Viewer ───────────────────────────────────────────────────────

function PageView({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState(() => ls<number>(PAGE_KEY, 1));
  const [loaded, setLoaded] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [hardError, setHardError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [activeSrc, setActiveSrc] = useState(() => getMushafPageUrl(ls<number>(PAGE_KEY, 1)));
  const [showChrome, setShowChrome] = useState(true);
  const [showIndex, setShowIndex] = useState(false);
  const [slideDir, setSlideDir] = useState<"next" | "prev" | "">("");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const chromTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const surahOnPage = useMemo(() => getSurahForPage(page), [page]);
  const allSurahs = useMemo(() => getSurahList(), []);

  const resetChromeTimer = useCallback(() => {
    if (chromTimerRef.current) clearTimeout(chromTimerRef.current);
    setShowChrome(true);
    chromTimerRef.current = setTimeout(() => setShowChrome(false), 3500);
  }, []);

  useEffect(() => {
    resetChromeTimer();
    return () => { if (chromTimerRef.current) clearTimeout(chromTimerRef.current); };
  }, [page, resetChromeTimer]);

  // Prefetch adjacent pages
  useEffect(() => {
    [page - 1, page + 1].forEach((p) => {
      if (p >= 1 && p <= 604) {
        const img = new Image();
        img.src = getMushafPageUrl(p);
      }
    });
  }, [page]);

  const go = useCallback(
    (delta: number) => {
      setSlideDir(delta > 0 ? "next" : "prev");
      setPage((prev) => {
        const next = Math.max(1, Math.min(604, prev + delta));
        lsSet(PAGE_KEY, next);
        return next;
      });
      setLoaded(false);
      setTriedFallback(false);
      setHardError(false);
      resetChromeTimer();
    },
    [resetChromeTimer],
  );

  useEffect(() => {
    setActiveSrc(getMushafPageUrl(page));
    setLoaded(false);
    setTriedFallback(false);
    setHardError(false);
  }, [page]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") go(1);
      else if (e.key === "ArrowRight") go(-1);
      else if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go, onExit]);

  function handleImgError() {
    if (!triedFallback) {
      setTriedFallback(true);
      setActiveSrc(getMushafPageFallbackUrl(page));
    } else {
      setHardError(true);
      setLoaded(true);
    }
  }

  function handleRetry() {
    setHardError(false);
    setLoaded(false);
    setTriedFallback(false);
    setRetryCount((c) => c + 1);
    setActiveSrc(getMushafPageUrl(page));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
    touchStartRef.current = null;
    if (dy > 80 || Math.abs(dx) < 45) {
      setShowChrome((v) => !v);
      return;
    }
    // Swipe left → next page (higher number); swipe right → previous page
    go(dx < 0 ? 1 : -1);
  }

  function jumpToSurah(idx: number) {
    const p = SURAH_START_PAGES[idx];
    setPage(p);
    lsSet(PAGE_KEY, p);
    setLoaded(false);
    setTriedFallback(false);
    setHardError(false);
    setShowIndex(false);
    resetChromeTimer();
  }

  return (
    <div className="mf-shell" dir="rtl">
      {/* Minimal top header */}
      <div className={`mf-header${showChrome ? " is-visible" : ""}`}>
        <button type="button" className="mf-chrome-btn" onClick={onExit} aria-label="الرجوع">
          ← رجوع
        </button>
        <div className="mf-header__info">
          <span className="mf-header__surah">{surahOnPage.name}</span>
          <span className="mf-header__page">صفحة {page} من ٦٠٤</span>
        </div>
        <button
          type="button"
          className="mf-chrome-btn"
          onClick={() => setShowIndex(true)}
          aria-label="فهرس السور"
        >
          ☰
        </button>
      </div>

      {/* Full-viewport mushaf image */}
      <div
        className="mf-page-frame"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setShowChrome((v) => !v)}
      >
        {!loaded && !hardError && (
          <div className="mf-skeleton">
            <div className="mf-skeleton__spinner" />
            <span>جاري التحميل…</span>
          </div>
        )}
        {hardError && (
          <div className="mf-error">
            <p>تعذّر تحميل الصفحة {page}</p>
            <button
              type="button"
              className="mf-error__retry"
              onClick={(e) => { e.stopPropagation(); handleRetry(); }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        {/* غلاف الصورة مع الإطار الذهبي وزوايا النجمة */}
        <div className="mf-page-wrapper">
          <EightStar className="mf-corner mf-corner--tl" />
          <EightStar className="mf-corner mf-corner--tr" />
          <EightStar className="mf-corner mf-corner--bl" />
          <EightStar className="mf-corner mf-corner--br" />
          <img
            key={`${activeSrc}-${retryCount}`}
            src={activeSrc}
            alt={`صفحة ${page} من المصحف الشريف`}
            className={[
              "mf-page-img",
              loaded && !hardError ? "is-loaded" : "",
              loaded && !hardError && slideDir ? `mf-slide-${slideDir}` : "",
            ].filter(Boolean).join(" ")}
            onLoad={() => setLoaded(true)}
            onError={handleImgError}
            onAnimationEnd={() => setSlideDir("")}
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className={`mf-footer${showChrome ? " is-visible" : ""}`}>
        <button
          type="button"
          className="mf-nav-btn"
          onClick={() => go(-1)}
          disabled={page <= 1}
          aria-label="الصفحة السابقة"
        >
          ‹ السابقة
        </button>
        <div className="mf-page-input-wrap">
          <input
            type="number"
            min={1}
            max={604}
            value={page}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 604) {
                setPage(v);
                lsSet(PAGE_KEY, v);
                setLoaded(false);
                setTriedFallback(false);
                setHardError(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="mf-page-input"
            aria-label="رقم الصفحة"
          />
          <span className="mf-page-total">/ ٦٠٤</span>
        </div>
        <button
          type="button"
          className="mf-nav-btn"
          onClick={() => go(1)}
          disabled={page >= 604}
          aria-label="الصفحة التالية"
        >
          التالية ›
        </button>
      </div>

      {/* Surah index bottom sheet */}
      {showIndex && (
        <>
          <div className="mf-overlay" onClick={() => setShowIndex(false)} aria-hidden="true" />
          <div className="mf-index-sheet" role="dialog" aria-modal="true" aria-label="فهرس السور">
            <div className="mf-index-sheet__handle" />
            <div className="mf-index-sheet__head">
              <h2 className="mf-index-sheet__title">فهرس السور</h2>
              <button
                type="button"
                className="mf-index-sheet__close"
                onClick={() => setShowIndex(false)}
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <div className="mf-index-sheet__list">
              {allSurahs.map((s, i) => (
                <button
                  key={s.number}
                  type="button"
                  className={`mf-index-item${surahOnPage.number === s.number ? " is-active" : ""}`}
                  onClick={() => jumpToSurah(i)}
                >
                  <span className="mf-index-item__num">{s.number}</span>
                  <span className="mf-index-item__name">{s.name}</span>
                  <span className="mf-index-item__meta">
                    {s.revelation} · {s.ayahs} آية · ص {SURAH_START_PAGES[i]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranPage() {
  return <PageView onExit={() => window.history.back()} />;
}
