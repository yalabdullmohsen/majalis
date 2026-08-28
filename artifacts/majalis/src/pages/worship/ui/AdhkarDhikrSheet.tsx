import { useEffect } from "react";
import { X } from "lucide-react";
import type { AdhkarItem } from "@/lib/adhkar-seed";
import { ShareButton } from "@/components/ShareButton";
import { IsnadAttributionBar } from "@/components/IsnadAttributionBar";

function toAr(n: number): string {
  return n.toLocaleString("ar-EG", { useGrouping: false });
}

type Props = {
  item: AdhkarItem;
  onClose: () => void;
};

/** شيت تفاصيل الذكر — كسول حتى يُفتح (خارج مسار قائمة الأذكار). */
export function AdhkarDhikrSheet({ item, onClose }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
    // مساران بديلان كاملان بلوحة المفاتيح.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="adhkar-sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="تفاصيل الذكر"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="adhkar-sheet">
        <div className="adhkar-sheet-handle" aria-hidden="true" />
        <button type="button" className="adhkar-sheet-close" onClick={onClose} aria-label="إغلاق">
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <h2 className="adhkar-sheet-title">تفاصيل الذكر</h2>
        <div className="adhkar-sheet-text">{item.text}</div>
        <dl className="adhkar-sheet-details">
          <div className="adhkar-sheet-row">
            <dt>عدد المرات</dt>
            <dd>{toAr(item.count)} مرة</dd>
          </div>
        </dl>
        <IsnadAttributionBar
          data={{
            source: item.source,
            grade: item.grade,
            narrator: item.narrator,
            reference: item.reference,
            reportContentType: "adhkar",
            reportContentId: item.id,
          }}
        />
        <ShareButton
          title="ذكر"
          text={`${item.text}${item.source ? `\n— ${item.source}` : ""}`}
          size="sm"
          className="adhkar-sheet-share"
        />
        <button type="button" className="adhkar-sheet-dismiss" onClick={onClose}>
          إغلاق
        </button>
      </div>
    </div>
  );
}

export default AdhkarDhikrSheet;
