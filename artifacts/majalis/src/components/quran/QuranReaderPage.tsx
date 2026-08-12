/**
 * Web port of Flutter `QuranReaderPage` scaffold:
 * immersive sticky · parchment · ListView verse selection (InkWell).
 *
 * Selection is local or controlled — audio/tafsir via `onSelectVerse` only
 * (loose coupling; no direct import of players/tafseer).
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { useImmersiveSystemUi } from "@/hooks/useImmersiveSystemUi";
import {
  IMMERSIVE_INK,
  IMMERSIVE_PAPER_BG,
  immersiveReaderCssVars,
} from "@/lib/quran-immersive";
import { QuranVerseList } from "@/components/quran/QuranVerseList";
import "@/styles/quran-immersive-reader.css";

export type QuranReaderPageProps = {
  children?: ReactNode;
  className?: string;
  /** Override paper (default Flutter `#F5F5DC`). */
  paperBg?: string;
  /** Override ink (default `Colors.black87`). */
  ink?: string;
  /** Demo / comfort size — default 28; prefs may drive caller content. */
  fontSize?: number;
  /** When false, skip System UI hide (nested under another immersive shell). */
  immersive?: boolean;
  /**
   * Flutter `verses` — when set (and no `children`), renders `QuranVerseList`.
   */
  verses?: readonly string[];
  /** Controlled selected verse index (Flutter `selectedIndex`). */
  selectedIndex?: number | null;
  /** Uncontrolled initial selection. */
  defaultSelectedIndex?: number | null;
  /**
   * Flutter onTap hook — wire tafsir / audio from the parent Logic Handler.
   */
  onSelectVerse?: (index: number, text: string) => void;
};

/**
 * Flutter:
 * ```dart
 * Scaffold(
 *   backgroundColor: Color(0xFFF5F5DC),
 *   body: ListView.builder(… InkWell → selectedIndex …),
 * )
 * ```
 */
export function QuranReaderPage({
  children,
  className,
  paperBg = IMMERSIVE_PAPER_BG,
  ink = IMMERSIVE_INK,
  fontSize,
  immersive = true,
  verses,
  selectedIndex: selectedIndexProp,
  defaultSelectedIndex = null,
  onSelectVerse,
}: QuranReaderPageProps) {
  useImmersiveSystemUi(immersive, paperBg);

  const controlled = selectedIndexProp !== undefined;
  const [internalIndex, setInternalIndex] = useState<number | null>(defaultSelectedIndex);
  const selectedIndex = controlled ? (selectedIndexProp ?? null) : internalIndex;

  const handleSelect = (index: number, text: string) => {
    if (!controlled) setInternalIndex(index);
    onSelectVerse?.(index, text);
  };

  const style = {
    ...immersiveReaderCssVars({ fontSize, paperBg, ink }),
    backgroundColor: paperBg,
    color: ink,
  } as CSSProperties;

  const body =
    children ??
    (verses ? (
      <QuranVerseList
        verses={verses}
        selectedIndex={selectedIndex}
        onSelectVerse={handleSelect}
        fontSize={fontSize}
      />
    ) : null);

  return (
    <div
      className={`quran-reader-page${className ? ` ${className}` : ""}`}
      dir="rtl"
      style={style}
      data-immersive={immersive ? "1" : "0"}
    >
      <div className="quran-reader-page__safe">
        <div className="quran-reader-page__pad quran-reader-page__pad--list">{body}</div>
      </div>
    </div>
  );
}

export default QuranReaderPage;
