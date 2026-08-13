/**
 * صندوق ثقة المحتوى — نوع · مصدر · شيخ/مؤلف · مراجعة · تنبيه.
 */
import "@/styles/components/content-trust.css";

export type ContentTrustBoxProps = {
  contentType: string;
  source?: string;
  authorOrScholar?: string;
  reviewedAt?: string;
  reviewer?: string;
  disclaimer?: string;
  className?: string;
};

const DEFAULT_DISCLAIMER =
  "هذه المادة للتعلم والاطلاع، ولا تغني عن سؤال أهل العلم في النوازل الخاصة.";

export function ContentTrustBox({
  contentType,
  source,
  authorOrScholar,
  reviewedAt,
  reviewer,
  disclaimer = DEFAULT_DISCLAIMER,
  className,
}: ContentTrustBoxProps) {
  const classes = ["ct-trust-box", className].filter(Boolean).join(" ");
  return (
    <aside className={classes} data-content-trust="1" aria-label="توثيق المحتوى">
      <dl className="ct-trust-box__meta">
        <div>
          <dt>نوع المحتوى</dt>
          <dd>{contentType}</dd>
        </div>
        {source ? (
          <div>
            <dt>المصدر</dt>
            <dd>{source}</dd>
          </div>
        ) : null}
        {authorOrScholar ? (
          <div>
            <dt>الشيخ أو المؤلف</dt>
            <dd>{authorOrScholar}</dd>
          </div>
        ) : null}
        {reviewedAt ? (
          <div>
            <dt>آخر مراجعة</dt>
            <dd>
              <time dateTime={reviewedAt}>{reviewedAt}</time>
            </dd>
          </div>
        ) : null}
        {reviewer ? (
          <div>
            <dt>المراجع العلمي</dt>
            <dd>{reviewer}</dd>
          </div>
        ) : null}
      </dl>
      <p className="ct-trust-box__disclaimer" role="note">
        {disclaimer}
      </p>
    </aside>
  );
}

export default ContentTrustBox;
