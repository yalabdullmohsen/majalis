/**
 * QuranViewer — Madani mushaf page surface wired to QuranEngineContext.
 *
 * - Horizontal RTL swipe between pages 1–604 (native touch + keyboard)
 * - Lazy-loads only the active page DOM; prefetches ±1 JSON/fonts
 * - Persists progress via updateReadingProgress on page change
 * - Tap ayah → highlight + QuranActionBar + onAyahSelect
 *
 * Performance: transform-only page transitions (PageCurlStage).
 * Action bar uses Framer Motion separately (does not animate page turns).
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent,
} from "react";
import { MushafPageV2 } from "@/components/quran/MushafPageV2";
import { PageCurlStage } from "@/components/quran/PageCurlStage";
import { QuranActionBar } from "@/components/QuranActionBar";
import {
  useQuranEngineCore,
  type ActiveVerse,
} from "@/core/quran/QuranEngineContext";
import {
  getAyahTextFromLayout,
  loadMushafPage,
  prefetchMushafPage,
  type MushafPageLayout,
} from "@/lib/mushaf-v2-data";
import "@/styles/mushaf-v2.css";
import "@/styles/quran.css";
import "@/styles/quran-reader-part4.css";
import "@/styles/quran-viewer.css";

const TOTAL_PAGES = 604;
const SWIPE_THRESHOLD_PX = 55;

export type QuranViewerAyahSelect = {
  surah: number;
  ayah: number;
  verseKey: string;
  page: number;
  text: string;
};

export type QuranViewerProps = {
  /** Seed page when context has not hydrated yet (1–604). */
  initialPage?: number;
  /** Called when the user taps an ayah (after highlight). */
  onAyahSelect?: (ayah: QuranViewerAyahSelect) => void;
  className?: string;
  /** Show compact page chrome (prev/next + page number). Default true. */
  showChrome?: boolean;
  style?: CSSProperties;
};

function clampPage(n: number): number {
  return Math.min(TOTAL_PAGES, Math.max(1, Math.floor(n) || 1));
}

function parseVerseKey(key: string): { surah: number; ayah: number } | null {
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(key);
  if (!m) return null;
  return { surah: Number(m[1]), ayah: Number(m[2]) };
}

