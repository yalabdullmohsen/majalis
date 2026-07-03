import { useEffect, useState } from "react";
import type { EarnedBadge } from "@/lib/user-profile-service";

type Props = {
  badges: EarnedBadge[];
  onDismiss: () => void;
};

export function AchievementToast({ badges, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const badge = badges[0];

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 350);
    }, 4500);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, [onDismiss]);

  if (!badge) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        insetInlineEnd: "1.5rem",
        zIndex: 9999,
        maxWidth: "22rem",
        width: "calc(100vw - 3rem)",
        background: "linear-gradient(135deg, #064e3b, #065f46)",
        color: "#fff",
        borderRadius: "0.75rem",
        padding: "1rem 1.25rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        display: "flex",
        gap: "0.9rem",
        alignItems: "flex-start",
        transition: "opacity 0.35s, transform 0.35s",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(1.5rem)",
      }}
    >
      <span style={{ fontSize: "2rem", lineHeight: 1, flexShrink: 0 }}>{badge.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 0.2rem", fontSize: "0.7rem", color: "#a7f3d0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          إنجاز جديد
        </p>
        <p style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 800 }}>{badge.titleAr}</p>
        {badge.descAr && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#d1fae5", lineHeight: 1.5 }}>{badge.descAr}</p>
        )}
        {badges.length > 1 && (
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#a7f3d0" }}>
            +{badges.length - 1} إنجازات أخرى
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => { setVisible(false); setTimeout(onDismiss, 350); }}
        aria-label="إغلاق"
        style={{
          background: "none",
          border: "none",
          color: "#a7f3d0",
          cursor: "pointer",
          fontSize: "1.1rem",
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
