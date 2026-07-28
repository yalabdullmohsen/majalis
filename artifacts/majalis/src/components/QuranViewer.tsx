/**
 * QuranViewer — Uthmani ayah list with optional Tajweed tint, selection, and Focus Mode.
 *
 * Focus Mode (وضع التركيز): hides chrome (header / page nav / footer) so the
 * mushaf text fills the viewport — same idea as the RN QuranReader sketch
 * (tap toggles chrome; StatusBar-equivalent = app chrome + bottom nav).
 */
import { useCallback, useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { fetchSurahDetail, getSurahMeta, type Ayah } from "@/lib/quran-api";
import { useQuranEngine } from "@/hooks/useQuranEngine";
import { QuranActionBar } from "@/components/QuranActionBar";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/quran-engine-ui.css";

export type QuranViewerProps = {
  /** Override initial surah (defaults to engine state). */
  initialSurah?: number;
  className?: string;
  /** Notify parent (page shell) so it can hide the engine nav. */
  onFocusModeChange?: (focused: boolean) => void;
};

function SurahSkeleton() {
  return (
    <div className="qe-skel-list" aria-busy="true" aria-label="تحميل الآيات">
      <div className="qe-skel-ayah" />
      <div className="qe-skel-ayah" />
      <div className="qe-skel-ayah" />
      <div className="qe-skel-ayah" />
      <div className="qe-skel-ayah" />
    </div>
  );
}

export function QuranViewer({ initialSurah, className, onFocusModeChange }: QuranViewerProps) {
  const {
    currentSurah,
    currentAyah,
    currentPage,
    isTajweedEnabled,
    isActionBarEnabled,
    selectedAyah,
    hydrating,
    selectAyah,
    clearActiveVerse,
    toggleTajweed,
  } = useQuranEngine();

  const surahNum = initialSurah ?? currentSurah;
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const meta = getSurahMeta(surahNum);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const setFocus = useCallback(
    (next: boolean) => {
      setIsFocusMode(next);
      onFocusModeChange?.(next);
    },
    [onFocusModeChange],
  );

  const toggleFocus = useCallback(() => setFocus(!isFocusMode), [isFocusMode, setFocus]);

  useEffect(() => {
    onFocusModeChange?.(isFocusMode);
  }, [isFocusMode, onFocusModeChange]);

  /** Hide app chrome (bottom nav) while focused — mirrors RN StatusBar.hidden. */
  useEffect(() => {
    if (!isFocusMode) return;
    document.body.classList.add("qe-focus-mode");
    return () => document.body.classList.remove("qe-focus-mode");
  }, [isFocusMode]);

  useEffect(() => {
    if (!isFocusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocusMode, setFocus]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const detail = await fetchSurahDetail(surahNum);
        if (cancelled) return;
        setAyahs(detail.ayahs ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error && err.message
              ? err.message
              : "تعذّر تحميل السورة. تحقق من الاتصال ثم أعد المحاولة.",
          );
          setAyahs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surahNum, reloadKey]);

  const selected =
    selectedAyah && selectedAyah.surah === surahNum
      ? selectedAyah
      : null;

  const actionAyah =
    selected && ayahs.length
      ? {
          surah: selected.surah,
          ayah: selected.ayah,
          verseKey: `${selected.surah}:${selected.ayah}`,
          page: selected.page ?? currentPage ?? 1,
          text: ayahs.find((a) => a.numberInSurah === selected.ayah)?.text ?? "",
        }
      : null;

  /** Background tap toggles focus (ayah buttons stopPropagation). */
  const onPageSurfaceClick = () => {
    toggleFocus();
  };

  return (
    <div
      className={`qe-viewer${isFocusMode ? " qe-viewer--focus" : ""} ${className ?? ""}`.trim()}
      dir="rtl"
      data-focus={isFocusMode ? "1" : "0"}
    >
      <div
        className="qe-viewer__page"
        onClick={onPageSurfaceClick}
        role="presentation"
      >
        {/* Header — hidden in focus mode */}
        {!isFocusMode ? (
          <header className="qe-viewer__head" onClick={(e) => e.stopPropagation()}>
            <div>
              <h1 className="qe-viewer__title">سورة {meta.name}</h1>
              <p className="qe-viewer__sub">
                {meta.revelation} · {toArabicDigits(meta.ayahs)} آية
                {hydrating ? " · جاري المزامنة…" : ""}
              </p>
            </div>
            <div className="qe-viewer__head-actions">
              <button
                type="button"
                className={`qe-chip${isTajweedEnabled ? " is-on" : ""}`}
                onClick={toggleTajweed}
                aria-pressed={isTajweedEnabled}
              >
                تجويد
              </button>
              <button
                type="button"
                className="qe-chip"
                onClick={toggleFocus}
                aria-pressed={false}
                title="وضع التركيز"
              >
                <Maximize2 size={14} aria-hidden="true" />
                تركيز
              </button>
            </div>
          </header>
        ) : (
          <button
            type="button"
            className="qe-viewer__exit-focus"
            onClick={(e) => {
              e.stopPropagation();
              setFocus(false);
            }}
            aria-label="إنهاء وضع التركيز"
          >
            <Minimize2 size={16} aria-hidden="true" />
            إنهاء التركيز
          </button>
        )}

        {loading ? (
          <SurahSkeleton />
        ) : error ? (
          <div role="alert" onClick={(e) => e.stopPropagation()}>
            <p className="qe-viewer__error">{error}</p>
            <button type="button" className="qe-viewer__retry" onClick={reload}>
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <ol
            className={`qe-ayah-list${isTajweedEnabled ? " qe-ayah-list--tajweed" : ""}${isFocusMode ? " qe-ayah-list--focus" : ""}`}
          >
            {ayahs.map((ayah) => {
              const active =
                ayah.numberInSurah === currentAyah ||
                selected?.ayah === ayah.numberInSurah;
              return (
                <li key={ayah.numberInSurah}>
                  <button
                    type="button"
                    className={`qe-ayah${active ? " is-active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAyah({
                        surah: surahNum,
                        ayah: ayah.numberInSurah,
                      });
                    }}
                  >
                    <span className="qe-ayah__num" aria-hidden="true">
                      {toArabicDigits(ayah.numberInSurah)}
                    </span>
                    <span className="qe-ayah__text">{ayah.text}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        {/* Footer page marker — hidden in focus mode */}
        {!isFocusMode && !loading && !error ? (
          <footer className="qe-viewer__footer" onClick={(e) => e.stopPropagation()}>
            <span>
              سورة {meta.name} · صفحة {toArabicDigits(currentPage)}
            </span>
          </footer>
        ) : null}

        {isFocusMode ? (
          <p className="qe-viewer__focus-hint" aria-live="polite">
            انقر على الخلفية أو Esc للخروج من وضع التركيز
          </p>
        ) : null}
      </div>

      {isActionBarEnabled && actionAyah ? (
        <div onClick={(e) => e.stopPropagation()}>
          <QuranActionBar ayah={actionAyah} onClose={() => clearActiveVerse()} />
        </div>
      ) : null}
    </div>
  );
}

export default QuranViewer;
