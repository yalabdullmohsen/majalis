import type { QpcWord } from "@/lib/quran-data/qpc-page-data";

type Props = {
  word: QpcWord;
};

/** رقم الآية كحرف QPC مضمّن (زخرفة الخط الذهبي عبر اللون). */
export function MushafAyahNumber({ word }: Props) {
  return (
    <span className="mm-ayah-number" data-ayah={word.verseKey} aria-hidden="true">
      <span className="mm-ayah-number__glyph">{word.glyphText}</span>
    </span>
  );
}
