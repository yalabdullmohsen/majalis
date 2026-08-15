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

/** سطر آيات من كلمات QPC — فواصل الآيات مضمّنة في السطر، والتحديد مقطع متصل. */
export function MushafAyahLine({
  words,
  centered = false,
  selectedVerseKey = null,
  playingVerseKey = null,
  onSelectVerse,
}: Props) {
  const runs = groupRuns(words);

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

        const onActivate = () => onSelectVerse?.(run.verseKey);

        return (
          <span
            key={`${run.verseKey}-${run.body[0]?.id ?? run.end?.id ?? "x"}`}
            className={`mm-ayah-run ${stateClass}`.trim()}
            data-verse={run.verseKey}
          >
            {run.body.length > 0 ? (
              <span
                role="button"
                tabIndex={0}
                className={`mm-ayah-hit mm-ayah-run__text ${stateClass}`.trim()}
                data-verse={run.verseKey}
                aria-label={`آية ${run.verseKey}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onActivate();
                  }
                }}
              >
                {run.body.map((w) => (
                  <span
                    key={`${w.verseKey}-${w.position}-${w.id}`}
                    className="mm-ayah-line__word"
                    data-word-id={w.id}
                    data-verse={w.verseKey}
                    data-word-pos={w.position}
                  >
                    {w.glyphText}
                  </span>
                ))}
              </span>
            ) : null}
            {run.end ? (
              <span
                role="button"
                tabIndex={0}
                className={`mm-ayah-hit mm-ayah-hit--end ${stateClass}`.trim()}
                data-verse={run.verseKey}
                aria-label={`آية ${run.verseKey}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onActivate();
                  }
                }}
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
