/**
 * QuranViewer — Uthmani ayah list with optional Tajweed tint + selection.
 */
import { useEffect, useState } from "react";
import { fetchSurahDetail, getSurahMeta, type Ayah } from "@/lib/quran-api";
import { useQuranEngine } from "@/hooks/useQuranEngine";
import { QuranActionBar } from "@/components/QuranActionBar";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/quran-engine-ui.css";

export type QuranViewerProps = {
  /** Override initial surah (defaults to engine state). */
  initialSurah?: number;
  className?: string;
};

export function QuranViewer({ initialSurah, className }: QuranViewerProps) {
  const {
    currentSurah,
    currentAyah,
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
  const meta = getSurahMeta(surahNum);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchSurahDetail(surahNum)
      .then((detail) => {
        if (!cancelled) setAyahs(detail.ayahs ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "تعذّر تحميل السورة");
          setAyahs([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [surahNum]);

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
          page: selected.page ?? 1,
          text: ayahs.find((a) => a.numberInSurah === selected.ayah)?.text ?? "",
        }
      : null;

  return (
    <div className={`qe-viewer ${className ?? ""}`.trim()} dir="rtl">
      <header className="qe-viewer__head">
        <div>
          <h1 className="qe-viewer__title">سورة {meta.name}</h1>
          <p className="qe-viewer__sub">
            {meta.revelation} · {toArabicDigits(meta.ayahs)} آية
            {hydrating ? " · جاري المزامنة…" : ""}
          </p>
        </div>
        <button
          type="button"
          className={`qe-chip${isTajweedEnabled ? " is-on" : ""}`}
          onClick={toggleTajweed}
          aria-pressed={isTajweedEnabled}
        >
          تجويد
        </button>
      </header>

      {loading ? (
        <div className="qe-skel" aria-busy="true" aria-label="تحميل الآيات" />
      ) : error ? (
        <p className="qe-viewer__error" role="alert">
          {error}
        </p>
      ) : (
        <ol className={`qe-ayah-list${isTajweedEnabled ? " qe-ayah-list--tajweed" : ""}`}>
          {ayahs.map((ayah) => {
            const active =
              ayah.numberInSurah === currentAyah ||
              selected?.ayah === ayah.numberInSurah;
            return (
              <li key={ayah.numberInSurah}>
                <button
                  type="button"
                  className={`qe-ayah${active ? " is-active" : ""}`}
                  onClick={() =>
                    selectAyah({
                      surah: surahNum,
                      ayah: ayah.numberInSurah,
                    })
                  }
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

      {isActionBarEnabled ? (
        <QuranActionBar ayah={actionAyah} onClose={() => clearActiveVerse()} />
      ) : null}
    </div>
  );
}

export default QuranViewer;
