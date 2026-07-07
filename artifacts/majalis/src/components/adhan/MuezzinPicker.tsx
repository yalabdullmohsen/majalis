import { useEffect, useRef, useState } from "react";
import { MUEZZINS, previewAdhan, stopAdhan, type Muezzin } from "@/lib/adhan-audio";

const STYLE_COLOR: Record<string, string> = {
  "خاشع":    "var(--majalis-emerald, #2E8B67)",
  "رسمي":    "#60A5FA",
  "تقليدي":  "#A78BFA",
  "كلاسيكي": "var(--majalis-emerald, #2E8B67)",
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
    <div className="mzp-overlay" onClick={onClose}>
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
            const styleColor = STYLE_COLOR[m.style] ?? "var(--majalis-ink-soft)";
            return (
              <div
                key={m.id}
                className={`mzp-item${isSelected ? " mzp-item--selected" : ""}`}
                onClick={() => handleSelect(m.id)}
              >
                <div className={`mzp-radio${isSelected ? " mzp-radio--selected" : ""}`}>
                  {isSelected && <span className="mzp-check">✓</span>}
                </div>

                <div className="mzp-info">
                  <div className="mzp-name">{m.name}</div>
                  <div className="mzp-origin">
                    {m.origin}
                    <span
                      className="mzp-style-badge"
                      style={{ "--mzp-style-color": styleColor } as React.CSSProperties}
                    >
                      {m.style}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePreview(m); }}
                  className={`mzp-preview-btn${isPlaying ? " mzp-preview-btn--playing" : ""}`}
                  title={isPlaying ? "إيقاف" : "معاينة 15 ثانية"}
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
