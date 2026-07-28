/**
 * Master Prompt immersive reader — Flutter ImmersiveQuranPage port:
 * AppController (wakelock/immersive) · QuranController · PageView ·
 * brown@0.2 selection · audio tracking cursor · prefs drawer · options sheet.
 *
 * Audio/tafsir/bookmarks injected via callbacks (zero feature coupling).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent,
} from "react";
import { useAppController } from "@/hooks/useAppController";
import { useQuranController } from "@/hooks/useQuranController";
import { useAudioTrackingCursor } from "@/hooks/useAudioTrackingCursor";
import {
  IMMERSIVE_FONT_SIZE_PX,
  IMMERSIVE_INK,
  IMMERSIVE_LINE_HEIGHT_RATIO,
  IMMERSIVE_LIST_PAD_Y_PX,
  IMMERSIVE_PAPER_BG,
  VERSE_SELECTED_BG,
  VERSE_SELECTED_BROWN,
  VERSE_SELECTED_INK,
  immersiveReaderCssVars,
} from "@/lib/quran-immersive";
import type { QuranController } from "@/lib/quran-controller";
import { ImmersiveVerseOptionsSheet } from "@/components/quran/ImmersiveVerseOptionsSheet";
import { ImmersivePrefsDrawer } from "@/components/quran/ImmersivePrefsDrawer";
import "@/styles/quran-immersive-reader.css";

export type ImmersiveQuranPageProps = {
  pages?: readonly (readonly string[])[];
  verses?: readonly string[];
  className?: string;
  paperBg?: string;
  darkPaperBg?: string;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  controller?: QuranController;
  /** 1-based first ayah on list (for audio cursor mapping). */
  ayahBase?: number;
  /** Override tracking index (else AudioEngine via useAudioTrackingCursor). */
  recitingIndex?: number | null;
  onTogglePlayback?: (isPlaying: boolean, verseIndex: number, verseText: string) => void;
  onTafsirVerse?: (verseIndex: number, verseText: string) => void;
  onCopyVerse?: (verseIndex: number, verseText: string) => void;
  onToggleBookmark?: (verseIndex: number, verseText: string) => void;
  isVerseBookmarked?: (verseIndex: number) => boolean;
  onPageChange?: (pageIndex: number) => void;
  lastPage?: number | null;
  onResumeLastPage?: () => void;
};

