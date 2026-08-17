type Props = {
  nameArabic: string;
};

/**
 * شريط اسم السورة — مستطيل بسيط بعرض كتلة النص (مصحف المدينة).
 * بلا SVG ولا تدرجات ولا تموضع مطلق.
 */
export function MushafSurahOrnament({ nameArabic }: Props) {
  const name = nameArabic.replace(/^سُورَةُ\s*/u, "").replace(/^سورة\s*/u, "").trim();
  const label = `سورة ${name}`;
  return (
    <div
      className="mm-surah-frame"
      role="img"
      aria-label={label}
      data-testid="mushaf-surah-ornament"
    >
      <span className="mm-surah-frame__name">{name}</span>
    </div>
  );
}
