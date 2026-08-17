import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { QpcWord } from "@/lib/quran-data/qpc-page-data";

type Props = {
  words: QpcWord[];
  centered?: boolean;
  selectedVerseKey?: string | null;
  playingVerseKey?: string | null;
  onSelectVerse?: (verseKey: string) => void;
};

const TAP_SLOP_PX = 14;
const LONG_PRESS_MS = 480;

type PressState = {
  verseKey: string;
  x: number;
  y: number;
  longTimer: number;
  longFired: boolean;
};

/** سطر آيات — كل كلمة عنصر flex يملأ العرض كالمصحف الورقي. */
export function MushafAyahLine({
  words,
  centered = false,
  selectedVerseKey = null,
  playingVerseKey = null,
  onSelectVerse,
}: Props) {
  const ordered = [...words].sort((a, b) => a.id - b.id || a.position - b.position);
  const pressRef = useRef<PressState | null>(null);

  const clearPress = () => {
    const p = pressRef.current;
    if (p) window.clearTimeout(p.longTimer);
    pressRef.current = null;
  };

  const startPress = (verseKey: string, e: ReactPointerEvent<HTMLElement>) => {
    e.stopPropagation();
    clearPress();
    const longTimer = window.setTimeout(() => {
      const cur = pressRef.current;
      if (!cur || cur.verseKey !== verseKey) return;
      cur.longFired = true;
      onSelectVerse?.(verseKey);
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
    e.stopPropagation();
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
    onSelectVerse?.(verseKey);
  };

  return (
    <div
      className="mm-ayah-line"
      data-centered={centered ? "true" : "false"}
      dir="rtl"
    >
      {ordered.map((w) => {
        const selected = selectedVerseKey === w.verseKey;
        const playing = playingVerseKey === w.verseKey;
        const isEnd = w.charType === "end";
        const stateClass = [
          selected ? "is-selected ayah-active" : "",
          playing ? "is-playing" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <span
            key={`${w.verseKey}-${w.position}-${w.id}`}
            className={`mm-ayah-line__word mm-ayah-hit ${isEnd ? "mm-ayah-hit--end" : ""} ${stateClass}`.trim()}
            data-type={w.charType}
            data-key={w.verseKey}
            data-verse={w.verseKey}
            data-testid="mushaf-ayah-hit"
            role="button"
            tabIndex={0}
            aria-label={`آية ${w.verseKey}`}
            aria-pressed={selected}
            onPointerDown={(e: ReactPointerEvent<HTMLElement>) => startPress(w.verseKey, e)}
            onPointerUp={(e: ReactPointerEvent<HTMLElement>) => endPress(w.verseKey, e)}
            onPointerCancel={(e: ReactPointerEvent<HTMLElement>) => {
              e.stopPropagation();
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
                onSelectVerse?.(w.verseKey);
              }
            }}
          >
            {w.glyphText}
          </span>
        );
      })}
    </div>
  );
}
