import { useState } from "react";
import { MUEZZINS, previewAdhan, stopAdhan, type Muezzin } from "@/lib/adhan-audio";

const STYLE_COLOR: Record<string, string> = {
  "خاشع":    "#065f46",
  "رسمي":    "#1d4ed8",
  "تقليدي":  "#7c3aed",
  "كلاسيكي": "#92400e",
};

type Props = {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function MuezzinPicker({ selected, onSelect, onClose }: Props) {
  const [previewing, setPreviewing] = useState<string | null>(null);

  function handlePreview(m: Muezzin) {
    if (previewing === m.id) {
      stopAdhan();
      setPreviewing(null);
      return;
    }
    const audio = previewAdhan(m);
    setPreviewing(m.id);
    audio.addEventListener("ended", () => setPreviewing(null));
    // Timeout safety
    setTimeout(() => setPreviewing((p) => p === m.id ? null : p), 16_000);
  }

  function handleSelect(id: string) {
    stopAdhan();
    setPreviewing(null);
    onSelect(id);
    onClose();
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 3000,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    }} onClick={onClose}>
      <div
        style={{
          background: "#fff",
          borderRadius: "1.25rem 1.25rem 0 0",
          width: "min(100vw, 540px)",
          maxHeight: "82vh",
          overflowY: "auto",
          direction: "rtl",
          padding: "0 0 2rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "#e5e7eb" }} />
        </div>

        <div style={{ padding: "1rem 1.25rem 0.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#134a3a" }}>
            اختر المؤذن
          </h3>
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#6b7280" }}>
            اضغط ▶ للمعاينة • اضغط الاسم للاختيار
          </p>
        </div>

        <div style={{ padding: "0.5rem 1rem" }}>
          {MUEZZINS.map((m) => {
            const isSelected = selected === m.id;
            const isPlaying = previewing === m.id;
            const styleColor = STYLE_COLOR[m.style] ?? "#374151";
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "0.75rem",
                  marginBottom: "0.4rem",
                  background: isSelected ? "#f0fdf4" : "#fafafa",
                  border: `1.5px solid ${isSelected ? "#134a3a" : "#f3f4f6"}`,
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onClick={() => handleSelect(m.id)}
              >
                {/* Selection indicator */}
                <div style={{
                  width: 18, height: 18,
                  borderRadius: "50%",
                  border: `2px solid ${isSelected ? "#134a3a" : "#d1d5db"}`,
                  background: isSelected ? "#134a3a" : "transparent",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <span style={{ color: "#fff", fontSize: "0.6rem" }}>✓</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: "0.73rem", color: "#6b7280", marginTop: "0.1rem" }}>
                    {m.origin}
                    <span style={{
                      marginRight: "0.5rem",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "999px",
                      fontSize: "0.68rem",
                      background: `${styleColor}18`,
                      color: styleColor,
                      fontWeight: 600,
                    }}>
                      {m.style}
                    </span>
                  </div>
                </div>

                {/* Preview button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePreview(m); }}
                  style={{
                    flexShrink: 0,
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "none",
                    background: isPlaying ? "#ef4444" : "#134a3a",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s",
                  }}
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
