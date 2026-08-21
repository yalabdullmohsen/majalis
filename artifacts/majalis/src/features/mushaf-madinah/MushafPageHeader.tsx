type Props = {
  juzNumber: number;
  surahName: string;
};

/**
 * رأس ثابت لكل الصفحات:
 * يمين: اسم السورة الحالية (أول آية في الصفحة).
 * يسار: رقم الجزء.
 * المواضع فيزيائية لا تنعكس مع طول النص ولا مع انتقال سورة.
 */
export function MushafPageHeader({ juzNumber, surahName }: Props) {
  return (
    <header className="mm-page-header" data-testid="mushaf-page-header">
      <span className="mm-page-header__surah" data-testid="mushaf-page-header-surah">
        {surahName || "—"}
      </span>
      <span className="mm-page-header__juz" data-testid="mushaf-page-header-juz">
        الجزء {toArabicDigits(juzNumber)}
      </span>
    </header>
  );
}

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}
