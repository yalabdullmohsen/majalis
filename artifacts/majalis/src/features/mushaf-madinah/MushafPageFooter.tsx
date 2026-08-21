type Props = {
  pageNumber: number;
  /** يُعرض وصف الحزب فقط إذا ابتدأ حزب في هذه الصفحة */
  hizbStartingOnPage?: number | null;
};

/**
 * ذيل الصفحة — شبكة ثابتة لكل الصفحات:
 * الوسط: خرطوش رقم الصفحة (لا يتحرك مع طول النص أو عنوان السورة أو الحزب).
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
        <svg className="mm-page-footer__cartouche" viewBox="0 0 96 36" aria-hidden="true">
          <rect
            x="8"
            y="6"
            width="80"
            height="24"
            rx="3"
            ry="3"
            fill="var(--mm-banner-name-bg, #fffdf8)"
            stroke="var(--mm-gold-deep, #9a7d3c)"
            strokeWidth="1.5"
          />
        </svg>
        <span className="mm-page-footer__num">{toArabicDigits(pageNumber)}</span>
      </span>
    </footer>
  );
}

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}
