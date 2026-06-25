import { isOfficialSourceVerified } from "@/lib/fiqh-council-trust";
import type { FiqhCouncilItem } from "@/lib/fiqh-council-types";

type Props = {
  item: Pick<FiqhCouncilItem, "source_name" | "source_url" | "confidence_level">;
  className?: string;
};

export function FiqhVerifiedBadge({ item, className = "fiqh-verified-badge" }: Props) {
  if (!isOfficialSourceVerified(item)) return null;

  return (
    <span className={className} title="المادة موثقة من مصدر رسمي مع رابط">
      ✓ موثق من المصدر الرسمي
    </span>
  );
}
