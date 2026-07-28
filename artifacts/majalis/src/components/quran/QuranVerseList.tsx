/**
 * Flutter `ListView.builder` + `InkWell` verse selection:
 *
 * ```dart
 * int? selectedIndex;
 * ListView.builder(
 *   itemBuilder: (_, index) {
 *     final isSelected = selectedIndex == index;
 *     return InkWell(
 *       onTap: () => setState(() => selectedIndex = index),
 *       child: Container(
 *         decoration: BoxDecoration(
 *           color: isSelected ? Colors.brown.withOpacity(0.2) : transparent,
 *           borderRadius: BorderRadius.circular(10),
 *         ),
 *         child: Text(verses[index], style: Uthmani…),
 *       ),
 *     );
 *   },
 * );
 * ```
 *
 * Controlled or uncontrolled `selectedIndex` — no audio/tafsir coupling
 * (callers pass `onSelectVerse` to wire handlers).
 */
import { useCallback, useState, type CSSProperties } from "react";
import {
  IMMERSIVE_FONT_SIZE_PX,
  IMMERSIVE_INK,
  IMMERSIVE_LINE_HEIGHT_RATIO,
  VERSE_ITEM_GAP_PX,
  VERSE_SELECTED_BG,
  VERSE_SELECTED_INK,
  VERSE_SELECTED_RADIUS_PX,
} from "@/lib/quran-immersive";

export type QuranVerseListProps = {
  /** آية كنص (عادة من JSON / fetchSurahDetail). */
  verses: readonly string[];
  /**
   * فهرس الآية المختارة (0-based) — Flutter `selectedIndex`.
   * إذا مُمرَّر يكون الوضع controlled.
   */
  selectedIndex?: number | null;
  /** وضع غير مضبوط: قيمة ابتدائية فقط. */
  defaultSelectedIndex?: number | null;
  /** عند النقر — استدعاء التفسير/الصوت من الأب دون اقتران مباشر. */
  onSelectVerse?: (index: number, text: string) => void;
  className?: string;
  fontSize?: number;
  /** محاذاة النص — Flutter `TextAlign.center`. */
  textAlign?: "center" | "right" | "start";
};

export function QuranVerseList({
  verses,
  selectedIndex: selectedIndexProp,
  defaultSelectedIndex = null,
  onSelectVerse,
  className,
  fontSize = IMMERSIVE_FONT_SIZE_PX,
  textAlign = "center",
}: QuranVerseListProps) {
  const controlled = selectedIndexProp !== undefined;
  const [internalIndex, setInternalIndex] = useState<number | null>(defaultSelectedIndex);
  const selectedIndex = controlled ? (selectedIndexProp ?? null) : internalIndex;

  const handleSelect = useCallback(
    (index: number, text: string) => {
      if (!controlled) setInternalIndex(index);
      onSelectVerse?.(index, text);
    },
    [controlled, onSelectVerse],
  );

  const listStyle = {
    ["--quran-verse-gap" as string]: `${VERSE_ITEM_GAP_PX}px`,
    ["--quran-verse-fs" as string]: `${fontSize}px`,
    ["--quran-verse-lh" as string]: `${fontSize * IMMERSIVE_LINE_HEIGHT_RATIO}px`,
    ["--quran-verse-ink" as string]: IMMERSIVE_INK,
    ["--quran-verse-selected-bg" as string]: VERSE_SELECTED_BG,
    ["--quran-verse-selected-ink" as string]: VERSE_SELECTED_INK,
    ["--quran-verse-radius" as string]: `${VERSE_SELECTED_RADIUS_PX}px`,
  } as CSSProperties;

  return (
    <ul
      className={`quran-verse-list${className ? ` ${className}` : ""}`}
      style={listStyle}
      role="listbox"
      aria-label="آيات السورة"
    >
      {verses.map((text, index) => {
        const isSelected = selectedIndex === index;
        return (
          <li key={index} className="quran-verse-list__item" role="none">
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              className={`quran-verse-list__verse${isSelected ? " is-selected" : ""}`}
              onClick={() => handleSelect(index, text)}
            >
              <span className="quran-verse-list__text" style={{ textAlign }}>
                {text}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default QuranVerseList;
