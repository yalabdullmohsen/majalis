/**
 * شريط إسناد موحّد (R4-4b): مصدر · الدرجة · من خرّجه · مراجعة · إبلاغ.
 * ارتفاع محجوز ثابت لتقليل CLS.
 */
import { ContentReportButton } from "@/components/ContentReportButton";
import "@/styles/components/isnad-attribution-bar.css";

export type IsnadAttribution = {
  source?: string | null;
  grade?: string | null;
  narrator?: string | null;
  reference?: string | null;
  reviewedAt?: string | null;
  needsReview?: boolean;
  reportContentType?: string;
  reportContentId?: string | number;
};

type Props = {
  data: IsnadAttribution;
  className?: string;
};

export function IsnadAttributionBar({ data, className = "" }: Props) {
  const bits = [
    data.source ? `المصدر: ${data.source}` : null,
    data.grade ? `الدرجة: ${data.grade}` : null,
    data.narrator ? `الراوي: ${data.narrator}` : null,
    data.reference ? `المرجع: ${data.reference}` : null,
    data.reviewedAt ? `آخر مراجعة: ${data.reviewedAt}` : null,
  ].filter(Boolean) as string[];

  return (
    <aside
      className={`isnad-bar ${className}`.trim()}
      dir="rtl"
      aria-label="إسناد وتوثيق"
    >
      <p className="isnad-bar__line">
        {bits.length ? bits.join(" · ") : "المصدر والدرجة مذكوران في المتن حيث وُجدتا."}
      </p>
      {data.reportContentType && data.reportContentId != null ? (
        <div className="isnad-bar__report">
          <ContentReportButton
            contentType={data.reportContentType}
            contentId={data.reportContentId}
          />
        </div>
      ) : null}
    </aside>
  );
}
