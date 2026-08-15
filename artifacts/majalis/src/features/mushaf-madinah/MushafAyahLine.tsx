import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { QpcWord } from "@/lib/quran-data/qpc-page-data";
import { MushafAyahNumber } from "./MushafAyahNumber";

type Props = {
  words: QpcWord[];
  centered?: boolean;
  selectedVerseKey?: string | null;
  playingVerseKey?: string | null;
  onSelectVerse?: (verseKey: string) => void;
};

type WordRun = {
  verseKey: string;
  body: QpcWord[];
  end: QpcWord | null;
};

const TAP_SLOP_PX = 14;
const LONG_PRESS_MS = 480;

/** يجمع كلمات الآية المتتالية في مقطع واحد لتظليل متصل (بدون مربعات لكل كلمة). */
function groupRuns(words: QpcWord[]): WordRun[] {
  const ordered = [...words].sort((a, b) => a.id - b.id || a.position - b.position);
  const runs: WordRun[] = [];
  let current: WordRun | null = null;

  for (const w of ordered) {
    if (!current || current.verseKey !== w.verseKey) {
      current = { verseKey: w.verseKey, body: [], end: null };
      runs.push(current);
    }
    if (w.charType === "end") current.end = w;
    else current.body.push(w);
  }
  return runs;
}

type PressState = {
  verseKey: string;
  x: number;
  y: number;
  longTimer: number;
  longFired: boolean;
};

/** سطر آيات من كلمات QPC — فواصل الآيات مضمّنة في السطر، والتحديد مقطع متصل. */
export function MushafAyahLine({
  words,
  centered = false,
  selectedVerseKey = null,
  playingVerseKey = null,
  onSelectVerse,
}: Props) {
  const runs = groupRuns(words);
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
      // long press = فتح أدوات الآية (تحديد + شريط)
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
    // tap = تحديد الآية (+ شريط الأدوات)
    onSelectVerse?.(verseKey);
  };

  return (
    <div
      className="mm-ayah-line"
      data-centered={centered ? "1" : "0"}
      dir="rtl"
    >
      {runs.map((run) => {
        const selected = selectedVerseKey === run.verseKey;
        const playing = playingVerseKey === run.verseKey;
        const stateClass = [
          selected ? "is-selected" : "",
          playing ? "is-playing" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const hitProps = {
          role: "button" as const,
          tabIndex: 0,
          "data-verse": run.verseKey,
          "aria-label": `آية ${run.verseKey}`,
          "aria-pressed": selected,
          onPointerDown: (e: ReactPointerEvent<HTMLElement>) => startPress(run.verseKey, e),
          onPointerUp: (e: ReactPointerEvent<HTMLElement>) => endPress(run.verseKey, e),
          onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => {
            e.stopPropagation();
            clearPress();
          },
          onClick: (e: MouseEvent<HTMLElement>) => {
            e.preventDefault();
            e.stopPropagation();
          },
          onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onSelectVerse?.(run.verseKey);
            }
          },
        };

        return (
          <span
            key={`${run.verseKey}-${run.body[0]?.id ?? run.end?.id ?? "x"}`}
            className={`mm-ayah-run ${stateClass}`.trim()}
            data-verse={run.verseKey}
          >
            {run.body.length > 0 ? (
              <span
                className={`mm-ayah-hit mm-ayah-run__text ${stateClass}`.trim()}
                data-testid="mushaf-ayah-hit"
                {...hitProps}
              >
                {run.body.map((w) => (
                  <span
                    key={`${w.verseKey}-${w.position}-${w.id}`}
                    className="mm-ayah-line__word"
                  >
                    {w.glyphText}
                  </span>
                ))}
              </span>
            ) : null}
            {run.end ? (
              <span
                className={`mm-ayah-hit mm-ayah-hit--end ${stateClass}`.trim()}
                data-testid="mushaf-ayah-hit"
                {...hitProps}
              >
                <MushafAyahNumber word={run.end} />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
