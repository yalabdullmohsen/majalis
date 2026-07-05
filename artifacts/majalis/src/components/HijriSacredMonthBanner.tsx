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
        background: "rgba(46,139,103,0.12)",
        borderBottom: "1px solid rgba(46,139,103,0.25)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.20)",
        borderRight: "4px solid var(--majalis-emerald, #2E8B67)",
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
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--majalis-emerald, #4ADE80)", whiteSpace: "nowrap" }}>
          {monthName} {year}هـ — الشهر الحرام
        </span>
        {firstDeed && (
          <>
            <span style={{ color: "var(--majalis-ink-muted, #9BA3B5)", fontSize: "0.75rem" }}>·</span>
            <span style={{ fontSize: "0.8rem", color: "var(--majalis-ink-soft, #C9C5B8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "30ch" }}>
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
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "6px",
          color: "var(--majalis-ink-muted, #9BA3B5)",
          fontSize: "0.8rem",
          cursor: "pointer",
          padding: "0.15rem 0.45rem",
          lineHeight: 1.4,
          flexShrink: 0,
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--majalis-ink)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--majalis-ink-muted)"; }}
      >
        ×
      </button>
    </div>
  );
}
