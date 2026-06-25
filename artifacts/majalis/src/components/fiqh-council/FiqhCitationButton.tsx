import { formatFiqhCitation } from "@/lib/fiqh-citation";
import type { FiqhCouncilItem } from "@/lib/fiqh-council-types";

type Props = {
  item: FiqhCouncilItem;
  className?: string;
};

export function FiqhCitationButton({ item, className = "content-detail-action-btn" }: Props) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatFiqhCitation(item));
    } catch {
      /* ignore */
    }
  };

  return (
    <button type="button" onClick={handleCopy} className={className}>
      نسخ الاستشهاد
    </button>
  );
}
