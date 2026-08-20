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

type VerseRun = { verseKey: string; words: QpcWord[] };

/** يجمع كلمات الآية المتتالية في مقطع واحد — تظليل متصل بلا صناديق لكل كلمة. */
function groupVerseRuns(words: QpcWord[]): VerseRun[] {
  const ordered = [...words].sort((a, b) => a.id - b.id || a.position - b.position);
  const runs: VerseRun[] = [];
  for (const w of ordered) {
    const last = runs[runs.length - 1];
    if (last && last.verseKey === w.verseKey) {
      last.words.push(w);
    } else {
      runs.push({ verseKey: w.verseKey, words: [w] });
    }
  }
  return runs;
}

/** سطر آيات — مقاطع آية متصلة (flex) كالمصحف الورقي. */
export function MushafAyahLine({
  words,
  centered = false,
  selectedVerseKey = null,
  playingVerseKey = null,
  onSelectVerse,
}: Props) {
  const runs = groupVerseRuns(words);
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
    <div className="mm-ayah-line" data-centered={centered ? "true" : "false"} dir="rtl">
      {runs.map((run) => {
        const selected = selectedVerseKey === run.verseKey;
        const playing = playingVerseKey === run.verseKey;
        const stateClass = [
          selected ? "ayah-active" : "",
          playing ? "is-playing" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <span
            key={`${run.verseKey}-${run.words[0]!.id}`}
            className={`mm-ayah-run ${stateClass}`.trim()}
            data-verse-run={run.verseKey}
            role="button"
            tabIndex={0}
            aria-label={`آية ${run.verseKey}`}
            aria-pressed={selected}
            onPointerDown={(e: ReactPointerEvent<HTMLElement>) => startPress(run.verseKey, e)}
            onPointerUp={(e: ReactPointerEvent<HTMLElement>) => endPress(run.verseKey, e)}
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
                onSelectVerse?.(run.verseKey);
              }
            }}
          >
            <span className={`mm-ayah-run__text ${stateClass}`.trim()}>
              {run.words.map((w) => {
                const isEnd = w.charType === "end";
                return (
                  <span
                    key={`${w.verseKey}-${w.position}-${w.id}`}
                    className={`mm-ayah-line__word mm-ayah-hit ${isEnd ? "mm-ayah-hit--end" : ""}`.trim()}
                    data-type={w.charType}
                    data-key={w.verseKey}
                    data-verse={w.verseKey}
                    data-ayah={w.verseKey}
                    data-testid="mushaf-ayah-hit"
                  >
                    {w.glyphText}
                  </span>
                );
              })}
            </span>
          </span>
        );
      })}
    </div>
  );
}
