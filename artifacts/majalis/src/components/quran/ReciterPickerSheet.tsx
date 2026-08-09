import { Check } from "lucide-react";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import {
  ensureValidReciterPreference,
  getSelectableReciters,
  reciterInitial,
  type ReciterSelectMode,
} from "@/lib/quran-audio";
import "@/styles/components/reciter-picker-sheet.css";

type Props = {
  open: boolean;
  onClose: () => void;
  reciterId: string;
  onSelect: (id: string) => void;
  mode?: ReciterSelectMode;
};

/**
 * شيت سفلي لاختيار القارئ — نفس لغة التصميم (AppBottomSheet) مع حرف أول + رواية + جودة.
 */
export function ReciterPickerSheet({
  open,
  onClose,
  reciterId,
  onSelect,
  mode = "ayah",
}: Props) {
  const list = getSelectableReciters(mode);

  return (
    <AppBottomSheet open={open} onClose={onClose} title="اختر القارئ" snap="half">
      <ul className="reciter-picker-sheet__list" role="listbox" aria-label="قائمة القرّاء">
        {list.map((r) => {
          const active = r.id === reciterId;
          return (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                className={`reciter-picker-sheet__item${active ? " is-active" : ""}`}
                onClick={() => {
                  onSelect(r.id);
                  void ensureValidReciterPreference();
                  onClose();
                }}
              >
                <span className="reciter-picker-sheet__initial" aria-hidden="true">
                  {reciterInitial(r)}
                </span>
                <span className="reciter-picker-sheet__meta">
                  <span className="reciter-picker-sheet__name">{r.nameAr}</span>
                  <span className="reciter-picker-sheet__sub">
                    {r.riwaya} · {r.qualityLabel}
                  </span>
                </span>
                {active ? <Check size={18} aria-hidden="true" className="reciter-picker-sheet__check" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {list.length === 0 ? (
        <p className="reciter-picker-sheet__empty" role="status">
          لا يتوفر قرّاء لهذا الوضع حالياً. قد يكون المصدر معطّلاً مؤقتاً.
        </p>
      ) : null}
    </AppBottomSheet>
  );
}
