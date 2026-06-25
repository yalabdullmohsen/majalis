import type { FiqhCouncilItem } from "@/lib/fiqh-council-types";
import { downloadFiqhItemTxt, printFiqhItemPdf } from "@/lib/fiqh-export";

type Props = {
  item: FiqhCouncilItem;
  className?: string;
};

export function FiqhExportButton({ item, className = "fiqh-export-actions" }: Props) {
  return (
    <div className={className}>
      <button type="button" className="content-detail-action-btn" onClick={() => downloadFiqhItemTxt(item)}>
        تصدير TXT
      </button>
      <button type="button" className="content-detail-action-btn" onClick={() => printFiqhItemPdf(item)}>
        تصدير PDF
      </button>
    </div>
  );
}
