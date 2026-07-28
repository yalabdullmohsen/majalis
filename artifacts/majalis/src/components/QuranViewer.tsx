/**
 * QuranViewer — Uthmani ayah list with optional Tajweed tint, selection, and Focus Mode.
 *
 * Focus Mode (وضع التركيز): hides chrome so the mushaf fills the viewport.
 * Font size is user-controlled (12–40, step 2, default 20), persisted in localStorage
 * (`userFontSize` — same key as the RN AsyncStorage sketch), with
 * lineHeight = fontSize * 1.5. The ± control bar is hidden while focused.
 * Reader theme (light/dark paper) uses THEMES below — independent of app chrome.
 * Ayah numbers toggle (`showAyahNumbers` via useQuranPreferences) hides badges and
 * strips parenthetical markers via renderQuranText — same idea as the RN sketch.
 * After 30 minutes of reading, a gentle break reminder appears (RN Alert.alert port).
 * Typeface cycles Amiri → Traditional Arabic → Scheherazade via prefs.fontId.
 * Inline tafsir mode (`showTafsir`) loads the surah edition once and renders
 * under each ayah when enabled — RN conditional-rendering sketch.
 * Inline translation (`showTranslation`) mirrors the same pattern with
 * Saheeh International (`en.sahih`) via `fetchTafsirAyahs`.
 * Per-ayah audio toggle uses AudioEngine (web port of expo-av Sound) with
 * unload on leave.
 * `useKeepAwake()` (Screen Wake Lock) keeps the display on while reading —
 * web port of expo-keep-awake.
 * Reader colors follow `useColorScheme()` (RN device theme) unless the user
 * overrides with the نهاري/ليلي chip (`quranReaderDarkMode`).
 * Per-ayah share uses `shareVerse` (web port of RN Share.share).
 * `text-size-adjust: 100%` resists OS/browser text scaling (RN allowFontScaling={false}).
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { BookOpenText, Hash, Languages, Maximize2, Minimize2, Moon, Pause, Play, Share2, Sun, Type } from "lucide-react";
import { fetchSurahDetail, fetchTafsirAyahs, getSurahMeta, type Ayah } from "@/lib/quran-api";
import {
  persistShowTranslation,
  readStoredShowTranslation,
  readTranslationEdition,
  translationMapFromRows,
} from "@/lib/quran-translation";
import { useQuranEngine } from "@/hooks/useQuranEngine";
import { useQuranPreferences } from "@/hooks/useQuranPreferences";
import { useReadingBreakReminder } from "@/hooks/useReadingBreakReminder";
import { useQuranAudioToggle } from "@/hooks/useQuranAudioToggle";
import { useKeepAwake } from "@/hooks/useKeepAwake";
import { useColorScheme } from "@/hooks/useColorScheme";
import { nextQuranFontId, quranFontOption, quranFontStack } from "@/lib/quran-font-options";
import {
  QURAN_FONT_DEFAULT_PX,
  QURAN_FONT_MAX_PX,
  QURAN_FONT_MIN_PX,
  canDecreaseFont,
  canIncreaseFont,
  nextDecreasedFont,
  nextIncreasedFont,
  persistQuranFontSize,
  quranTextStyle,
  readStoredQuranFontSize,
} from "@/lib/quran-font-size";
import { shareVerse } from "@/lib/share-ayah";
import { DEFAULT_TAFSEER_SOURCE } from "@/core/tafseer/TafseerService";
import { QuranActionBar } from "@/components/QuranActionBar";
import { ReadingBreakDialog } from "@/components/quran/ReadingBreakDialog";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/quran-engine-ui.css";

/**
 * RN QuranReader themeStyles — dynamic colors from device / override.
 * light: #ffffff / #000000 · dark: #1a1a1a / #e0e0e0
 */
export const THEMES = {
  light: {
    background: "#ffffff",
    text: "#000000",
    header: "#f5f5f5",
  },
  dark: {
    background: "#1a1a1a",
    text: "#e0e0e0",
    header: "#262626",
  },
} as const;

export type QuranReaderThemeId = keyof typeof THEMES;

/** `"auto"` = follow OS; `"1"`/`"0"` = manual dark/light override. */
export const QURAN_THEME_STORAGE_KEY = "quranReaderDarkMode";
export const QURAN_TAFSIR_TOGGLE_KEY = "quranReaderShowTafsir";
export const QURAN_INLINE_TAFSIR_EDITION_KEY = "majalis-mushaf-tafsir-edition-v1";

/** Re-export RN font-size constants for callers that imported them from here. */
export {
  QURAN_FONT_MIN_PX,
  QURAN_FONT_MAX_PX,
  QURAN_FONT_STEP_PX,
  QURAN_FONT_DEFAULT_PX,
  QURAN_FONT_STORAGE_KEY,
} from "@/lib/quran-font-size";

type ReaderThemeOverride = "light" | "dark" | null;

