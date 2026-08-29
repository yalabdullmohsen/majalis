type Props = {
  nameArabic: string;
};

/**
 * شريط اسم السورة — خرطوش زخرفي بهوية المجلس (مطابق لإطار فواصل الآيات).
 * بلا SVG ولا تدرجات في المكوّن — الزخرفة من CSS فقط.
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
