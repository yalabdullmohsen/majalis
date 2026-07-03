import { useState } from "react";
import { getCurrentHijriInfo } from "@/lib/hijri-utils";

export function HijriSacredMonthBanner() {
  const [dismissed, setDismissed] = useState(false);
  const info = getCurrentHijriInfo();

  if (!info || !info.isSacred || !info.sacredInfo || dismissed) return null;

  const { sacredInfo, monthName, year } = info;

  return (
    <div
      role="banner"
      style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #78350f 100%)",
        color: "#fff",
        padding: "0.9rem 1.25rem",
        position: "relative",
        direction: "rtl",
        textAlign: "right",
      }}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إغلاق"
        style={{
          position: "absolute",
          top: "0.6rem",
          left: "0.75rem",
          background: "none",
          border: "none",
          color: "#a7f3d0",
          fontSize: "1.1rem",
          cursor: "pointer",
          lineHeight: 1,
          padding: "0.25rem",
        }}
      >
        ×
      </button>

      <p style={{ margin: "0 0 0.15rem", fontSize: "0.7rem", color: "#a7f3d0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        الشهر الحرام
      </p>
      <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem", fontWeight: 800 }}>
        🌙 {monthName} {year} هـ
      </h2>
      <p style={{ margin: "0 0 0.65rem", fontSize: "0.84rem", color: "#d1fae5", lineHeight: 1.6, maxWidth: "56rem" }}>
        {sacredInfo.virtue}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {sacredInfo.deeds.map((deed) => (
          <span
            key={deed}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(167,243,208,0.3)",
              borderRadius: "2rem",
              padding: "0.25rem 0.75rem",
              fontSize: "0.78rem",
              color: "#ecfdf5",
              whiteSpace: "nowrap",
            }}
          >
            {deed}
          </span>
        ))}
      </div>
    </div>
  );
}
