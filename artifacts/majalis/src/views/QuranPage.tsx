"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuranReader } from "@/hooks/useQuranReader";
import { useAyahPlayer } from "@/hooks/useAyahPlayer";
import {
  fetchTafsirAyahs,
  fetchJuz,
  fetchSurahDetailQiraat,
  getMushafPageUrl,
  getMushafPageFallbackUrl,
  QIRAAT_LIST,
  getQiraatPref,
  setQiraatPref,
  getSurahForPage,
  getSurahList,
  SURAH_START_PAGES,
  type TafsirAyah,
  type Ayah,
  type JuzData,
  type SurahDetail,
} from "@/lib/quran-api";
import { SurahList } from "@/components/quran/SurahList";
import { AyahDisplay } from "@/components/quran/AyahDisplay";
import { QuranPlayerBar } from "@/components/quran/QuranPlayerBar";
import { QuranSearch } from "@/components/quran/QuranSearch";
import "@/styles/quran.css";

// ─── Types ─────────────────────────────────────────────────────────────────

type ViewMode = "surah" | "page" | "verse" | "juz";

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "surah", label: "سورة" },
  { id: "page",  label: "مصحف" },
  { id: "verse", label: "آية" },
  { id: "juz",   label: "جزء" },
];

const TAFSIR_SOURCES = [
  { id: "ar.muyassar", label: "الميسّر" },
  { id: "ar.jalalayn", label: "الجلالين" },
  { id: "ar.waseet",   label: "الوسيط" },
] as const;
type TafsirId = (typeof TAFSIR_SOURCES)[number]["id"];

const VIEW_KEY   = "mj-quran-view-v1";
const TAFSIR_KEY = "mj-quran-tafsir-v3";
const PAGE_KEY   = "mj-quran-page-v1";
const JUZ_KEY    = "mj-quran-juz-v1";
const FS_KEY     = "mj-quran-fontsize-v1";
const NIGHT_KEY  = "mj-quran-night-v1";
const WARM_KEY   = "mj-quran-warm-v1";
type DisplayMode = "light" | "warm" | "night";

function ls<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ─── Mushaf Immersive Reader ───────────────────────────────────────────────

