import type { QpcWord } from "@/lib/quran-data/qpc-page-data";
import { MushafAyahNumber } from "./MushafAyahNumber";

type Props = {
  words: QpcWord[];
  centered?: boolean;
};

/** سطر آيات من كلمات QPC — بدون letter/word-spacing. */
export function MushafAyahLine({ words, centered = false }: Props) {
  const ordered = [...words].sort((a, b) => a.position - b.position);
  return (
    <div
      className="mm-ayah-line"
      data-centered={centered ? "1" : "0"}
      dir="rtl"
    >
      {ordered.map((w) =>
        w.charType === "end" ? (
          <MushafAyahNumber key={`${w.verseKey}-${w.position}-${w.id}`} word={w} />
        ) : (
          <span
            key={`${w.verseKey}-${w.position}-${w.id}`}
            className="mm-ayah-line__word"
            data-verse={w.verseKey}
          >
            {w.glyphText}
          </span>
        ),
      )}
    </div>
  );
}