export function QuranViewer({
  initialPage,
  onAyahSelect,
  className,
  showChrome = true,
  style,
}: QuranViewerProps) {
  const {
    state,
    activePage,
    hydrating,
    isTajweedEnabled,
    setPage,
    setActiveVerse,
    updateReadingProgress,
    toggleTajweed,
  } = useQuranEngineCore();

  const [layout, setLayout] = useState<MushafPageLayout | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<QuranViewerAyahSelect | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const ignoreSwipe = useRef(false);
  const pageRef = useRef(activePage);
  pageRef.current = activePage;

  // Seed from route/prop when provided (URL wins over default page 1)
  useEffect(() => {
    if (initialPage == null) return;
    setPage(clampPage(initialPage));
  }, [initialPage, setPage]);

  /** Commit a new page: update engine + persist khatmah. */
  const commitPage = useCallback(
    (next: number, verse?: ActiveVerse) => {
      const page = clampPage(next);
      if (page === pageRef.current && !verse) return;

      if (verse) {
        setActiveVerse({ ...verse, page }, { persist: true });
      } else {
        setPage(page);
        const surah = state.surah || 1;
        const ayah = state.ayah ?? 1;
        void updateReadingProgress({ surah, ayah, page });
      }

      // Warm neighbors (JSON only — fonts via MushafPageV2 hook)
      prefetchMushafPage(page - 1);
      prefetchMushafPage(page + 1);
    },
    [setActiveVerse, setPage, state.ayah, state.surah, updateReadingProgress],
  );

  // Load active page layout; keep only current page in React state (memory)
  useEffect(() => {
    let cancelled = false;
    const page = clampPage(activePage);
    setLoadingPage(true);
    void (async () => {
      try {
        const data = await loadMushafPage(page);
        if (!cancelled) setLayout(data);
        prefetchMushafPage(page - 1);
        prefetchMushafPage(page + 1);
      } catch {
        if (!cancelled) setLayout(null);
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePage]);

  const goNext = useCallback(() => {
    if (activePage < TOTAL_PAGES) commitPage(activePage + 1);
  }, [activePage, commitPage]);

  const goPrev = useCallback(() => {
    if (activePage > 1) commitPage(activePage - 1);
  }, [activePage, commitPage]);

  // Keyboard — ArrowLeft = next in RTL mushaf (matches MushafPageView)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    ignoreSwipe.current = false;
    setDragging(true);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
      ignoreSwipe.current = true;
      setDragOffset(0);
      return;
    }
    // Rubber-band clamp ~72px
    const max = 72;
    setDragOffset(Math.max(-max, Math.min(max, dx * 0.35)));
  };

  const onTouchEnd = (e: TouchEvent) => {
    setDragging(false);
    setDragOffset(0);
    if (touchStartX.current == null || ignoreSwipe.current) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    // RTL: finger left → next page
    if (delta < 0) goNext();
    else goPrev();
  };

  const onAyahPress = useCallback(
    (verseKey: string) => {
      const parsed = parseVerseKey(verseKey);
      if (!parsed) return;
      const page = clampPage(activePage);
      setActiveVerse({ surah: parsed.surah, ayah: parsed.ayah, page }, { persist: true });
      const text = layout ? getAyahTextFromLayout(layout, verseKey) ?? "" : "";
      const payload: QuranViewerAyahSelect = {
        surah: parsed.surah,
        ayah: parsed.ayah,
        verseKey,
        page,
        text,
      };
      setSelectedAyah(payload);
      onAyahSelect?.(payload);
    },
    [activePage, layout, onAyahSelect, setActiveVerse],
  );

  // Dismiss action bar when turning pages so it never covers unread text
  useEffect(() => {
    setSelectedAyah(null);
  }, [activePage]);

  const activeAyahKey = state.verseKey;

  return (
    <div
      className={`quran-viewer ${className ?? ""}`.trim()}
      style={style}
      dir="rtl"
      data-page={activePage}
      data-hydrating={hydrating ? "1" : "0"}
      data-action-bar={selectedAyah ? "1" : "0"}
      aria-busy={hydrating || loadingPage}
    >
      {showChrome && (
        <div className="quran-viewer__chrome" role="toolbar" aria-label="تنقّل صفحات المصحف">
          <button
            type="button"
            className="quran-viewer__nav-btn"
            onClick={goPrev}
            disabled={activePage <= 1}
            aria-label="الصفحة السابقة"
          >
            السابق
          </button>
          <span className="quran-viewer__page-label" aria-live="polite">
            صفحة {activePage} / {TOTAL_PAGES}
          </span>
          <button
            type="button"
            className="quran-viewer__nav-btn"
            onClick={goNext}
            disabled={activePage >= TOTAL_PAGES}
            aria-label="الصفحة التالية"
          >
            التالي
          </button>
          <button
            type="button"
            className={`quran-viewer__nav-btn quran-viewer__tajweed-btn${isTajweedEnabled ? " is-active" : ""}`}
            role="switch"
            aria-checked={isTajweedEnabled}
            aria-label="تفعيل تلوين أحكام التجويد"
            onClick={() => toggleTajweed()}
          >
            {isTajweedEnabled ? "تجويد ✓" : "تجويد"}
          </button>
        </div>
      )}

      <div
        className="quran-viewer__stage qs-mushaf-frame qs-mushaf-frame--paper"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => {
          setDragging(false);
          setDragOffset(0);
          touchStartX.current = null;
        }}
        style={
          dragging
            ? {
                transform: `translate3d(${dragOffset}px,0,0)`,
                transition: "none",
              }
            : undefined
        }
      >
        <div className="qs-mushaf-body qs-mushaf-body--hl-wash quran-viewer__body">
          <PageCurlStage page={activePage} mode="smooth" className="quran-viewer__curl">
            {loadingPage && !layout ? (
              <div className="mf2-skeleton quran-viewer__skeleton" aria-busy="true" aria-label="تحميل الصفحة" />
            ) : (
              <MushafPageV2
                layout={layout}
                bare
                activeAyahKey={activeAyahKey}
                onAyahPress={onAyahPress}
                screenReaderEnhanced
                tajweedEnabled={isTajweedEnabled}
              />
            )}
          </PageCurlStage>
        </div>
      </div>

      <QuranActionBar ayah={selectedAyah} onClose={() => setSelectedAyah(null)} />
    </div>
  );
}

export default QuranViewer;
