type Props = {
  pageNumber: number;
};

/** رقم الصفحة داخل إطار زخرفي — يمين للفردي ويسار للزوجي كالمصحف. */
export function MushafPageFooter({ pageNumber }: Props) {
  const side = pageNumber % 2 === 1 ? "odd" : "even";
  return (
    <footer className="mm-page-footer" data-side={side}>
      <span className="mm-page-footer__badge" aria-label={`صفحة ${pageNumber}`}>
        {toArabicDigits(pageNumber)}
      </span>
    </footer>
  );
}

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
}
