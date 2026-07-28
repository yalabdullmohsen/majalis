import type { FiqhCouncilItem } from "@/lib/fiqh-council-types";

type Props = {
  item: FiqhCouncilItem;
  className?: string;
};

/** Export actions — heavy print/PDF helpers loaded on click only. */
export function FiqhExportButton({ item, className = "fiqh-export-actions" }: Props) {
  return (
    <div className={className}>
      <button
        type="button"
        className="content-detail-action-btn"
        onClick={() => {
          void import("@/lib/fiqh-export").then((m) => m.downloadFiqhItemTxt(item));
        }}
      >
        تصدير TXT
      </button>
      <button
        type="button"
        className="content-detail-action-btn"
        onClick={() => {
          void import("@/lib/fiqh-export").then((m) => m.printFiqhItemPdf(item));
        }}
      >
        تصدير PDF
      </button>
    </div>
  );
}
