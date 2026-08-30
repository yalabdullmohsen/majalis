import {
  memo,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { QpcWord } from "@/lib/quran-data/qpc-page-data";
import { BASMALA_QPC_WORDS } from "@/lib/quran-data/basmala-qpc-words";
import { displaySurahName } from "@/lib/quran-display";
import { toArabicDigits } from "@/lib/utils";
import {
  useMushafAyahWordPlaying,
  useMushafAyahWordSelected,
} from "@/features/mushaf-madinah/mushaf-ayah-sync-store";

type LineProps = {
  words: QpcWord[];
  centered?: boolean;
  onSelectVerse?: (verseKey: string) => void;
};

const TAP_SLOP_PX = 40;
const SHORT_SELECT_MS = 200;

type PressState = {
  verseKey: string;
  x: number;
  y: number;
  timer: number;
  fired: boolean;
};

function verseAriaLabel(verseKey: string): string {
  const [s, a] = verseKey.split(":");
  const surah = Number(s);
  const ayah = Number(a);
  const name = surah >= 1 && surah <= 114 ? displaySurahName(surah) : s;
  return `سورة ${name} آية ${toArabicDigits(ayah || a)}`;
}

const VerseWord = memo(function VerseWord({
  word,
  onSelectVerse,
  startPress,
  movePress,
  endPress,
  clearPress,
}: {
  word: QpcWord;
  onSelectVerse?: (verseKey: string) => void;
  startPress: (verseKey: string, e: ReactPointerEvent<HTMLElement>) => void;
  movePress: (e: ReactPointerEvent<HTMLElement>) => void;
  endPress: (verseKey: string) => void;
  clearPress: () => void;
}) {
  const selected = useMushafAyahWordSelected(word.verseKey);
  const playing = useMushafAyahWordPlaying(word.verseKey);
  const isEnd = word.charType === "end";
  const state = [selected ? "is-selected" : "", playing ? "is-playing" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={`nm-word${isEnd ? " nm-word--end" : ""} ${state}`.trim()}
      data-type={word.charType}
      data-key={word.verseKey}
      data-verse={word.verseKey}
      data-ayah={word.verseKey}
      data-testid="mushaf-ayah-hit"
      role="button"
      tabIndex={0}
      aria-label={verseAriaLabel(word.verseKey)}
      aria-pressed={selected}
      onPointerDown={(e) => startPress(word.verseKey, e)}
      onPointerMove={movePress}
      onPointerUp={() => endPress(word.verseKey)}
      onPointerCancel={clearPress}
      onClick={(e: MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectVerse?.(word.verseKey);
        }
      }}
    >
      {isEnd ? (
        <span className="nm-ayah-mark" aria-hidden="true">
          <span className="nm-ayah-mark__glyph">{word.glyphText}</span>
        </span>
      ) : (
        word.glyphText
      )}
    </span>
  );
});

/** طبقة الآيات — نص QPC مع تحديد ناعم بلا قفزة تخطيط */
export const MushafVerseLayer = memo(function MushafVerseLayer({
  words,
  centered = false,
  onSelectVerse,
}: LineProps) {
  const pressRef = useRef<PressState | null>(null);

  const clearPress = () => {
    const cur = pressRef.current;
    if (cur) window.clearTimeout(cur.timer);
    pressRef.current = null;
  };

  const startPress = (verseKey: string, e: ReactPointerEvent<HTMLElement>) => {
    if (!onSelectVerse) return;
    clearPress();
    const timer = window.setTimeout(() => {
      const cur = pressRef.current;
      if (!cur || cur.fired) return;
      cur.fired = true;
      onSelectVerse(verseKey);
    }, SHORT_SELECT_MS);
    pressRef.current = { verseKey, x: e.clientX, y: e.clientY, timer, fired: false };
  };

  const movePress = (e: ReactPointerEvent<HTMLElement>) => {
    const cur = pressRef.current;
    if (!cur) return;
    if (Math.abs(e.clientX - cur.x) > TAP_SLOP_PX || Math.abs(e.clientY - cur.y) > TAP_SLOP_PX) {
      clearPress();
    }
  };

  const endPress = (verseKey: string) => {
    const cur = pressRef.current;
    if (cur && !cur.fired && cur.verseKey === verseKey && onSelectVerse) {
      cur.fired = true;
      onSelectVerse(verseKey);
    }
    clearPress();
  };

  return (
    <div
      className={`nm-line${centered ? " nm-line--center" : ""}`}
      data-testid="nm-verse-line"
      dir="rtl"
      lang="ar"
    >
      {words.map((w) => (
        <VerseWord
          key={`${w.id}-${w.position}`}
          word={w}
          onSelectVerse={onSelectVerse}
          startPress={startPress}
          movePress={movePress}
          endPress={endPress}
          clearPress={clearPress}
        />
      ))}
    </div>
  );
});

type BasmalaProps = {
  words?: QpcWord[] | null;
  numbered?: boolean;
  onSelect?: () => void;
};

export const MushafBasmalaView = memo(function MushafBasmalaView({
  words = null,
  numbered = false,
  onSelect,
}: BasmalaProps) {
  const qpc = words && words.length > 0 ? words : BASMALA_QPC_WORDS;
  const body = qpc.filter((w) => w.charType !== "end");
  const end = numbered ? qpc.find((w) => w.charType === "end") : null;
  const selected = useMushafAyahWordSelected("1:1");
  const playing = useMushafAyahWordPlaying("1:1");
  const state = [selected ? "is-selected" : "", playing ? "is-playing" : ""].filter(Boolean).join(" ");

  return (
    <div
      className={`nm-basmala ${state}`.trim()}
      data-testid="mushaf-basmala"
      data-basmala="qpc"
      data-verse="1:1"
      data-ayah="1:1"
      dir="rtl"
      lang="ar"
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect?.();
      }}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      {body.map((w) => (
        <span key={w.id}>{w.glyphText}</span>
      ))}
      {end ? (
        <span className="nm-ayah-mark" aria-hidden="true">
          <span className="nm-ayah-mark__glyph">{end.glyphText}</span>
        </span>
      ) : null}
    </div>
  );
});
