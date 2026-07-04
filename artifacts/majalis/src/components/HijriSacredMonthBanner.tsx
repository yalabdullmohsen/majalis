import { useState } from "react";
import { getCurrentHijriInfo } from "@/lib/hijri-utils";

export function HijriSacredMonthBanner() {
  const [dismissed, setDismissed] = useState(false);
  const info = getCurrentHijriInfo();

  if (!info || !info.isSacred || !info.sacredInfo || dismissed) return null;

  const { sacredInfo, monthName, year } = info;
  const firstDeed = sacredInfo.deeds[0] || "";

  return (
    <div
      role="banner"
      style={{
        background: "#fff",
        borderBottom: "1px solid #d1fae5",
        boxShadow: "0 2px 8px rgba(6,78,59,0.08)",
        borderRight: "4px solid #059669",
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
        padding: "0.6rem 1rem",
        direction: "rtl",
        minHeight: 0,
      }}
    >
      <span style={{ fontSize: "1rem", flexShrink: 0, lineHeight: 1 }}>🌙</span>

      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.25rem 0.5rem" }}>
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#065f46", whiteSpace: "nowrap" }}>
          {monthName} {year}هـ — الشهر الحرام
        </span>
        {firstDeed && (
          <>
            <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>·</span>
            <span style={{ fontSize: "0.8rem", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "30ch" }}>
              {firstDeed}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إغلاق"
        style={{
          background: "none",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          color: "#9ca3af",
          fontSize: "0.8rem",
          cursor: "pointer",
          padding: "0.15rem 0.45rem",
          lineHeight: 1.4,
          flexShrink: 0,
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#9ca3af"; (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
      >
        ×
      </button>
    </div>
  );
}
