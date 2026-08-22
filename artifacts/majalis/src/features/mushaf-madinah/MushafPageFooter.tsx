type Props = {
  pageNumber: number;
  /** يُعرض وصف الحزب فقط إذا ابتدأ حزب في هذه الصفحة */
  hizbStartingOnPage?: number | null;
};

/**
 * ذيل الصفحة — رقم الصفحة فقط في المنتصف (بلا صندوق أو زخرفة).
 * اليمين: وصف الحزب إن بدأ في هذه الصفحة فقط.
 */
export function MushafPageFooter({ pageNumber, hizbStartingOnPage = null }: Props) {
  const hizbStart = hizbStartingOnPage != null && hizbStartingOnPage > 0;
  return (
    <footer
      className="mm-page-footer"
      data-side={hizbStart ? "hizb-start" : "default"}
      data-testid="mushaf-page-footer"
    >
      {hizbStart ? (
        <span className="mm-page-footer__hizb" aria-label={`الحزب ${hizbStartingOnPage}`}>
          الحزب {toArabicDigits(hizbStartingOnPage!)}
        </span>
      ) : null}
      <span className="mm-page-footer__badge" aria-label={`صفحة ${pageNumber}`}>
        <span className="mm-page-footer__num">{toArabicDigits(pageNumber)}</span>
      </span>
    </footer>
  );
}

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}
