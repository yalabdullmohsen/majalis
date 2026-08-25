/**
 * Flutter `ListView.builder` + `InkWell` verse selection — مع virtualization للقوائم الطويلة.
 */
import { memo, useCallback, useState, type CSSProperties } from "react";
import { VirtualList } from "@/components/VirtualList";
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

type VerseRowProps = {
  text: string;
  index: number;
  isSelected: boolean;
  textAlign: "center" | "right" | "start";
  onSelect: (index: number, text: string) => void;
};

/** صف آية معزول — لا يعيد رسم بقية القائمة عند تغيّر التحديد */
const VerseRow = memo(function VerseRow({
  text,
  index,
  isSelected,
  textAlign,
  onSelect,
}: VerseRowProps) {
  return (
    <div className="quran-verse-list__item" role="none">
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        className={`quran-verse-list__verse${isSelected ? " is-selected" : ""}`}
        onClick={() => onSelect(index, text)}
      >
        <span className="quran-verse-list__text" style={{ textAlign }}>
          {text}
        </span>
      </button>
    </div>
  );
});

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

  const items = verses as string[];

  return (
    <VirtualList
      items={items}
      estimateSize={Math.round(fontSize * IMMERSIVE_LINE_HEIGHT_RATIO + VERSE_ITEM_GAP_PX)}
      virtualizeAbove={36}
      overscan={8}
      as="div"
      role="listbox"
      aria-label="آيات السورة"
      className={`quran-verse-list vlist--virtual${className ? ` ${className}` : ""}`}
      style={listStyle}
      getItemKey={(_, index) => index}
      renderItem={(text, index) => (
        <VerseRow
          text={text}
          index={index}
          isSelected={selectedIndex === index}
          textAlign={textAlign}
          onSelect={handleSelect}
        />
      )}
    />
  );
}

export default QuranVerseList;
