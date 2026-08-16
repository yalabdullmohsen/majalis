type Props = {
  pageNumber: number;
  hizbNumber?: number | null;
};

/** خرطوش رقم الصفحة — مصمت بإطار مزدوج؛ فردي يمين / زوجي يسار. */
export function MushafPageFooter({ pageNumber, hizbNumber = null }: Props) {
  const side = pageNumber % 2 === 1 ? "odd" : "even";
  return (
    <footer className="mm-page-footer" data-side={side} data-testid="mushaf-page-footer">
      {hizbNumber != null && hizbNumber > 0 ? (
        <span className="mm-page-footer__hizb" aria-label={`الحزب ${hizbNumber}`}>
          الحزب {toArabicDigits(hizbNumber)}
        </span>
      ) : (
        <span className="mm-page-footer__hizb mm-page-footer__hizb--spacer" aria-hidden="true" />
      )}
      <span className="mm-page-footer__badge" aria-label={`صفحة ${pageNumber}`}>
        <svg className="mm-page-footer__cartouche" viewBox="0 0 96 36" aria-hidden="true">
          <path
            d="M10 18c0-8 6-14 14-14h48c8 0 14 6 14 14s-6 14-14 14H24c-8 0-14-6-14-14Z"
            fill="var(--mm-banner-name-bg, #fffdf8)"
            stroke="var(--mm-gold-deep, #9a7d3c)"
            strokeWidth="2"
          />
          <path
            d="M14 18c0-6 4.5-10.5 10.5-10.5h47c6 0 10.5 4.5 10.5 10.5S77.5 28.5 71.5 28.5h-47C18.5 28.5 14 24 14 18Z"
            fill="none"
            stroke="var(--mm-gold, #bf9f5b)"
            strokeWidth="1"
          />
          <circle cx="12" cy="18" r="4.5" fill="var(--mm-banner-name-bg, #fffdf8)" stroke="var(--mm-gold-deep, #9a7d3c)" strokeWidth="1.2" />
          <circle cx="84" cy="18" r="4.5" fill="var(--mm-banner-name-bg, #fffdf8)" stroke="var(--mm-gold-deep, #9a7d3c)" strokeWidth="1.2" />
        </svg>
        <span className="mm-page-footer__num">{toArabicDigits(pageNumber)}</span>
      </span>
    </footer>
  );
}

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}
