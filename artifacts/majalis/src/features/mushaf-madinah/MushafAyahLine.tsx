import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { QpcWord } from "@/lib/quran-data/qpc-page-data";

/** نص عثماني قياسي للبسملة الافتتاحية — بلا رقم آية */
export const BASMALA_UTHMANI = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export function decorativeBasmalaWords(): QpcWord[] {
  return BASMALA_UTHMANI.split(" ").map((glyphText, i) => ({
    id: -(i + 1),
    position: i + 1,
    lineNumber: 0,
    charType: "word",
    textUthmani: glyphText,
    textQpcHafs: glyphText,
    glyphText,
    audioUrl: null,
    verseKey: "",
    sajdahNumber: null,
  }));
}

type Props = {
  words: QpcWord[];
  centered?: boolean;
  lineType?: "ayah" | "basmallah";
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
  lineType = "ayah",
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
      className={`mm-ayah-line${lineType === "basmallah" ? " mm-basmala" : ""}`}
      data-centered={centered ? "true" : "false"}
      data-line-type={lineType}
      dir="rtl"
    >
      {ordered.map((w) => {
        const interactive = Boolean(w.verseKey);
        const selected = interactive && selectedVerseKey === w.verseKey;
        const playing = interactive && playingVerseKey === w.verseKey;
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
            className={`mm-ayah-line__word${interactive ? " mm-ayah-hit" : ""} ${isEnd ? "mm-ayah-hit--end" : ""} ${stateClass}`.trim()}
            data-type={w.charType}
            data-key={w.verseKey || undefined}
            data-verse={w.verseKey || undefined}
            data-testid={interactive ? "mushaf-ayah-hit" : undefined}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `آية ${w.verseKey}` : undefined}
            aria-pressed={interactive ? selected : undefined}
            onPointerDown={
              interactive
                ? (e: ReactPointerEvent<HTMLElement>) => startPress(w.verseKey, e)
                : undefined
            }
            onPointerUp={
              interactive
                ? (e: ReactPointerEvent<HTMLElement>) => endPress(w.verseKey, e)
                : undefined
            }
            onPointerCancel={
              interactive
                ? (e: ReactPointerEvent<HTMLElement>) => {
                    e.stopPropagation();
                    clearPress();
                  }
                : undefined
            }
            onClick={
              interactive
                ? (e: MouseEvent<HTMLElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                : undefined
            }
            onKeyDown={
              interactive
                ? (e: KeyboardEvent<HTMLElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectVerse?.(w.verseKey);
                    }
                  }
                : undefined
            }
          >
            {w.glyphText}
          </span>
        );
      })}
    </div>
  );
}
