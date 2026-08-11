/**
 * تنبيه غير متطفل لمتابعة القراءة عبر الأجهزة.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import {
  applyCloudMushafPage,
  detectCrossDeviceMushafResume,
  mergeGuestStateToCloud,
  type CrossDeviceResumeHint,
} from "@/lib/guest-cloud-merge";
import { toArabicDigits } from "@/lib/utils";

export function CrossDeviceResumeToast() {
  const { user, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const [hint, setHint] = useState<CrossDeviceResumeHint | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setHint(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      await mergeGuestStateToCloud(user.id).catch(() => undefined);
      const next = await detectCrossDeviceMushafResume(user.id).catch(() => null);
      if (!cancelled) setHint(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id]);

  if (!hint) return null;

  return (
    <div
      className="cross-device-resume-toast"
      role="status"
      style={{
        position: "fixed",
        bottom: "calc(1rem + var(--inset-bottom))",
        insetInline: "1rem",
        zIndex: 80,
        maxWidth: "28rem",
        marginInline: "auto",
        padding: "0.85rem 1rem",
        borderRadius: "12px",
        background: "color-mix(in srgb, var(--background, #1a1a1a) 92%, transparent)",
        color: "var(--foreground, #f5f5f5)",
        boxShadow: "0 8px 28px rgba(0,0,0,.28)",
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        justifyContent: "space-between",
        direction: "rtl",
      }}
    >
      <button
        type="button"
        onClick={() => {
          void applyCloudMushafPage(hint.page).then(() => {
            setHint(null);
            navigate(hint.href);
          });
        }}
        style={{
          flex: 1,
          textAlign: "start",
          background: "transparent",
          border: 0,
          color: "inherit",
          cursor: "pointer",
          font: "inherit",
        }}
      >
        متابعة القراءة من {hint.sourceLabel} (صفحة {toArabicDigits(hint.page)}) — اضغط للانتقال
      </button>
      <button
        type="button"
        aria-label="إغلاق"
        onClick={() => setHint(null)}
        style={{
          background: "transparent",
          border: 0,
          color: "inherit",
          cursor: "pointer",
          opacity: 0.7,
          font: "inherit",
        }}
      >
        إغلاق
      </button>
    </div>
  );
}