function PageView({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState(() => ls<number>(PAGE_KEY, 1));
  const [loaded, setLoaded] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [hardError, setHardError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [activeSrc, setActiveSrc] = useState(() => getMushafPageUrl(ls<number>(PAGE_KEY, 1)));
  const [showChrome, setShowChrome] = useState(true);
  const [showIndex, setShowIndex] = useState(false);
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
        <img
          key={`${activeSrc}-${retryCount}`}
          src={activeSrc}
          alt={`صفحة ${page} من المصحف الشريف`}
          className={`mf-page-img${loaded && !hardError ? " is-loaded" : ""}`}
          onLoad={() => setLoaded(true)}
          onError={handleImgError}
          draggable={false}
        />
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

// ─── Verse (آية) View ─────────────────────────────────────────────────────

function VerseView({
  ayahs,
  surahName,
  tafsirMap,
  tafsirId,
  tafsirLoading,
  onChangeTafsir,
}: {
  ayahs: Ayah[];
  surahName: string;
  tafsirMap: Map<number, string>;
  tafsirId: TafsirId;
  tafsirLoading: boolean;
  onChangeTafsir: (id: TafsirId) => void;
}) {
  const [ayahIdx, setAyahIdx] = useState(0);
  const total = ayahs.length;
  const ayah = ayahs[ayahIdx] ?? null;

  return (
    <div className="qs-verse-view" dir="rtl">
      {/* Verse navigation */}
      <div className="qs-verse-view__nav">
        <button
          type="button"
          className="qs-page-view__nav-btn"
          onClick={() => setAyahIdx((v) => Math.max(0, v - 1))}
          disabled={ayahIdx <= 0}
        >
          ‹ السابقة
        </button>
        <span className="qs-verse-view__counter">
          {ayahIdx + 1} / {total}
        </span>
        <button
          type="button"
          className="qs-page-view__nav-btn"
          onClick={() => setAyahIdx((v) => Math.min(total - 1, v + 1))}
          disabled={ayahIdx >= total - 1}
        >
          التالية ›
        </button>
      </div>

      {/* Ayah card */}
      {ayah && (
        <div className="qs-verse-card">
          <div className="qs-verse-card__ref">
            ﴿ {surahName} : {ayah.numberInSurah} ﴾
          </div>
          <p className="qs-verse-card__text" lang="ar" dir="rtl">
            {ayah.text}
          </p>
        </div>
      )}

      {/* Tafsir */}
      <div className="qs-verse-tafsir">
        <div className="qs-verse-tafsir__head">
          <span className="qs-verse-tafsir__title">التفسير</span>
          <div className="qs-verse-tafsir__sources">
            {TAFSIR_SOURCES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`qs-tafsir__source-btn${tafsirId === t.id ? " is-active" : ""}`}
                onClick={() => onChangeTafsir(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {tafsirLoading && <p className="qs-loading">جاري تحميل التفسير…</p>}
        {!tafsirLoading && ayah && (
          <p className="qs-verse-tafsir__body">
            {tafsirMap.get(ayah.numberInSurah) || "لا يوجد تفسير متاح لهذه الآية في المصدر المختار."}
          </p>
        )}
      </div>

      {/* Jump to ayah */}
      <div className="qs-verse-view__jump">
        <label className="qs-verse-view__jump-label" htmlFor="ayah-jump">الآية:</label>
        <input
          id="ayah-jump"
          type="number"
          min={1}
          max={total}
          defaultValue={ayahIdx + 1}
          onBlur={(e) => {
            const v = parseInt(e.target.value, 10);
            if (v >= 1 && v <= total) setAyahIdx(v - 1);
          }}
          className="qs-verse-view__jump-input"
        />
      </div>
    </div>
  );
}

// ─── Juz View ─────────────────────────────────────────────────────────────

function JuzView({ fontScale }: { fontScale: number }) {
  const [juzNum, setJuzNum] = useState(() => ls<number>(JUZ_KEY, 1));
  const [juzData, setJuzData] = useState<JuzData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrollPct, setScrollPct] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchJuz(juzNum)
      .then((d) => { setJuzData(d); setScrollPct(0); })
      .catch(() => setError("تعذر تحميل الجزء"))
      .finally(() => setLoading(false));
  }, [juzNum]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pct = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    setScrollPct(Math.round(pct * 100));
  }, []);

  const changeJuz = useCallback((n: number) => {
    const v = Math.max(1, Math.min(30, n));
    setJuzNum(v);
    lsSet(JUZ_KEY, v);
  }, []);

  const surahNameMap = useMemo<Map<number, string>>(() => {
    const m = new Map<number, string>();
    juzData?.surahs.forEach((s) => m.set(s.number, s.name));
    return m;
  }, [juzData]);

  return (
    <div dir="rtl">
      {/* Juz selector grid */}
      <div className="qs-juz-selector">
        <span className="qs-juz-selector__label">اختر الجزء:</span>
        <div className="qs-juz-selector__grid">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`qs-juz-btn${n === juzNum ? " is-active" : ""}`}
              onClick={() => changeJuz(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="qs-juz-progress">
        <div className="qs-juz-progress__labels">
          <span>الجزء {juzNum} / 30</span>
          <span>موقعك: {scrollPct}%</span>
        </div>
        <div className="qs-juz-progress__bar">
          <div className="qs-juz-progress__fill" style={{ width: `${scrollPct}%` }} />
        </div>
      </div>

      {loading && <p className="qs-loading" style={{ textAlign: "center", padding: "2rem" }}>جاري تحميل الجزء {juzNum}…</p>}
      {error && <p className="qs-error" style={{ textAlign: "center", padding: "1rem" }}>{error}</p>}

      {juzData && !loading && (
        <div ref={scrollRef} onScroll={handleScroll} style={{ maxHeight: "65vh", overflowY: "auto" }}>
          {(() => {
            const elements: React.ReactNode[] = [];
            let lastSurah = -1;
            juzData.ayahs.forEach((ayah, idx) => {
              const cur = ayah.surahNumber ?? -1;
              if (cur !== -1 && cur !== lastSurah) {
                lastSurah = cur;
                elements.push(
                  <div key={`hdr-${cur}-${idx}`} className="qs-juz-surah-header">
                    سورة {surahNameMap.get(cur) ?? cur}
                  </div>
                );
              }
              elements.push(
                <div key={ayah.number} className="qs-juz-ayah">
                  <span className="qs-juz-ayah__num">{ayah.numberInSurah}</span>
                  <p
                    className="qs-juz-ayah__text"
                    lang="ar"
                    dir="rtl"
                    style={{ fontSize: fontScale }}
                  >
                    {ayah.text}
                  </p>
                </div>
              );
            });
            return elements;
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function QuranPage() {
  const reader = useQuranReader();
  const { detail, loading, error, surahNum, targetAyah, summary } = reader;
  const totalAyahs = detail?.numberOfAyahs ?? 0;
  const player = useAyahPlayer(surahNum, totalAyahs);

  const [viewMode, setViewMode] = useState<ViewMode>(() => ls<ViewMode>(VIEW_KEY, "surah"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [fontScale, setFontScale] = useState(() => ls<number>(FS_KEY, 26));
  const [nightMode, setNightMode] = useState(() => ls<boolean>(NIGHT_KEY, false));
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    try {
      return (localStorage.getItem(WARM_KEY) as DisplayMode) ?? (ls<boolean>(NIGHT_KEY, false) ? "night" : "light");
    } catch { return "light"; }
  });
  const cycleDisplay = useCallback(() => {
    setDisplayMode((m) => {
      const next: DisplayMode = m === "light" ? "warm" : m === "warm" ? "night" : "light";
      try { localStorage.setItem(WARM_KEY, next); } catch { /* ignore */ }
      // backward-compat with nightMode flag
      setNightMode(next === "night");
      lsSet(NIGHT_KEY, next === "night");
      return next;
    });
  }, []);
  const [showAyahNumbers, setShowAyahNumbers] = useState(true);

  const [tafsirId, setTafsirId] = useState<TafsirId>(() => {
    try { return (localStorage.getItem(TAFSIR_KEY) as TafsirId) || "ar.muyassar"; }
    catch { return "ar.muyassar"; }
  });
  const [tafsirAyahs, setTafsirAyahs] = useState<TafsirAyah[]>([]);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  const [qiraatId, setQiraatId] = useState<string>(() => getQiraatPref());
  const [qiraatDetail, setQiraatDetail] = useState<SurahDetail | null>(null);
  const [qiraatLoading, setQiraatLoading] = useState(false);

  useEffect(() => {
    if (qiraatId === "hafs") { setQiraatDetail(null); return; }
    setQiraatLoading(true);
    fetchSurahDetailQiraat(surahNum, qiraatId)
      .then(setQiraatDetail)
      .catch(() => setQiraatDetail(null))
      .finally(() => setQiraatLoading(false));
  }, [surahNum, qiraatId]);

  const activeDetail = qiraatId === "hafs" ? detail : (qiraatDetail ?? detail);
  const activeAyahs: Ayah[] = activeDetail?.ayahs ?? [];

  const changeTafsirId = useCallback((id: TafsirId) => {
    setTafsirId(id);
    try { localStorage.setItem(TAFSIR_KEY, id); } catch { /* ignore */ }
  }, []);

  // Load tafsir for verse view automatically
  useEffect(() => {
    if (viewMode !== "verse") return;
    setTafsirLoading(true);
    fetchTafsirAyahs(surahNum, tafsirId)
      .then(setTafsirAyahs)
      .catch(() => setTafsirAyahs([]))
      .finally(() => setTafsirLoading(false));
  }, [surahNum, tafsirId, viewMode]);

  const tafsirMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of tafsirAyahs) m.set(t.numberInSurah, t.text);
    return m;
  }, [tafsirAyahs]);

  const handleFontScale = useCallback((delta: number) => {
    setFontScale((v) => {
      const next = Math.min(42, Math.max(18, v + delta));
      lsSet(FS_KEY, next);
      return next;
    });
  }, []);

  const handleGoToResult = useCallback((surah: number, ayah: number) => {
    reader.goToSurah(surah, ayah);
    setShowSearch(false);
  }, [reader]);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    lsSet(VIEW_KEY, mode);
  };

  // ── Immersive mushaf mode — full-viewport reader ──
  if (viewMode === "page") {
    return <PageView onExit={() => handleViewChange("surah")} />;
  }

  const handleQiraatChange = (id: string) => {
    setQiraatId(id);
    setQiraatPref(id);
    setQiraatDetail(null);
  };

  const currentQiraat = QIRAAT_LIST.find((q) => q.id === qiraatId);

  const toggleNight = useCallback(() => {
    setNightMode((v) => { lsSet(NIGHT_KEY, !v); return !v; });
  }, []);

  const displayStyles: React.CSSProperties =
    displayMode === "night" ? { background: "#0d1117", color: "#e8d5b0", minHeight: "100vh" } :
    displayMode === "warm"  ? { background: "#fdf3e3", color: "#3d2b1f", minHeight: "100vh" } :
    {};

  return (
    <div className={`quran-shell${displayMode === "night" ? " quran-shell--night" : displayMode === "warm" ? " quran-shell--warm" : ""}`}
      style={displayStyles}
    >
      {/* Sub-navigation */}
      <nav className="qs-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="qs-subnav__link is-active">المصحف</Link>
        <Link href="/quran-radio" className="qs-subnav__link">الإذاعة والبث</Link>
      </nav>

      {/* ── View mode tabs — clean pill design ── */}
      <div className="qs-view-tabs" role="tablist" aria-label="طريقة العرض">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={viewMode === v.id}
            className={`qs-view-tab${viewMode === v.id ? " is-active" : ""}`}
            onClick={() => handleViewChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="qs-layout">
        {/* Sidebar overlay */}
        <div
          className={`qs-sidebar-backdrop${sidebarOpen ? " is-open" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar — surah list */}
        <aside className={`qs-sidebar${sidebarOpen ? " is-open" : ""}`}>
          <SurahList
            surahs={reader.surahList}
            currentSurah={surahNum}
            onSelect={(n) => { reader.goToSurah(n); setSidebarOpen(false); }}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        {/* Main content */}
        <main className="qs-main">
          {/* Controls row — minimal */}
          <div className="qs-controls-row">
            {(viewMode === "surah" || viewMode === "verse") && (
              <button
                type="button"
                className="qs-ctrl-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="قائمة السور"
              >
                ☰ السور
              </button>
            )}
            <button
              type="button"
              className="qs-ctrl-btn"
              onClick={() => setShowSearch((v) => !v)}
              aria-label={showSearch ? "إغلاق البحث" : "بحث في القرآن"}
            >
              {showSearch ? "✕" : "🔍"} بحث
            </button>
            <button
              type="button"
              className="qs-ctrl-btn"
              onClick={cycleDisplay}
              aria-label={displayMode === "night" ? "وضع النهار" : displayMode === "warm" ? "وضع الليل" : "وضع الورقة الدافئة"}
              title={displayMode === "night" ? "نهاري ☀️" : displayMode === "warm" ? "ليلي 🌙" : "ورقة دافئة 📜"}
            >
              {displayMode === "night" ? "☀️" : displayMode === "warm" ? "🌙" : "📜"}
            </button>

            {/* Qiraat selector — compact */}
            {(viewMode === "surah" || viewMode === "verse") && (
              <div className="qs-qiraat-row">
                <select
                  value={qiraatId}
                  onChange={(e) => handleQiraatChange(e.target.value)}
                  className="qs-qiraat-select"
                  aria-label="اختر القراءة"
                >
                  {QIRAAT_LIST.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name}{!q.apiEdition ? " (قريباً)" : ""}
                    </option>
                  ))}
                </select>
                {qiraatLoading && <span className="qs-qiraat-loading">…</span>}
              </div>
            )}
          </div>

          {/* Resume banner */}
          {reader.lastPos && reader.lastPos.surah !== surahNum && (viewMode === "surah" || viewMode === "verse") && (
            <div className="qs-resume-banner">
              <span>
                <strong>استئناف:</strong>{" "}
                {reader.surahList.find((s) => s.number === reader.lastPos!.surah)?.name ?? reader.lastPos.surah} آية {reader.lastPos.ayah}
              </span>
              <button
                type="button"
                className="qs-ctrl-btn qs-ctrl-btn--accent"
                onClick={() => reader.goToSurah(reader.lastPos!.surah, reader.lastPos!.ayah)}
              >
                اذهب
              </button>
            </div>
          )}

          {/* Search panel */}
          {showSearch && <QuranSearch onGoToResult={handleGoToResult} />}

          {/* ── View Modes ── */}

          {viewMode === "juz" && <JuzView fontScale={fontScale} />}

          {(viewMode === "surah" || viewMode === "verse") && (
            <>
              {loading && <div className="qs-loading" style={{ padding: "3rem", textAlign: "center" }}>جاري تحميل السورة…</div>}

              {!loading && error && (
                <div className="qs-error" role="alert" style={{ padding: "1.5rem", textAlign: "center" }}>
                  <p>{error}</p>
                  <button
                    type="button"
                    className="qs-ctrl-btn qs-ctrl-btn--accent"
                    style={{ marginTop: ".75rem" }}
                    onClick={() => reader.goToSurah(surahNum)}
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {!loading && !error && activeAyahs.length > 0 && viewMode === "surah" && (
                <>
                  <AyahDisplay
                    ayahs={activeAyahs}
                    surahNum={surahNum}
                    surahName={activeDetail?.name ?? ""}
                    targetAyah={targetAyah}
                    currentPlayingAyah={player.currentAyah}
                    playerState={player.playerState}
                    fontScale={fontScale}
                    showAyahNumbers={showAyahNumbers}
                    onPlayAyah={player.togglePlayAyah}
                    onAyahClick={reader.goToAyah}
                  />
                  <p className="qs-source-note">
                    القراءة: {currentQiraat?.name} · AlQuran Cloud API
                  </p>
                </>
              )}

              {!loading && !error && activeAyahs.length > 0 && viewMode === "verse" && (
                <VerseView
                  ayahs={activeAyahs}
                  surahName={activeDetail?.name ?? ""}
                  tafsirMap={tafsirMap}
                  tafsirId={tafsirId}
                  tafsirLoading={tafsirLoading}
                  onChangeTafsir={changeTafsirId}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Sticky player bar — surah view only */}
      {summary && viewMode === "surah" && (
        <QuranPlayerBar
          surahName={summary.name}
          surahNum={surahNum}
          totalAyahs={totalAyahs}
          currentAyah={player.currentAyah}
          playerState={player.playerState}
          reciterId={player.reciterId}
          fontScale={fontScale}
          showAyahNumbers={showAyahNumbers}
          prevSurah={reader.prevSurah}
          nextSurah={reader.nextSurah}
          onReciterChange={player.setReciterId}
          onFontScale={handleFontScale}
          onToggleAyahNumbers={() => setShowAyahNumbers((v) => !v)}
          onPrevSurah={() => reader.prevSurah && reader.goToSurah(reader.prevSurah)}
          onNextSurah={() => reader.nextSurah && reader.goToSurah(reader.nextSurah)}
          onStop={player.stop}
          onPlayFromAyah={player.playFromAyah}
          onPause={player.pause}
          onResume={player.resume}
        />
      )}
    </div>
  );
}
