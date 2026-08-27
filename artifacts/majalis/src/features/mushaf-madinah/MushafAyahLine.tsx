import { memo, useMemo, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { QpcWord } from "@/lib/quran-data/qpc-page-data";
import { displaySurahName } from "@/lib/quran-display";
import { toArabicDigits } from "@/lib/utils";
import {
  useMushafAyahWordPlaying,
  useMushafAyahWordSelected,
} from "@/features/mushaf-madinah/mushaf-ayah-sync-store";
import type { MushafHideLevel } from "./MushafSettingsSheet";

type Props = {
  words: QpcWord[];
  centered?: boolean;
  onSelectVerse?: (verseKey: string) => void;
  /** ضغط مطوّل — يفتح التفسير مباشرة */
  onLongPressVerse?: (verseKey: string) => void;
  hideLevel?: MushafHideLevel;
  revealedVerses?: ReadonlySet<string>;
  onToggleReveal?: (verseKey: string) => void;
};

const TAP_SLOP_PX = 40;
const LONG_PRESS_MS = 480;

type PressState = {
  verseKey: string;
  x: number;
  y: number;
  longTimer: number;
  longFired: boolean;
};

function verseAriaLabel(verseKey: string, blanked: boolean): string {
  const [s, a] = verseKey.split(":");
  const surah = Number(s);
  const ayah = Number(a);
  const name = surah >= 1 && surah <= 114 ? displaySurahName(surah) : s;
  const base = `سورة ${name} آية ${toArabicDigits(ayah || a)}`;
  return blanked ? `${base} — مخفية، انقر للكشف` : base;
}

const AyahWordSpan = memo(function AyahWordSpan({
  word,
  blanked,
  onSelectVerse,
  startPress,
  endPress,
  clearPress,
}: {
  word: QpcWord;
  blanked: boolean;
  onSelectVerse?: (verseKey: string) => void;
  startPress: (verseKey: string, e: ReactPointerEvent<HTMLElement>) => void;
  endPress: (verseKey: string, e: ReactPointerEvent<HTMLElement>) => void;
  clearPress: () => void;
}) {
  const selected = useMushafAyahWordSelected(word.verseKey);
  const playing = useMushafAyahWordPlaying(word.verseKey);
  const isEnd = word.charType === "end";
  const stateClass = [
    selected ? "ayah-active" : "",
    playing ? "is-playing" : "",
    blanked && !isEnd ? "is-blanked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={`mm-ayah-line__word mm-ayah-hit ${isEnd ? "mm-ayah-hit--end" : ""} ${stateClass}`.trim()}
      data-type={word.charType}
      data-key={word.verseKey}
      data-verse={word.verseKey}
      data-ayah={word.verseKey}
      data-testid="mushaf-ayah-hit"
      role="button"
      tabIndex={0}
      aria-label={verseAriaLabel(word.verseKey, blanked && !isEnd)}
      aria-pressed={selected}
      onPointerDown={(e: ReactPointerEvent<HTMLElement>) => startPress(word.verseKey, e)}
      onPointerUp={(e: ReactPointerEvent<HTMLElement>) => endPress(word.verseKey, e)}
      onPointerCancel={() => {
        clearPress();
      }}
      onClick={(e: MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelectVerse?.(word.verseKey);
        }
      }}
    >
      {word.glyphText}
    </span>
  );
});

/**
 * سطر آيات — كلمات flex بفجوة ثابتة؛ space-between فقط بعد قياس fill الآمن.
 * التظليل المتصل عبر طبقة getClientRects (.mm-ayah-hl) لا خلفية كل كلمة.
 */
export const MushafAyahLine = memo(function MushafAyahLine({
  words,
  centered = false,
  onSelectVerse,
  onLongPressVerse,
  hideLevel = 0,
  revealedVerses,
  onToggleReveal,
}: Props) {
  const ordered = [...words].sort((a, b) => a.id - b.id || a.position - b.position);
  const pressRef = useRef<PressState | null>(null);

  const blankedIds = useMemo(() => {
    const set = new Set<number>();
    if (hideLevel <= 0) return set;
    const byVerse = new Map<string, QpcWord[]>();
    for (const w of ordered) {
      if (w.charType === "end") continue;
      const list = byVerse.get(w.verseKey);
      if (list) list.push(w);
      else byVerse.set(w.verseKey, [w]);
    }
    for (const [verseKey, list] of byVerse) {
      if (revealedVerses?.has(verseKey)) continue;
      list.forEach((w, i) => {
        if (hideLevel === 2 || i % 2 === 1) set.add(w.id);
      });
    }
    return set;
  }, [ordered, hideLevel, revealedVerses]);

  const clearPress = () => {
    const p = pressRef.current;
    if (p) window.clearTimeout(p.longTimer);
    pressRef.current = null;
  };

  const startPress = (verseKey: string, e: ReactPointerEvent<HTMLElement>) => {
    clearPress();
    const longTimer = window.setTimeout(() => {
      const cur = pressRef.current;
      if (!cur || cur.verseKey !== verseKey) return;
      cur.longFired = true;
      if (onLongPressVerse) onLongPressVerse(verseKey);
      else onSelectVerse?.(verseKey);
    }, LONG_PRESS_MS);
    pressRef.current = {
      verseKey,
      x: e.clientX,
      y: e.clientY,
      longTimer,
      longFired: false,
    };
  };

  const endPress = (verseKey: string, e: ReactPointerEvent<HTMLElement>) => {
    const p = pressRef.current;
    if (!p || p.verseKey !== verseKey) {
      clearPress();
      return;
    }
    const dx = Math.abs(e.clientX - p.x);
    const dy = Math.abs(e.clientY - p.y);
    const longFired = p.longFired;
    clearPress();
    if (longFired) return;
    if (dx > TAP_SLOP_PX || dy > TAP_SLOP_PX) return;
    if (hideLevel > 0 && !revealedVerses?.has(verseKey) && onToggleReveal) {
      onToggleReveal(verseKey);
      return;
    }
    onSelectVerse?.(verseKey);
  };

  return (
    <div
      className="mm-ayah-line"
      data-centered={centered ? "true" : "false"}
      data-fill="false"
      data-hide-level={hideLevel}
      dir="rtl"
    >
      {ordered.map((w) => (
        <AyahWordSpan
          key={`${w.verseKey}-${w.position}-${w.id}`}
          word={w}
          blanked={blankedIds.has(w.id)}
          onSelectVerse={onSelectVerse}
          startPress={startPress}
          endPress={endPress}
          clearPress={clearPress}
        />
      ))}
    </div>
  );
});
