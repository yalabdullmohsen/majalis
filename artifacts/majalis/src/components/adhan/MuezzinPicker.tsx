import { useEffect, useRef, useState } from "react";
import { MUEZZINS, previewAdhan, stopAdhan, type Muezzin } from "@/lib/adhan-audio";

const STYLE_MOD: Record<string, string> = {
  "خاشع":    "mzp-style--emerald",
  "رسمي":    "mzp-style--blue",
  "تقليدي":  "mzp-style--purple",
  "كلاسيكي": "mzp-style--emerald",
};

type Props = {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function MuezzinPicker({ selected, onSelect, onClose }: Props) {
  const [previewing, setPreviewing] = useState<string | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    stopAdhan();
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
  }, []);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [onClose]);

  function handlePreview(m: Muezzin) {
    if (previewing === m.id) {
      stopAdhan();
      setPreviewing(null);
      return;
    }
    const audio = previewAdhan(m);
    setPreviewing(m.id);
    audio.addEventListener("ended", () => setPreviewing(null), { once: true });
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => setPreviewing((p) => p === m.id ? null : p), 16_000);
  }

  function handleSelect(id: string) {
    stopAdhan();
    setPreviewing(null);
    onSelect(id);
    onClose();
  }

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) — مسار وصول
    // بديل كامل بلوحة المفاتيح.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="mzp-overlay" onClick={onClose}>
      {/* onClick هنا لمنع انتشار النقر للخلفية فقط — لا إجراء مستقل يحتاج مكافئ لوحة مفاتيح. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="mzp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mzp-handle-row">
          <div className="mzp-handle" />
        </div>

        <div className="mzp-header">
          <h3 className="mzp-title">اختر المؤذن</h3>
          <p className="mzp-subtitle">اضغط ▶ للمعاينة • اضغط الاسم للاختيار</p>
        </div>

        <div className="mzp-list">
          {MUEZZINS.map((m) => {
            const isSelected = selected === m.id;
            const isPlaying = previewing === m.id;
            const styleMod = STYLE_MOD[m.style] ?? "";
            return (
              <div
                key={m.id}
                className={`mzp-item${isSelected ? " mzp-item--selected" : ""}`}
                onClick={() => handleSelect(m.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`اختيار المؤذن ${m.name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(m.id);
                  }
                }}
              >
                <div className={`mzp-radio${isSelected ? " mzp-radio--selected" : ""}`}>
                  {isSelected && <span className="mzp-check">✓</span>}
                </div>

                <div className="mzp-info">
                  <div className="mzp-name">{m.name}</div>
                  <div className="mzp-origin">
                    {m.origin}
                    <span className={`mzp-style-badge ${styleMod}`}>
                      {m.style}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePreview(m); }}
                  className={`mzp-preview-btn${isPlaying ? " mzp-preview-btn--playing" : ""}`}
                  aria-label={isPlaying ? "إيقاف معاينة الأذان" : "معاينة الأذان (15 ثانية)"}
                >
                  {isPlaying ? "⏹" : "▶"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
