type Props = {
  nameArabic: string;
};

/** زخرفة رأس سورة — لوحة أعرض متجاوبة مع زخرفة إسلامية خفيفة يمين ويسار. */
export function MushafSurahOrnament({ nameArabic }: Props) {
  const label = nameArabic.startsWith("سورة") ? nameArabic : `سُورَةُ ${nameArabic}`;
  return (
    <div className="mm-surah-ornament" role="img" aria-label={label} data-testid="mushaf-surah-ornament">
      <span className="mm-surah-ornament__side" aria-hidden="true">
        <svg viewBox="0 0 40 40" className="mm-surah-ornament__motif" focusable="false">
          <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M20 5.5 22.6 14.2 31.5 14.2 24.4 19.5 27 28.2 20 22.9 13 28.2 15.6 19.5 8.5 14.2 17.4 14.2Z"
            fill="currentColor"
            opacity="0.85"
          />
        </svg>
      </span>
      <span className="mm-surah-ornament__name">{label}</span>
      <span className="mm-surah-ornament__side" aria-hidden="true">
        <svg viewBox="0 0 40 40" className="mm-surah-ornament__motif" focusable="false">
          <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M20 5.5 22.6 14.2 31.5 14.2 24.4 19.5 27 28.2 20 22.9 13 28.2 15.6 19.5 8.5 14.2 17.4 14.2Z"
            fill="currentColor"
            opacity="0.85"
          />
        </svg>
      </span>
    </div>
  );
}
