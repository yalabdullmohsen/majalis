import { Link } from "wouter";
import { QA_DISPLAY_NAME, QA_ROUTES } from "@/lib/question-answer/routes";

type Props = {
  dbAvailable: boolean;
  loading: boolean;
  onRetry: () => void;
};

export function DbActivationBanner({ dbAvailable, loading, onRetry }: Props) {
  if (loading || dbAvailable) return null;

  return (
    <div
      role="status"
      style={{
        marginBottom: "1.25rem",
        padding: "1rem 1.1rem",
        borderRadius: "0.75rem",
        border: "1px solid rgba(176,141,46,0.45)",
        background: "linear-gradient(135deg, rgba(255,251,235,0.95) 0%, rgba(254,243,199,0.85) 100%)",
        color: "var(--majalis-ink)",
        lineHeight: 1.6,
      }}
    >
      <strong style={{ display: "block", marginBottom: "0.35rem", color: "var(--majalis-emerald-deep)" }}>
        {QA_DISPLAY_NAME} — اللعبة جاهزة
      </strong>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem" }}>
        اللعبة جاهزة، وتحتاج تفعيل قاعدة البيانات لإظهار الأسئلة والنتائج على الإنتاج. يمكنك اللعب محلياً من
        بنك الأسئلة المدمج حتى يكتمل التفعيل.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <button type="button" className="sj-cta-secondary" onClick={onRetry} disabled={loading}>
          إعادة المحاولة
        </button>
        <Link href="/" className="sj-cta-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          العودة للرئيسية
        </Link>
        <Link href={QA_ROUTES.admin} className="sj-cta-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          فتح لوحة الإدارة
        </Link>
        <Link href="/admin/platform/health" className="sj-cta-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          عرض حالة التفعيل
        </Link>
      </div>
    </div>
  );
}
