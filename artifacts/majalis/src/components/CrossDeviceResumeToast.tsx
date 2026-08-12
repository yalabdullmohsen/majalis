import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { loadLastPageSync } from "@/lib/quran-last-page";

type ResumeHint = {
  page: number;
  title: string;
  href: string;
  deviceLabel: string;
};

/**
 * Non-intrusive cross-device reading continuity toast.
 * Shows when cloud resume mushaf page differs from local last page.
 */
export function CrossDeviceResumeToast() {
  const { user, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();
  const [hint, setHint] = useState<ResumeHint | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const { getResumeItems } = await import("@/lib/user-profile-service");
        const items = await getResumeItems(user.id);
        const mushaf = items.find((i) => i.content_type === "mushaf_page");
        if (!mushaf || cancelled) return;
        const cloudPage = Math.floor(
          Number(
            (typeof mushaf.position === "object" && mushaf.position
              ? (mushaf.position as { item_index?: number }).item_index
              : mushaf.position) ||
              mushaf.content_id ||
              0,
          ),
        );
        if (cloudPage < 1 || cloudPage > 604) return;
        const local = loadLastPageSync();
        if (local != null && local === cloudPage) return;
        // Dismiss key per user+page
        const dismissKey = `majalis-resume-toast-dismiss:${user.id}:${cloudPage}`;
        try {
          if (sessionStorage.getItem(dismissKey) === "1") return;
        } catch {
          /* ignore */
        }
        setHint({
          page: cloudPage,
          title: mushaf.content_title || `صفحة ${cloudPage}`,
          href: mushaf.content_url || `/mushaf?page=${cloudPage}`,
          deviceLabel: "جهاز آخر",
        });
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id]);

  if (!hint) return null;

  function dismiss() {
    try {
      if (user?.id) {
        sessionStorage.setItem(`majalis-resume-toast-dismiss:${user.id}:${hint!.page}`, "1");
      }
    } catch {
      /* ignore */
    }
    setHint(null);
  }

  return (
    <div
      className="cross-device-resume-toast"
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        zIndex: 70,
        insetInline: "1rem",
        bottom: "calc(1rem + var(--inset-bottom))",
        maxWidth: "22rem",
        marginInline: "auto",
        left: 0,
        right: 0,
        background: "var(--mj-brand-deep, #173d35)",
        color: "#fff",
        borderRadius: "0.85rem",
        padding: "0.75rem 0.9rem",
        boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
        fontSize: "0.85rem",
        lineHeight: 1.45,
      }}
    >
      <p style={{ margin: 0 }}>
        متابعة القراءة من {hint.deviceLabel} (صفحة {hint.page}) — اضغط للانتقال
      </p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => {
            dismiss();
            navigate(hint.href);
          }}
          style={{
            flex: 1,
            border: "none",
            borderRadius: "0.55rem",
            padding: "0.45rem 0.6rem",
            background: "#fff",
            color: "var(--mj-brand-deep, #173d35)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          الانتقال
        </button>
        <button
          type="button"
          onClick={dismiss}
          style={{
            border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: "0.55rem",
            padding: "0.45rem 0.6rem",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
}
