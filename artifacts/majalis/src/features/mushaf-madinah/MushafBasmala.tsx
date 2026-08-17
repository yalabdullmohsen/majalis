import type { QpcWord } from "@/lib/quran-data/qpc-page-data";

/** نص عثماني قياسي للبسملة الزخرفية — بلا رقم آية */
export const BASMALA_UTHMANI = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

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
 * - غيرها: نص عثماني متصل بخط عثماني Unicode فقط (لا خط qpc-page-N) حتى لا تتكسّر الحروف.
 */
export function MushafBasmala({
  words = null,
  numbered = false,
  selected = false,
  playing = false,
  onSelect,
}: Props) {
  if (words && words.length > 0) {
    const body = words.filter((w) => w.charType !== "end");
    const end = words.find((w) => w.charType === "end") ?? null;
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
            <span key={w.id} className="mm-ayah-line__word">
              {w.glyphText}
            </span>
          ))}
        </span>
        {numbered && end ? (
          <span
            className="mm-ayah-hit mm-ayah-hit--end mm-ayah-line__word"
            data-type="end"
            data-key={end.verseKey}
          >
            {end.glyphText}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="mm-basmala mm-basmala--uthmani"
      data-testid="mushaf-basmala"
      data-basmala="uthmani"
      dir="rtl"
      lang="ar"
      aria-hidden="true"
    >
      {BASMALA_UTHMANI}
    </div>
  );
}
