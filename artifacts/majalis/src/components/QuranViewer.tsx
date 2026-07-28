/**
 * QuranViewer — Uthmani ayah list with optional Tajweed tint, selection, and Focus Mode.
 *
 * Focus Mode (وضع التركيز): hides chrome so the mushaf fills the viewport.
 * Font size is user-controlled (18–40, step 2), persisted in localStorage
 * (`userFontSize` — same key as the RN AsyncStorage sketch), with
 * lineHeight = fontSize + 20. The ± control bar is hidden while focused.
 * Reader theme (light/dark paper) uses THEMES below — independent of app chrome.
 * Ayah numbers toggle (`showAyahNumbers` via useQuranPreferences) hides badges and
 * strips parenthetical markers via renderQuranText — same idea as the RN sketch.
 * After 30 minutes of reading, a gentle break reminder appears (RN Alert.alert port).
 * Typeface cycles Amiri → Traditional Arabic → Scheherazade via prefs.fontId.
 * Inline tafsir mode (`showTafsir`) loads the surah edition once and renders
 * under each ayah when enabled — RN conditional-rendering sketch.
 * `text-size-adjust: 100%` resists OS/browser text scaling (RN allowFontScaling={false}).
 */
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { BookOpenText, Hash, Maximize2, Minimize2, Moon, Sun, Type } from "lucide-react";
import { fetchSurahDetail, fetchTafsirAyahs, getSurahMeta, type Ayah } from "@/lib/quran-api";
import { useQuranEngine } from "@/hooks/useQuranEngine";
import { useQuranPreferences } from "@/hooks/useQuranPreferences";
import { useReadingBreakReminder } from "@/hooks/useReadingBreakReminder";
import { nextQuranFontId, quranFontOption, quranFontStack } from "@/lib/quran-font-options";
import { DEFAULT_TAFSEER_SOURCE } from "@/core/tafseer/TafseerService";
import { QuranActionBar } from "@/components/QuranActionBar";
import { ReadingBreakDialog } from "@/components/quran/ReadingBreakDialog";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/quran-engine-ui.css";

/** Reader paper themes — defined outside the component (RN FullScreenQuranReader sketch). */
export const THEMES = {
  light: {
    background: "#FAF6EF",
    text: "#000000",
    header: "#F0EAD6",
  },
  dark: {
    background: "#1A1A1A",
    text: "#D1D1D1",
    header: "#262626",
  },
} as const;

export type QuranReaderThemeId = keyof typeof THEMES;

export const QURAN_THEME_STORAGE_KEY = "quranReaderDarkMode";
export const QURAN_TAFSIR_TOGGLE_KEY = "quranReaderShowTafsir";
export const QURAN_INLINE_TAFSIR_EDITION_KEY = "majalis-mushaf-tafsir-edition-v1";

/** Mushaf type scale — mirrors RN FullScreenQuranReader sketch. */
export const QURAN_FONT_MIN_PX = 18;
export const QURAN_FONT_MAX_PX = 40;
export const QURAN_FONT_STEP_PX = 2;
export const QURAN_FONT_DEFAULT_PX = 24;
export const QURAN_FONT_STORAGE_KEY = "userFontSize";

function readStoredShowTafsir(): boolean {
  try {
    const raw = localStorage.getItem(QURAN_TAFSIR_TOGGLE_KEY);
    if (raw == null) return false;
    return raw === "1" || raw === "true";
  } catch {
    return false;
  }
}

