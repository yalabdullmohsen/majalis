/**
 * Web port of Flutter `ImmersiveQuranPage`:
 *
 * - SystemChrome.immersiveSticky
 * - PageView.builder (soft horizontal page snap)
 * - ListView verses + GestureDetector → selectVerse + bottom sheet
 * - QuranController ChangeNotifier for selectedIndex / isPlaying
 *
 * Audio & tafsir are injected via callbacks (loose coupling).
 */
import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import { useImmersiveSystemUi } from "@/hooks/useImmersiveSystemUi";
import { useQuranController } from "@/hooks/useQuranController";
import {
  IMMERSIVE_FONT_SIZE_PX,
  IMMERSIVE_INK,
  IMMERSIVE_LINE_HEIGHT_RATIO,
  IMMERSIVE_LIST_PAD_Y_PX,
  IMMERSIVE_PAPER_BG,
  VERSE_SELECTED_BROWN,
  immersiveReaderCssVars,
} from "@/lib/quran-immersive";
import type { QuranController } from "@/lib/quran-controller";
import { ImmersiveVerseOptionsSheet } from "@/components/quran/ImmersiveVerseOptionsSheet";
import "@/styles/quran-immersive-reader.css";

export type ImmersiveQuranPageProps = {
  /** صفحات من قوائم آيات — Flutter `PageView` pages. */
  pages?: readonly (readonly string[])[];
  /** اختصار لصفحة واحدة: `pages={[verses]}`. */
  verses?: readonly string[];
  className?: string;
  paperBg?: string;
  fontSize?: number;
  /** Shared controller (SSOT); otherwise created internally. */
  controller?: QuranController;
  /** بعد تبديل التشغيل — اربط AudioEngine هنا. */
  onTogglePlayback?: (isPlaying: boolean, verseIndex: number, verseText: string) => void;
  /** تفسير الآية — Logic Handler في الأب. */
  onTafsirVerse?: (verseIndex: number, verseText: string) => void;
  /** عند تغيير الصفحة الأفقية. */
  onPageChange?: (pageIndex: number) => void;
};

export function ImmersiveQuranPage({
  pages: pagesProp,
  verses,
  className,
  paperBg = IMMERSIVE_PAPER_BG,
  fontSize = IMMERSIVE_FONT_SIZE_PX,
  controller: externalController,
  onTogglePlayback,
  onTafsirVerse,
  onPageChange,
}: ImmersiveQuranPageProps) {
  useImmersiveSystemUi(true, paperBg);

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

  const [sheetOpen, setSheetOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const currentVerses = pages[pageIndex] ?? pages[0] ?? [];
  const selectedText =
    selectedIndex != null && selectedIndex >= 0 && selectedIndex < currentVerses.length
      ? currentVerses[selectedIndex]!
      : "";

  const style = {
    ...immersiveReaderCssVars({ fontSize, paperBg, ink: IMMERSIVE_INK }),
    ["--quran-immersive-list-pad-y" as string]: `${IMMERSIVE_LIST_PAD_Y_PX}px`,
    ["--quran-verse-selected-brown" as string]: VERSE_SELECTED_BROWN,
    backgroundColor: paperBg,
    color: IMMERSIVE_INK,
  } as CSSProperties;

  const onVerseTap = useCallback(
    (index: number) => {
      selectVerse(index);
      setSheetOpen(true);
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

  const onScrollPage = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const next = Math.round(el.scrollLeft / w);
    // RTL: scrollLeft may be negative in some engines — normalize
    const idx = Math.min(pages.length - 1, Math.max(0, Math.abs(next)));
    if (idx !== pageIndex) {
      setPageIndex(idx);
      onPageChange?.(idx);
    }
  }, [pageIndex, pages.length, onPageChange]);

  return (
    <div
      className={`immersive-quran-page${className ? ` ${className}` : ""}`}
      dir="rtl"
      style={style}
      data-page={pageIndex}
    >
      <div className="immersive-quran-page__safe">
        {/* Flutter PageView.builder + PageScrollPhysics */}
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
                  return (
                    <li key={index} className="immersive-quran-page__verse-item">
                      <button
                        type="button"
                        className={`immersive-quran-page__verse${isSelected ? " is-selected" : ""}`}
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
                            color: isSelected ? VERSE_SELECTED_BROWN : IMMERSIVE_INK,
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
          onClose={() => setSheetOpen(false)}
          paperBg={paperBg}
        />
      ) : null}
    </div>
  );
}

export default ImmersiveQuranPage;
