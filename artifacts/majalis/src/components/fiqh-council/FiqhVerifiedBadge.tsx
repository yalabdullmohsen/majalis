import { isOfficialSourceVerified } from "@/lib/fiqh-council-trust";
import type { FiqhCouncilItem } from "@/lib/fiqh-council-types";

type BadgeItem = Pick<
  FiqhCouncilItem,
  "source_name" | "source_url" | "confidence_level" | "approved_by" | "approved_at"
>;

type Props = {
  item: BadgeItem;
  className?: string;
};

/**
 * حوكمة الصياغة:
 * - «موثق من المصدر الرسمي» ادّعاء توثيق كامل — لا يُعرض إلا إذا كان للمادة رابط
 *   مصدر رسمي **و** مُعتمِد بشري مُسمّى (approved_by + approved_at) في البيانات.
 * - إذا وُجد رابط المصدر بلا مُعتمِد بشري، تُخفَّض الصياغة إلى «مصدر رسمي مرفق»
 *   وهي عبارة تصف الواقع: رابطٌ مُرفق، لا مراجعةٌ مُثبتة.
 */
export function isHumanApprovedFiqhItem(item: BadgeItem): boolean {
  return Boolean(isOfficialSourceVerified(item) && item.approved_by && item.approved_at);
}

export function FiqhVerifiedBadge({ item, className = "fiqh-verified-badge" }: Props) {
  if (!isOfficialSourceVerified(item)) return null;

  if (!isHumanApprovedFiqhItem(item)) {
    return (
      <span
        className={className}
        title="رابط المصدر الرسمي مُرفق — لم يُسجَّل مُعتمِد بشري لهذه المادة بعد"
      >
        ↗ مصدر رسمي مرفق
      </span>
    );
  }

  return (
    <span
      className={className}
      title={`موثقة من مصدر رسمي مع رابط — اعتمدها: ${item.approved_by}`}
    >
      ✓ موثق من المصدر الرسمي
    </span>
  );
}
