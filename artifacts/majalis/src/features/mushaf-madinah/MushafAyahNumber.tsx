import type { QpcWord } from "@/lib/quran-data/qpc-page-data";

type Props = {
  word: QpcWord;
};

/** رقم الآية كمحرف QPC من خط الصفحة — بلا زخرفة أو تحجيم. */
export function MushafAyahNumber({ word }: Props) {
  return (
    <span className="mm-ayah-number" data-type="end" data-ayah={word.verseKey} aria-hidden="true">
      {word.glyphText}
    </span>
  );
}