export function ImmersiveQuranPage({
  pages: pagesProp,
  verses,
  className,
  paperBg = IMMERSIVE_PAPER_BG,
  darkPaperBg = "#1a1a1a",
  fontSize: fontSizeProp,
  onFontSizeChange,
  controller: externalController,
  ayahBase = 1,
  recitingIndex: recitingIndexProp,
  onTogglePlayback,
  onTafsirVerse,
  onCopyVerse,
  onToggleBookmark,
  isVerseBookmarked,
  onPageChange,
  lastPage,
  onResumeLastPage,
}: ImmersiveQuranPageProps) {
  const app = useAppController({ singleton: true, autoImmersive: true });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSizeLocal, setFontSizeLocal] = useState(fontSizeProp ?? IMMERSIVE_FONT_SIZE_PX);
  const fontSize = fontSizeProp ?? fontSizeLocal;
  const setFontSize = onFontSizeChange ?? setFontSizeLocal;

  const activePaper = isDarkMode ? darkPaperBg : paperBg;

  useEffect(() => {
    void app.enterImmersive(activePaper);
  }, [app.controller, activePaper]);

  const pages = useMemo(() => {
    if (pagesProp && pagesProp.length > 0) return pagesProp;
    if (verses && verses.length > 0) return [verses] as const;
    return [
      [
        "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        "الرَّحْمَٰنِ الرَّحِيمِ",
      ],
    ] as const;
  }, [pagesProp, verses]);

  const { controller, selectedIndex, isPlaying, selectVerse, togglePlayback } =
    useQuranController(externalController);

  const tracking = useAudioTrackingCursor(ayahBase);
  const recitingIndex =
    recitingIndexProp !== undefined ? recitingIndexProp : tracking.verseIndex;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const edgeTouchX = useRef<number | null>(null);

  const currentVerses = pages[pageIndex] ?? pages[0] ?? [];
  const selectedText =
    selectedIndex != null && selectedIndex >= 0 && selectedIndex < currentVerses.length
      ? currentVerses[selectedIndex]!
      : "";

  const style = {
    ...immersiveReaderCssVars({ fontSize, paperBg: activePaper, ink: isDarkMode ? "#e0e0e0" : IMMERSIVE_INK }),
    ["--quran-immersive-list-pad-y" as string]: `${IMMERSIVE_LIST_PAD_Y_PX}px`,
    ["--quran-verse-selected-brown" as string]: VERSE_SELECTED_BROWN,
    ["--quran-verse-selected-bg" as string]: VERSE_SELECTED_BG,
    ["--quran-verse-selected-ink" as string]: isDarkMode ? "#D7CCC8" : VERSE_SELECTED_INK,
    backgroundColor: activePaper,
    color: isDarkMode ? "#e0e0e0" : IMMERSIVE_INK,
  } as CSSProperties;

  const onVerseTap = useCallback(
    (index: number) => {
      selectVerse(index);
      setSheetOpen(true);
      setCopyStatus(null);
    },
    [selectVerse],
  );

  const handleTogglePlayback = useCallback(() => {
    togglePlayback();
    const playing = controller.isPlaying;
    if (selectedIndex != null && selectedText) {
      onTogglePlayback?.(playing, selectedIndex, selectedText);
    }
  }, [togglePlayback, controller, selectedIndex, selectedText, onTogglePlayback]);

  const handleTafsir = useCallback(() => {
    if (selectedIndex == null || !selectedText) return;
    onTafsirVerse?.(selectedIndex, selectedText);
  }, [selectedIndex, selectedText, onTafsirVerse]);

  const handleCopy = useCallback(() => {
    if (selectedIndex == null || !selectedText) return;
    if (onCopyVerse) {
      onCopyVerse(selectedIndex, selectedText);
      setCopyStatus("تم النسخ");
      return;
    }
    void navigator.clipboard?.writeText(selectedText).then(
      () => setCopyStatus("تم النسخ"),
      () => setCopyStatus("تعذّر النسخ"),
    );
  }, [selectedIndex, selectedText, onCopyVerse]);

  const handleBookmark = useCallback(() => {
    if (selectedIndex == null || !selectedText) return;
    onToggleBookmark?.(selectedIndex, selectedText);
  }, [selectedIndex, selectedText, onToggleBookmark]);

  const onScrollPage = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const next = Math.round(el.scrollLeft / w);
    const idx = Math.min(pages.length - 1, Math.max(0, Math.abs(next)));
    if (idx !== pageIndex) {
      setPageIndex(idx);
      onPageChange?.(idx);
    }
  }, [pageIndex, pages.length, onPageChange]);

  /** Edge swipe → prefs drawer (silent personalization). */
  const onTouchStart = (e: TouchEvent) => {
    const x = e.touches[0]?.clientX ?? 0;
    const w = window.innerWidth;
    // RTL: start edge is the right side
    if (x > w - 28 || x < 28) edgeTouchX.current = x;
    else edgeTouchX.current = null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (edgeTouchX.current == null) return;
    const x = e.changedTouches[0]?.clientX ?? 0;
    const dx = x - edgeTouchX.current;
    edgeTouchX.current = null;
    // Swipe inward from either edge
    if (Math.abs(dx) > 40) setPrefsOpen(true);
  };

  const ink = isDarkMode ? "#e0e0e0" : IMMERSIVE_INK;

  return (
    <div
      className={`immersive-quran-page${className ? ` ${className}` : ""}`}
      dir="rtl"
      style={style}
      data-page={pageIndex}
      data-dark={isDarkMode ? "1" : "0"}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="immersive-quran-page__safe">
        <div
          ref={scrollerRef}
          className="immersive-quran-page__pager"
          onScroll={onScrollPage}
        >
          {pages.map((pageVerses, pIdx) => (
            <section
              key={pIdx}
              className="immersive-quran-page__sheet"
              aria-label={`صفحة ${pIdx + 1}`}
            >
              <ul className="immersive-quran-page__verses">
                {pageVerses.map((text, index) => {
                  const isSelected =
                    pIdx === pageIndex && selectedIndex === index;
                  const isReciting =
                    pIdx === pageIndex && recitingIndex === index;
                  return (
                    <li key={index} className="immersive-quran-page__verse-item">
                      <button
                        type="button"
                        className={`immersive-quran-page__verse${isSelected ? " is-selected" : ""}${isReciting ? " is-reciting" : ""}`}
                        onClick={() => {
                          if (pIdx !== pageIndex) setPageIndex(pIdx);
                          onVerseTap(index);
                        }}
                      >
                        <span
                          className="immersive-quran-page__verse-text"
                          style={{
                            fontSize: `${fontSize}px`,
                            lineHeight: `${fontSize * IMMERSIVE_LINE_HEIGHT_RATIO}px`,
                            color: isSelected
                              ? isDarkMode
                                ? "#D7CCC8"
                                : VERSE_SELECTED_INK
                              : ink,
                          }}
                        >
                          {text}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {sheetOpen && selectedIndex != null && selectedText ? (
        <ImmersiveVerseOptionsSheet
          verseText={selectedText}
          isPlaying={isPlaying}
          onTogglePlayback={handleTogglePlayback}
          onTafsir={handleTafsir}
          onCopy={handleCopy}
          onToggleBookmark={onToggleBookmark ? handleBookmark : undefined}
          bookmarked={isVerseBookmarked?.(selectedIndex) ?? false}
          copyStatus={copyStatus}
          onClose={() => setSheetOpen(false)}
          paperBg={activePaper}
        />
      ) : null}

      <ImmersivePrefsDrawer
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((d) => !d)}
        lastPage={lastPage}
        onResumeLastPage={onResumeLastPage}
        paperBg={activePaper}
      />
    </div>
  );
}

export default ImmersiveQuranPage;
