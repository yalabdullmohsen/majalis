import type { QpcWord } from "@/lib/quran-data/qpc-page-data";
import { BASMALA_QPC_WORDS } from "@/lib/quran-data/basmala-qpc-words";

type Props = {
  /** كلمات QPC من صفحة الفاتحة (آية ١) — تُرسم بخط الصفحة */
  words?: QpcWord[] | null;
  /** هل يُعرض رقم الآية (الفاتحة فقط) — محرف الخط لا زخرفة */
  numbered?: boolean;
  selected?: boolean;
  playing?: boolean;
  onSelect?: () => void;
};

/**
 * مكوّن البسملة الوحيد.
 * - الفاتحة: محارف QPC من كلمات الصفحة + رقم ١.
 * - غيرها: محارف QPC V2 (من ١:١) بخط qpc-v2-pN للصفحة — نفس مقاس وسمك أسطر الآيات.
 */
export function MushafBasmala({
  words = null,
  numbered = false,
  selected = false,
  playing = false,
  onSelect,
}: Props) {
  const qpcWords = words && words.length > 0 ? words : BASMALA_QPC_WORDS;
  const body = qpcWords.filter((w) => w.charType !== "end");
  const end = qpcWords.find((w) => w.charType === "end") ?? null;
  const state = [selected ? "is-selected" : "", playing ? "is-playing" : ""].filter(Boolean).join(" ");

  return (
    <div
      className={`mm-basmala mm-basmala--qpc ${state}`.trim()}
      data-testid="mushaf-basmala"
      data-basmala="qpc"
      dir="rtl"
      lang="ar"
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      <span className={`mm-ayah-run__text ${state}`.trim()}>
        {body.map((w) => (
          <span key={w.id} className="mm-ayah-line__word" data-ayah={w.verseKey}>
            {w.glyphText}
          </span>
        ))}
      </span>
      {numbered && end ? (
        <span
          className="mm-ayah-hit mm-ayah-hit--end mm-ayah-line__word"
          data-type="end"
          data-key={end.verseKey}
          data-ayah={end.verseKey}
        >
          {end.glyphText}
        </span>
      ) : null}
    </div>
  );
}
