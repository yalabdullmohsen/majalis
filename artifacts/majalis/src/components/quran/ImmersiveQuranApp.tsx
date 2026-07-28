/**
 * Web port of Flutter `ImmersiveQuranApp`:
 * QuranAppController · immersive sticky · PageView · endDrawer settings ·
 * verse sheet (listen / tafsir / copy) · amber playing + brown selected.
 */
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useImmersiveSystemUi } from "@/hooks/useImmersiveSystemUi";
import { useKeepAwake } from "@/hooks/useKeepAwake";
import { useQuranAppController } from "@/hooks/useQuranAppController";
import {
  QURAN_APP_FONT_MAX,
  QURAN_APP_FONT_MIN,
  QURAN_APP_LINE_HEIGHT,
  SAMPLE_FATIHA_VERSES,
  VERSE_PLAYING_BG,
  VERSE_SELECTED_SOFT_BG,
  type QuranAppController,
} from "@/lib/quran-app-controller";
import { ImmersiveVerseOptionsSheet } from "@/components/quran/ImmersiveVerseOptionsSheet";
import { ImmersivePrefsDrawer } from "@/components/quran/ImmersivePrefsDrawer";
import "@/styles/quran-immersive-reader.css";

export type ImmersiveQuranAppProps = {
  verses?: readonly string[];
  pages?: readonly (readonly string[])[];
  className?: string;
  controller?: QuranAppController;
  /** Wire AudioEngine / tafsir outside (loose coupling). */
  onToggleAudio?: (index: number, playing: boolean, text: string) => void;
  onTafsirVerse?: (index: number, text: string) => void;
};

export function ImmersiveQuranApp({
  verses,
  pages: pagesProp,
  className,
  controller: external,
  onToggleAudio,
  onTafsirVerse,
}: ImmersiveQuranAppProps) {
  const {
    controller,
    fontSize,
    isDarkMode,
    backgroundColor,
    textColor,
    selectedVerseIndex,
    isPlayingAudio,
    currentPlayingVerse,
    updateFontSize,
    toggleTheme,
    selectVerse,
    toggleAudio,
  } = useQuranAppController(external);

  useImmersiveSystemUi(true, backgroundColor);
  useKeepAwake(true);

  const pages =
    pagesProp && pagesProp.length > 0
      ? pagesProp
      : [verses && verses.length > 0 ? verses : SAMPLE_FATIHA_VERSES];

  const [pageIndex, setPageIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const currentVerses = pages[pageIndex] ?? pages[0] ?? SAMPLE_FATIHA_VERSES;
  const selectedText =
    selectedVerseIndex != null ? (currentVerses[selectedVerseIndex] ?? "") : "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheetOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onVerseTap = useCallback(
    (index: number) => {
      selectVerse(index);
      setCopyStatus(null);
      setSheetOpen(true);
    },
    [selectVerse],
  );

  const handleTogglePlayback = useCallback(() => {
    if (selectedVerseIndex == null) return;
    toggleAudio(selectedVerseIndex);
    const playing = controller.isPlayingAudio;
    const text = currentVerses[selectedVerseIndex] ?? "";
    onToggleAudio?.(selectedVerseIndex, playing, text);
    setSheetOpen(false);
  }, [
    selectedVerseIndex,
    toggleAudio,
    controller,
    currentVerses,
    onToggleAudio,
  ]);

  const handleCopy = useCallback(() => {
    if (!selectedText) return;
    void navigator.clipboard?.writeText(selectedText).then(
      () => {
        setCopyStatus("تم نسخ الآية");
        setSheetOpen(false);
      },
      () => setCopyStatus("تعذّر النسخ"),
    );
  }, [selectedText]);

  const handleTafsir = useCallback(() => {
    if (selectedVerseIndex == null || !selectedText) return;
    onTafsirVerse?.(selectedVerseIndex, selectedText);
  }, [selectedVerseIndex, selectedText, onTafsirVerse]);

  const style = {
    ["--quran-app-fs" as string]: `${fontSize}px`,
    ["--quran-app-lh" as string]: String(QURAN_APP_LINE_HEIGHT),
    ["--quran-app-ink" as string]: textColor,
    ["--quran-verse-playing-bg" as string]: VERSE_PLAYING_BG,
    ["--quran-verse-selected-soft" as string]: VERSE_SELECTED_SOFT_BG,
    backgroundColor,
    color: textColor,
  } as CSSProperties;

  return (
    <div
      className={`immersive-quran-app${className ? ` ${className}` : ""}`}
      dir="rtl"
      style={style}
      data-dark={isDarkMode ? "1" : "0"}
    >
      <div className="immersive-quran-app__safe">
        <div className="immersive-quran-app__toolbar">
          <button
            type="button"
            className="immersive-quran-app__settings-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="إعدادات القراءة"
          >
            إعدادات
          </button>
        </div>

        {/* Flutter PageView.builder + BouncingScrollPhysics */}
        <div
          className="immersive-quran-app__pager"
          onScroll={(e) => {
            const el = e.currentTarget;
            const w = el.clientWidth || 1;
            const idx = Math.min(
              pages.length - 1,
              Math.max(0, Math.abs(Math.round(el.scrollLeft / w))),
            );
            if (idx !== pageIndex) setPageIndex(idx);
          }}
        >
          {pages.map((pageVerses, pIdx) => (
            <section key={pIdx} className="immersive-quran-app__page">
              <ul className="immersive-quran-app__verses">
                {pageVerses.map((text, index) => {
                  const isSelected =
                    pIdx === pageIndex && selectedVerseIndex === index;
                  const isPlaying =
                    pIdx === pageIndex &&
                    currentPlayingVerse === index &&
                    isPlayingAudio;
                  return (
                    <li key={index}>
                      <button
                        type="button"
                        className={`immersive-quran-app__verse${isSelected ? " is-selected" : ""}${isPlaying ? " is-playing" : ""}`}
                        onClick={() => {
                          if (pIdx !== pageIndex) setPageIndex(pIdx);
                          onVerseTap(index);
                        }}
                      >
                        <span className="immersive-quran-app__verse-text">{text}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {sheetOpen && selectedVerseIndex != null && selectedText ? (
        <ImmersiveVerseOptionsSheet
          verseText={selectedText}
          isPlaying={
            currentPlayingVerse === selectedVerseIndex && isPlayingAudio
          }
          onTogglePlayback={handleTogglePlayback}
          onTafsir={handleTafsir}
          onCopy={handleCopy}
          copyStatus={copyStatus}
          onClose={() => setSheetOpen(false)}
          paperBg={backgroundColor}
          playLabelPlaying="إيقاف التلاوة"
          playLabelIdle="استماع للآية"
          tafsirLabel="عرض التفسير الميسر"
          copyLabel="نسخ النص القرآني"
        />
      ) : null}

      {/* Flutter endDrawer — إعدادات القراءة */}
      <ImmersivePrefsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fontSize={fontSize}
        onFontSizeChange={updateFontSize}
        fontMin={QURAN_APP_FONT_MIN}
        fontMax={QURAN_APP_FONT_MAX}
        fontStep={1}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => toggleTheme(!isDarkMode)}
        paperBg={backgroundColor}
        title="إعدادات القراءة"
      />
    </div>
  );
}

export default ImmersiveQuranApp;
