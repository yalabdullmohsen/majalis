import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
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
 * شيت سفلي لاختيار القارئ — بحث + تمييز الحالي + ألوان المصحف فوق شيت الآية.
 */
export function ReciterPickerSheet({
  open,
  onClose,
  reciterId,
  onSelect,
  mode = "ayah",
}: Props) {
  const [query, setQuery] = useState("");
  const list = getSelectableReciters(mode);
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return list;
    return list.filter((r) => r.nameAr.includes(q) || r.id.includes(q));
  }, [list, query]);

  return (
    <AppBottomSheet
      open={open}
      onClose={() => {
        setQuery("");
        onClose();
      }}
      title="اختر القارئ"
      snap="half"
      elevated
      className="reciter-picker-sheet"
    >
      <label className="reciter-picker-sheet__search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن قارئ…"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="بحث عن قارئ"
        />
      </label>
      <ul className="reciter-picker-sheet__list" role="listbox" aria-label="قائمة القرّاء">
        {filtered.map((r) => {
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
                  setQuery("");
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
                {active ? (
                  <Check size={18} aria-hidden="true" className="reciter-picker-sheet__check" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 ? (
        <p className="reciter-picker-sheet__empty" role="status">
          لا نتائج مطابقة. جرّب اسمًا آخر أو أعد تعيين البحث.
        </p>
      ) : null}
    </AppBottomSheet>
  );
}