function readStoredThemeOverride(): ReaderThemeOverride {
  try {
    const raw = localStorage.getItem(QURAN_THEME_STORAGE_KEY);
    if (raw == null || raw === "auto") return null;
    if (raw === "1" || raw === "true") return "dark";
    if (raw === "0" || raw === "false") return "light";
    return null;
  } catch {
    return null;
  }
}

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
    currentReciter,
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
  const { toggleAudio, isPlayingAyah, playerState } = useQuranAudioToggle(currentReciter);
  /** Keep screen lit while the reader is open (expo-keep-awake port). */
  useKeepAwake();
  /** RN useColorScheme — follows OS light/dark automatically. */
  const deviceTheme = useColorScheme();

  const surahNum = initialSurah ?? currentSurah;
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState(QURAN_FONT_DEFAULT_PX);
  /** null = follow deviceTheme (auto). */
  const [themeOverride, setThemeOverride] = useState<ReaderThemeOverride>(null);
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirByAyah, setTafsirByAyah] = useState<Record<number, string>>({});
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState(false);
  // 1. الحالة داخل المكون — عرض الترجمة تحت الآية (RN showTranslation)
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationByAyah, setTranslationByAyah] = useState<Record<number, string>>({});
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const meta = getSurahMeta(surahNum);

  const isDarkMode =
    themeOverride != null ? themeOverride === "dark" : deviceTheme === "dark";

  /** RN themeStyles — dynamic colors from isDarkMode. */
  const themeStyles = useMemo(
    () => ({
      backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      textColor: isDarkMode ? "#e0e0e0" : "#000000",
    }),
    [isDarkMode],
  );
  const currentTheme = isDarkMode ? THEMES.dark : THEMES.light;

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const shareAyahVerse = useCallback(
    async (verseText: string, ayahNum: number) => {
      try {
        const result = await shareVerse(verseText, {
          surahName: meta.name,
          ayahNum,
        });
        if (result.method === "cancelled") return;
        if (result.shared) {
          setShareStatus(result.method === "clipboard" ? "نُسخ النص للمشاركة" : "تمت المشاركة");
        } else {
          setShareStatus("تعذّرت المشاركة");
        }
      } catch (error) {
        console.error("خطأ في المشاركة:", error instanceof Error ? error.message : error);
        setShareStatus("تعذّرت المشاركة");
      }
    },
    [meta.name],
  );

  useEffect(() => {
    if (!shareStatus) return;
    const t = window.setTimeout(() => setShareStatus(null), 2200);
    return () => window.clearTimeout(t);
  }, [shareStatus]);

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

  // 2. دالة التبديل — إظهار/إخفاء الترجمة
  const toggleTranslation = useCallback(() => {
    setShowTranslation((prev) => {
      const next = !prev;
      persistShowTranslation(next);
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

  /** Load persisted font size + reader theme + tafsir/translation toggles once. */
  useEffect(() => {
    setFontSize(readStoredQuranFontSize());
    setThemeOverride(readStoredThemeOverride());
    setShowTafsir(readStoredShowTafsir());
    setShowTranslation(readStoredShowTranslation());
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

  /** When translation is on, fetch Saheeh International (or stored edition) once per surah. */
  useEffect(() => {
    if (!showTranslation) return;
    let cancelled = false;
    setTranslationLoading(true);
    setTranslationError(false);
    void (async () => {
      try {
        const edition = readTranslationEdition();
        const rows = await fetchTafsirAyahs(surahNum, edition);
        if (cancelled) return;
        setTranslationByAyah(translationMapFromRows(rows));
        if (!rows.length) setTranslationError(true);
      } catch {
        if (!cancelled) {
          setTranslationByAyah({});
          setTranslationError(true);
        }
      } finally {
        if (!cancelled) setTranslationLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showTranslation, surahNum]);

  const updateFontSize = useCallback((next: number) => {
    setFontSize(persistQuranFontSize(next));
  }, []);

  const setReaderDarkMode = useCallback((next: boolean) => {
    const override: ReaderThemeOverride = next ? "dark" : "light";
    setThemeOverride(override);
    try {
      localStorage.setItem(QURAN_THEME_STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const followSystemTheme = useCallback(() => {
    setThemeOverride(null);
    try {
      localStorage.setItem(QURAN_THEME_STORAGE_KEY, "auto");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setReaderDarkMode(!isDarkMode);
  }, [isDarkMode, setReaderDarkMode]);

  /** RN increaseFont — max 40, step +2 */
  const increaseFont = useCallback(() => {
    if (canIncreaseFont(fontSize)) updateFontSize(nextIncreasedFont(fontSize));
  }, [fontSize, updateFontSize]);

  /** RN decreaseFont — min 12, step -2 */
  const decreaseFont = useCallback(() => {
    if (canDecreaseFont(fontSize)) updateFontSize(nextDecreasedFont(fontSize));
  }, [fontSize, updateFontSize]);

  useEffect(() => {
    onFocusModeChange?.(isFocusMode);
  }, [isFocusMode, onFocusModeChange]);

  /** Hide app chrome (bottom nav) while focused — mirrors RN StatusBar.hidden. */
  useEffect(() => {
    if (!isFocusMode) return;
    document.body.classList.add("qe-focus-mode");
    document.body.style.setProperty("--qe-reader-bg", themeStyles.backgroundColor);
    document.body.style.backgroundColor = themeStyles.backgroundColor;
    return () => {
      document.body.classList.remove("qe-focus-mode");
      document.body.style.removeProperty("--qe-reader-bg");
      document.body.style.backgroundColor = "";
    };
  }, [isFocusMode, themeStyles.backgroundColor]);

  useEffect(() => {
    if (!isFocusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocusMode, setFocus]);

  // 3. طريقة التطبيق في التنسيق — lineHeight = fontSize * 1.5
  const textStyle = quranTextStyle(fontSize);

  const mushafTypeStyle = {
    ["--qe-mushaf-fs" as string]: `${textStyle.fontSize}px`,
    ["--qe-mushaf-lh" as string]: `${textStyle.lineHeight}px`,
    ["--qe-reader-bg" as string]: themeStyles.backgroundColor,
    ["--qe-reader-text" as string]: themeStyles.textColor,
    ["--qe-reader-header" as string]: currentTheme.header,
    ["--qe-reader-font" as string]: fontFamily,
    backgroundColor: themeStyles.backgroundColor,
    color: themeStyles.textColor,
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
              className={`qe-chip${showTranslation ? " is-on" : ""}`}
              onClick={toggleTranslation}
              aria-pressed={showTranslation}
              aria-label={showTranslation ? "إخفاء الترجمة" : "إظهار الترجمة تحت الآيات"}
              title="الترجمة"
            >
              <Languages size={14} aria-hidden="true" />
              ترجمة
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
              className={`qe-chip${themeOverride == null ? " is-on" : ""}`}
              onClick={toggleDarkMode}
              onContextMenu={(e) => {
                e.preventDefault();
                followSystemTheme();
              }}
              aria-pressed={isDarkMode}
              aria-label={
                themeOverride == null
                  ? "يتبع مظهر الجهاز — انقر لتثبيت الوضع"
                  : isDarkMode
                    ? "التبديل إلى الوضع النهاري"
                    : "التبديل إلى الوضع الليلي"
              }
              title={
                themeOverride == null
                  ? "تلقائي (يتبع الجهاز) — زر أيمن للعودة"
                  : isDarkMode
                    ? "نهاري"
                    : "ليلي"
              }
            >
              {isDarkMode ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
              {themeOverride == null ? "تلقائي" : isDarkMode ? "نهاري" : "ليلي"}
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
              const ayahTranslation = translationByAyah[ayah.numberInSurah];
              const playingThis = isPlayingAyah(surahNum, ayah.numberInSurah);
              return (
                <li key={ayah.numberInSurah} className="qe-ayah-item">
                  <div className="qe-ayah-row">
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
                          fontSize: textStyle.fontSize,
                          lineHeight: `${textStyle.lineHeight}px`,
                          textAlign: "right",
                          color: themeStyles.textColor,
                        }}
                      >
                        {renderQuranText(ayah.text, showAyahNumbers)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`qe-ayah__play${playingThis ? " is-on" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleAudio(surahNum, ayah.numberInSurah);
                      }}
                      disabled={playerState === "loading" && !playingThis}
                      aria-pressed={playingThis}
                      aria-label={
                        playingThis
                          ? `إيقاف تلاوة الآية ${toArabicDigits(ayah.numberInSurah)}`
                          : `تشغيل تلاوة الآية ${toArabicDigits(ayah.numberInSurah)}`
                      }
                      title={playingThis ? "إيقاف" : "استماع"}
                    >
                      {playingThis ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                    </button>
                    <button
                      type="button"
                      className="qe-ayah__share"
                      onClick={(e) => {
                        e.stopPropagation();
                        void shareAyahVerse(ayah.text, ayah.numberInSurah);
                      }}
                      aria-label={`مشاركة الآية ${toArabicDigits(ayah.numberInSurah)}`}
                      title="مشاركة"
                    >
                      <Share2 size={16} aria-hidden="true" />
                    </button>
                  </div>
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
                  {/* 3. عرض الترجمة فقط إذا كان showTranslation true */}
                  {showTranslation ? (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- stop focus-toggle bubble only
                    <div
                      className="qe-ayah__translation"
                      onClick={(e) => e.stopPropagation()}
                      role="note"
                      aria-label={`ترجمة الآية ${toArabicDigits(ayah.numberInSurah)}`}
                      lang="en"
                      dir="ltr"
                    >
                      {translationLoading && !ayahTranslation ? (
                        <span className="qe-ayah__translation-status">Loading translation…</span>
                      ) : ayahTranslation ? (
                        <p className="qe-ayah__translation-text">{ayahTranslation}</p>
                      ) : translationError ? (
                        <span className="qe-ayah__translation-status">Could not load this translation.</span>
                      ) : (
                        <span className="qe-ayah__translation-status">No translation available for this ayah.</span>
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
          {shareStatus ? (
            <span className="qe-viewer__share-status" role="status" aria-live="polite">
              {shareStatus}
            </span>
          ) : null}
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
