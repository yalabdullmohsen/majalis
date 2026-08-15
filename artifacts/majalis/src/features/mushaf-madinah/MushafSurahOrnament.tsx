type Props = {
  nameArabic: string;
};

/** زخرفة رأس سورة — إطار ذهبي هادئ وواسع مع زخرفة يمين ويسار. */
export function MushafSurahOrnament({ nameArabic }: Props) {
  const label = nameArabic.startsWith("سورة") ? nameArabic : `سُورَةُ ${nameArabic}`;
  return (
    <div className="mm-surah-ornament" role="img" aria-label={label} data-testid="mushaf-surah-ornament">
      <span className="mm-surah-ornament__side" aria-hidden="true" />
      <span className="mm-surah-ornament__name">{label}</span>
      <span className="mm-surah-ornament__side" aria-hidden="true" />
    </div>
  );
}
