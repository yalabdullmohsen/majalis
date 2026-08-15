import type { QpcWord } from "@/lib/quran-data/qpc-page-data";
import { MushafAyahNumber } from "./MushafAyahNumber";

type Props = {
  words: QpcWord[];
  centered?: boolean;
  selectedVerseKey?: string | null;
  playingVerseKey?: string | null;
  onSelectVerse?: (verseKey: string) => void;
};

/** سطر آيات من كلمات QPC — فواصل الآيات مضمّنة في السطر (span لا button حتى لا يُكسر القياس). */
export function MushafAyahLine({
  words,
  centered = false,
  selectedVerseKey = null,
  playingVerseKey = null,
  onSelectVerse,
}: Props) {
  const ordered = [...words].sort((a, b) => a.id - b.id || a.position - b.position);
  return (
    <div
      className="mm-ayah-line"
      data-centered={centered ? "1" : "0"}
      dir="rtl"
    >
      {ordered.map((w) => {
        const selected = selectedVerseKey === w.verseKey;
        const playing = playingVerseKey === w.verseKey;
        const stateClass = [
          selected ? "is-selected" : "",
          playing ? "is-playing" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const onActivate = () => onSelectVerse?.(w.verseKey);

        if (w.charType === "end") {
          return (
            <span
              key={`${w.verseKey}-${w.position}-${w.id}`}
              role="button"
              tabIndex={0}
              className={`mm-ayah-hit mm-ayah-hit--end ${stateClass}`.trim()}
              data-verse={w.verseKey}
              aria-label={`آية ${w.verseKey}`}
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
              <MushafAyahNumber word={w} />
            </span>
          );
        }

        return (
          <span
            key={`${w.verseKey}-${w.position}-${w.id}`}
            role="button"
            tabIndex={0}
            className={`mm-ayah-hit mm-ayah-line__word ${stateClass}`.trim()}
            data-verse={w.verseKey}
            aria-label={`آية ${w.verseKey}`}
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
            {w.glyphText}
          </span>
        );
      })}
    </div>
  );
}