function readInlineTafsirEdition(): string {
  try {
    const v = localStorage.getItem(QURAN_INLINE_TAFSIR_EDITION_KEY);
    if (v) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_TAFSEER_SOURCE;
}
/**
 * Strip parenthetical ayah markers from continuous mushaf text when numbers are hidden.
 * Matches Western and Arabic-Indic digits: (24) / (٢٤).
 */
export function renderQuranText(text: string, showAyahNumbers: boolean): string {
  if (showAyahNumbers) return text;
  return text
    .replace(/\([0-9٠-٩۰-۹]+\)/g, "")
    .replace(/[ \t\u00a0]{2,}/g, " ")
    .trim();
}

function clampFontSize(n: number): number {
  const stepped = Math.round(n / QURAN_FONT_STEP_PX) * QURAN_FONT_STEP_PX;
  return Math.min(QURAN_FONT_MAX_PX, Math.max(QURAN_FONT_MIN_PX, stepped));
}

function readStoredFontSize(): number {
  try {
    const raw = localStorage.getItem(QURAN_FONT_STORAGE_KEY);
    if (raw == null) return QURAN_FONT_DEFAULT_PX;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return QURAN_FONT_DEFAULT_PX;
    return clampFontSize(parsed);
  } catch {
    return QURAN_FONT_DEFAULT_PX;
  }
}

function readStoredDarkMode(): boolean {
  try {
    const raw = localStorage.getItem(QURAN_THEME_STORAGE_KEY);
    if (raw == null) return false;
    return raw === "1" || raw === "true";
  } catch {
    return false;
  }
}

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
  const { prefs, setPref } = useQuranPreferences();
  const showAyahNumbers = prefs.showAyahNumbers;
  const fontFamily = quranFontStack(prefs.fontId);
  const fontMeta = quranFontOption(prefs.fontId);
  const breakReminder = useReadingBreakReminder();

  const surahNum = initialSurah ?? currentSurah;
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState(QURAN_FONT_DEFAULT_PX);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirByAyah, setTafsirByAyah] = useState<Record<number, string>>({});
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  const meta = getSurahMeta(surahNum);
  const currentTheme = isDarkMode ? THEMES.dark : THEMES.light;

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const toggleAyahNumbers = useCallback(() => {
    setPref("showAyahNumbers", !showAyahNumbers);
  }, [setPref, showAyahNumbers]);

  /** RN toggleFont — cycle Amiri → Traditional Arabic → Scheherazade. */
  const toggleFont = useCallback(() => {
    setPref("fontId", nextQuranFontId(prefs.fontId));
  }, [prefs.fontId, setPref]);

  const toggleTafsir = useCallback(() => {
    setShowTafsir((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(QURAN_TAFSIR_TOGGLE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setFocus = useCallback(
    (next: boolean) => {
      setIsFocusMode(next);
      onFocusModeChange?.(next);
    },
    [onFocusModeChange],
  );

  const toggleFocus = useCallback(() => setFocus(!isFocusMode), [isFocusMode, setFocus]);

  /** Load persisted font size + reader theme + tafsir toggle once. */
  useEffect(() => {
    setFontSize(readStoredFontSize());
    setIsDarkMode(readStoredDarkMode());
    setShowTafsir(readStoredShowTafsir());
  }, []);

  /** When inline tafsir is on, fetch the whole surah edition once (cached). */
  useEffect(() => {
    if (!showTafsir) return;
    let cancelled = false;
    setTafsirLoading(true);
    setTafsirError(false);
    void (async () => {
      try {
        const edition = readInlineTafsirEdition();
        const rows = await fetchTafsirAyahs(surahNum, edition);
        if (cancelled) return;
        const map: Record<number, string> = {};
        for (const row of rows) {
          if (row.text) map[row.numberInSurah] = row.text;
        }
        setTafsirByAyah(map);
        if (!rows.length) setTafsirError(true);
      } catch {
        if (!cancelled) {
          setTafsirByAyah({});
          setTafsirError(true);
        }
      } finally {
        if (!cancelled) setTafsirLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showTafsir, surahNum]);

  const updateFontSize = useCallback((next: number) => {
    const clamped = clampFontSize(next);
    setFontSize(clamped);
    try {
      localStorage.setItem(QURAN_FONT_STORAGE_KEY, String(clamped));
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const setReaderDarkMode = useCallback((next: boolean) => {
    setIsDarkMode(next);
    try {
      localStorage.setItem(QURAN_THEME_STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setReaderDarkMode(!isDarkMode);
  }, [isDarkMode, setReaderDarkMode]);

  const increaseFont = useCallback(() => {
    if (fontSize < QURAN_FONT_MAX_PX) updateFontSize(fontSize + QURAN_FONT_STEP_PX);
  }, [fontSize, updateFontSize]);

  const decreaseFont = useCallback(() => {
    if (fontSize > QURAN_FONT_MIN_PX) updateFontSize(fontSize - QURAN_FONT_STEP_PX);
  }, [fontSize, updateFontSize]);

  useEffect(() => {
    onFocusModeChange?.(isFocusMode);
  }, [isFocusMode, onFocusModeChange]);

  /** Hide app chrome (bottom nav) while focused — mirrors RN StatusBar.hidden. */
  useEffect(() => {
    if (!isFocusMode) return;
    document.body.classList.add("qe-focus-mode");
    document.body.style.setProperty("--qe-reader-bg", currentTheme.background);
    document.body.style.backgroundColor = currentTheme.background;
    return () => {
      document.body.classList.remove("qe-focus-mode");
      document.body.style.removeProperty("--qe-reader-bg");
      document.body.style.backgroundColor = "";
    };
  }, [isFocusMode, currentTheme.background]);

  useEffect(() => {
    if (!isFocusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocusMode, setFocus]);

  const mushafTypeStyle = {
    ["--qe-mushaf-fs" as string]: `${fontSize}px`,
    ["--qe-mushaf-lh" as string]: `${fontSize + 20}px`,
    ["--qe-reader-bg" as string]: currentTheme.background,
    ["--qe-reader-text" as string]: currentTheme.text,
    ["--qe-reader-header" as string]: currentTheme.header,
    ["--qe-reader-font" as string]: fontFamily,
    backgroundColor: currentTheme.background,
    color: currentTheme.text,
  } as CSSProperties;

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
      className={`qe-viewer${isFocusMode ? " qe-viewer--focus" : ""}${isDarkMode ? " qe-viewer--dark" : " qe-viewer--light"} ${className ?? ""}`.trim()}
      dir="rtl"
      data-focus={isFocusMode ? "1" : "0"}
      data-reader-theme={isDarkMode ? "dark" : "light"}
      style={mushafTypeStyle}
    >
      {/* Chrome outside the tappable surface — no stopPropagation needed */}
      {!isFocusMode ? (
        <header className="qe-viewer__head">
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
              className={`qe-chip${showAyahNumbers ? " is-on" : ""}`}
              onClick={toggleAyahNumbers}
              aria-pressed={showAyahNumbers}
              aria-label={showAyahNumbers ? "إخفاء أرقام الآيات" : "إظهار أرقام الآيات"}
              title="أرقام الآيات"
            >
              <Hash size={14} aria-hidden="true" />
              أرقام
            </button>
            <button
              type="button"
              className={`qe-chip${showTafsir ? " is-on" : ""}`}
              onClick={toggleTafsir}
              aria-pressed={showTafsir}
              aria-label={showTafsir ? "إخفاء التفسير المضمّن" : "إظهار التفسير تحت الآيات"}
              title="التفسير"
            >
              <BookOpenText size={14} aria-hidden="true" />
              تفسير
            </button>
            <button
              type="button"
              className="qe-chip"
              onClick={toggleFont}
              aria-label={`خط المصحف: ${fontMeta.labelAr} — اضغط للتبديل`}
              title={`${fontMeta.label} / ${fontMeta.labelAr}`}
            >
              <Type size={14} aria-hidden="true" />
              {fontMeta.labelAr}
            </button>
            <button
              type="button"
              className="qe-chip"
              onClick={toggleDarkMode}
              aria-pressed={isDarkMode}
              aria-label={isDarkMode ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي"}
              title={isDarkMode ? "نهاري" : "ليلي"}
            >
              {isDarkMode ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
              {isDarkMode ? "نهاري" : "ليلي"}
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
          onClick={() => setFocus(false)}
          aria-label="إنهاء وضع التركيز"
        >
          <Minimize2 size={16} aria-hidden="true" />
          إنهاء التركيز
        </button>
      )}

      <div className="qe-viewer__page" onClick={onPageSurfaceClick} role="presentation">
        {loading ? (
          <SurahSkeleton />
        ) : error ? (
          <div role="alert">
            <p className="qe-viewer__error">{error}</p>
            <button
              type="button"
              className="qe-viewer__retry"
              onClick={(e) => {
                e.stopPropagation();
                reload();
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <ol
            className={`qe-ayah-list${isTajweedEnabled ? " qe-ayah-list--tajweed" : ""}${isFocusMode ? " qe-ayah-list--focus" : ""}${showAyahNumbers ? "" : " qe-ayah-list--no-nums"}`}
          >
            {ayahs.map((ayah) => {
              const active =
                ayah.numberInSurah === currentAyah ||
                selected?.ayah === ayah.numberInSurah;
              const ayahTafsir = tafsirByAyah[ayah.numberInSurah];
              return (
                <li key={ayah.numberInSurah} className="qe-ayah-item">
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
                    {showAyahNumbers ? (
                      <span className="qe-ayah__num" aria-hidden="true">
                        {toArabicDigits(ayah.numberInSurah)}
                      </span>
                    ) : null}
                    <span
                      className="qe-ayah__text"
                      style={{
                        fontFamily,
                        fontSize: `${fontSize}px`,
                        lineHeight: `${fontSize + 20}px`,
                        textAlign: "right",
                        color: currentTheme.text,
                      }}
                    >
                      {renderQuranText(ayah.text, showAyahNumbers)}
                    </span>
                  </button>
                  {showTafsir ? (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- stop focus-toggle bubble only
                    <div
                      className="qe-ayah__tafsir"
                      onClick={(e) => e.stopPropagation()}
                      role="note"
                      aria-label={`تفسير الآية ${toArabicDigits(ayah.numberInSurah)}`}
                    >
                      {tafsirLoading && !ayahTafsir ? (
                        <span className="qe-ayah__tafsir-status">جاري تحميل التفسير…</span>
                      ) : ayahTafsir ? (
                        <p className="qe-ayah__tafsir-text">{ayahTafsir}</p>
                      ) : tafsirError ? (
                        <span className="qe-ayah__tafsir-status">تعذّر تحميل التفسير لهذه الآية.</span>
                      ) : (
                        <span className="qe-ayah__tafsir-status">لا يتوفر تفسير لهذه الآية حاليًا.</span>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}

        {isFocusMode ? (
          <p className="qe-viewer__focus-hint" aria-live="polite">
            انقر على الخلفية أو Esc للخروج من وضع التركيز
          </p>
        ) : null}
      </div>

      {!isFocusMode && !loading && !error ? (
        <footer className="qe-viewer__footer">
          <span>
            سورة {meta.name} · صفحة {toArabicDigits(currentPage)}
          </span>
        </footer>
      ) : null}

      {/* Font controls — hidden in focus mode (RN controlBar) */}
      {!isFocusMode ? (
        <div className="qe-font-bar" role="group" aria-label="حجم خط المصحف">
          <button
            type="button"
            className="qe-font-bar__btn"
            onClick={decreaseFont}
            disabled={fontSize <= QURAN_FONT_MIN_PX}
            aria-label="تصغير الخط"
          >
            −
          </button>
          <span className="qe-font-bar__value" aria-live="polite">
            {toArabicDigits(fontSize)}
          </span>
          <button
            type="button"
            className="qe-font-bar__btn"
            onClick={increaseFont}
            disabled={fontSize >= QURAN_FONT_MAX_PX}
            aria-label="تكبير الخط"
          >
            +
          </button>
        </div>
      ) : null}

      {isActionBarEnabled && actionAyah ? (
        <QuranActionBar ayah={actionAyah} onClose={() => clearActiveVerse()} />
      ) : null}

      <ReadingBreakDialog
        open={breakReminder.open}
        title={breakReminder.title}
        message={breakReminder.message}
        onDismiss={breakReminder.dismiss}
      />
    </div>
  );
}

export default QuranViewer;
