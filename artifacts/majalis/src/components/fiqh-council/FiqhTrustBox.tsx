import type { FiqhCouncilItem, FiqhCouncilSession } from "@/lib/fiqh-council-types";
import { FIQH_VERIFICATION_STATUS_LABELS } from "@/lib/fiqh-council-types";
import { isOfficialSourceVerified } from "@/lib/fiqh-council-trust";

type Props = {
  sourceName?: string;
  sourceUrl?: string;
  updatedAt?: string;
  verificationStatus?: FiqhCouncilSession["verification_status"] | "verified" | "pending" | "unavailable";
  item?: Partial<Pick<FiqhCouncilItem, "source_name" | "source_url" | "confidence_level" | "updated_at">>;
  className?: string;
};

export function FiqhTrustBox({
  sourceName,
  sourceUrl,
  updatedAt,
  verificationStatus,
  item,
  className = "fiqh-trust-box ui-card",
}: Props) {
  const verified = item
    ? isOfficialSourceVerified(item)
    : verificationStatus === "verified" && Boolean(sourceUrl);

  const statusLabel = verificationStatus
    ? FIQH_VERIFICATION_STATUS_LABELS[verificationStatus]
    : verified
      ? FIQH_VERIFICATION_STATUS_LABELS.verified
      : FIQH_VERIFICATION_STATUS_LABELS.unavailable;

  const src = item?.source_name || sourceName;
  const url = item?.source_url || sourceUrl;
  const updated = item?.updated_at || updatedAt;

  return (
    <aside className={className} aria-label="حالة التوثيق">
      <h3 className="fiqh-trust-box-title">حالة التوثيق</h3>
      <dl className="fiqh-trust-box-list">
        <div>
          <dt>المصدر الرسمي</dt>
          <dd>{src || "لم تُنشر بيانات موثقة بعد."}</dd>
        </div>
        {url && (
          <div>
            <dt>رابط المصدر</dt>
            <dd>
              <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
            </dd>
          </div>
        )}
        <div>
          <dt>آخر تحديث</dt>
          <dd>{updated ? updated.slice(0, 10) : "غير متوفر"}</dd>
        </div>
        <div>
          <dt>حالة البيانات</dt>
          <dd>{statusLabel}</dd>
        </div>
        <div>
          <dt>موثق</dt>
          <dd>{verified ? "نعم — مصدر رسمي ورابط متوفر" : "لا — يحتاج مراجعة أو مصدر"}</dd>
        </div>
      </dl>
    </aside>
  );
}
