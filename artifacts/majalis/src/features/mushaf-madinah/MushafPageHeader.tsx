type Props = {
  juzNumber: number;
  surahNames: string[];
};

export function MushafPageHeader({ juzNumber, surahNames }: Props) {
  const surahLabel = surahNames.length ? surahNames.join(" · ") : "—";
  return (
    <header className="mm-page-header" data-testid="mushaf-page-header">
      <span className="mm-page-header__juz">الجزء {toArabicDigits(juzNumber)}</span>
      <span className="mm-page-header__surah">{surahLabel}</span>
    </header>
  );
}

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}
