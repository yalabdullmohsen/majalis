import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { QA_ROUTES } from "@/lib/question-answer/routes";
import { healthLabel, type ActivationHealth } from "@/lib/sin-jeem/activation-state";
import { useActivationState } from "@/lib/sin-jeem/activation-provider";

const HEALTH_STYLES: Record<
  ActivationHealth,
  { border: string; background: string; accent: string }
> = {
  READY: {
    border: "rgba(22,101,52,0.35)",
    background: "linear-gradient(135deg, rgba(236,253,245,0.95) 0%, rgba(209,250,229,0.85) 100%)",
    accent: "var(--majalis-emerald-deep)",
  },
  FALLBACK: {
    border: "rgba(59,130,246,0.35)",
    background: "linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(219,234,254,0.85) 100%)",
    accent: "#1d4ed8",
  },
  DEGRADED: {
    border: "rgba(176,141,46,0.45)",
    background: "linear-gradient(135deg, rgba(255,251,235,0.95) 0%, rgba(254,243,199,0.85) 100%)",
    accent: "var(--majalis-brass-deep)",
  },
  OFFLINE: {
    border: "rgba(185,28,28,0.35)",
    background: "linear-gradient(135deg, rgba(254,242,242,0.95) 0%, rgba(254,226,226,0.85) 100%)",
    accent: "#b91c1c",
  },
};

export function ActivationStatusBanner() {
  const { isAdmin } = useAuth();
  const {
    loading,
    health,
    statusTitle,
    statusMessage,
    showActivationInstructions,
    refresh,
  } = useActivationState();

  // READY with questions: no banner (no false warnings)
  if (loading || health === "READY" || (!statusTitle && !showActivationInstructions)) {
    return null;
  }

  const styles = HEALTH_STYLES[health];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginBottom: "1.25rem",
        padding: "1rem 1.1rem",
        borderRadius: "0.75rem",
        border: `1px solid ${styles.border}`,
        background: styles.background,
        color: "var(--majalis-ink)",
        lineHeight: 1.6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            padding: "0.15rem 0.5rem",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.65)",
            color: styles.accent,
          }}
        >
          {healthLabel(health)}
        </span>
        {statusTitle && (
          <strong style={{ color: styles.accent, fontSize: "0.9375rem" }}>{statusTitle}</strong>
        )}
      </div>
      {statusMessage && <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem" }}>{statusMessage}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {(health === "DEGRADED" || health === "OFFLINE" || showActivationInstructions) && (
          <button type="button" className="sj-cta-secondary" onClick={() => void refresh()} disabled={loading}>
            إعادة المحاولة
          </button>
        )}
        {isAdmin && showActivationInstructions && (
          <>
            <Link
              href={QA_ROUTES.admin}
              className="sj-cta-secondary"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              فتح لوحة الإدارة
            </Link>
            <Link
              href="/admin/platform/health"
              className="sj-cta-secondary"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              عرض حالة التفعيل
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
