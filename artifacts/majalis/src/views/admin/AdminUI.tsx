import { Component, type ErrorInfo, type ReactNode } from "react";
import { buildErrorReport, createErrorId, logClientError } from "@/lib/error-report";

/* ─── شارة الحالة الموحّدة ──────────────────────────────────────────────
   توحّد عرض حالة عناصر المحتوى عبر كل الأقسام:
   بانتظار المراجعة / موثّق / مرفوض / مسودة / منشور. */

type BadgeVariant = "pending" | "approved" | "rejected" | "draft" | "published" | "neutral";

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  // بانتظار المراجعة
  pending: { variant: "pending", label: "بانتظار المراجعة" },
  pending_review: { variant: "pending", label: "بانتظار المراجعة" },
  needs_review: { variant: "pending", label: "يحتاج مراجعة" },
  in_review: { variant: "pending", label: "قيد المراجعة" },
  // موثّق / معتمد
  approved: { variant: "approved", label: "موثّق" },
  verified: { variant: "approved", label: "موثّق" },
  published: { variant: "published", label: "منشور" },
  featured: { variant: "approved", label: "مميّز" },
  // مرفوض
  rejected: { variant: "rejected", label: "مرفوض" },
  archived: { variant: "rejected", label: "مؤرشف" },
  // مسودة
  draft: { variant: "draft", label: "مسودة" },
};

export function StatusBadge({ status, label }: { status: string | null | undefined; label?: string }) {
  const key = (status ?? "").toString().trim().toLowerCase();
  const entry = STATUS_MAP[key] ?? { variant: "neutral" as BadgeVariant, label: label ?? (status || "—") };
  return (
    <span className={`admin-badge admin-badge--${entry.variant}`}>
      {label ?? entry.label}
    </span>
  );
}

/* ─── حاجز أخطاء على مستوى القسم ─────────────────────────────────────────
   يعزل انهيار أي قسم عن بقية اللوحة ويعرض بطاقة إعادة محاولة بدل
   إسقاط لوحة التحكم بالكامل. يُعاد ضبطه تلقائياً عند تغيّر resetKey. */

type BoundaryProps = { name: string; resetKey?: string; children: ReactNode };
type BoundaryState = { error: Error | null; errorId: string };

export class AdminSectionBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, errorId: "" };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error, errorId: createErrorId("ADM") };
  }

  componentDidUpdate(prev: BoundaryProps) {
    // تغيّر القسم → امسح الخطأ حتى لا يبقى عالقاً عند التنقّل
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null, errorId: "" });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void logClientError(
      buildErrorReport(error, {
        errorId: this.state.errorId || createErrorId("ADM"),
        componentStack: info.componentStack,
        section: this.props.name,
        component: this.props.name,
      }),
    );
  }

  reset = () => this.setState({ error: null, errorId: "" });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="admin-section-error" role="alert">
        <h2>تعذّر عرض هذا القسم</h2>
        <p>
          حدث خلل أثناء تحميل القسم. يمكنك إعادة المحاولة أو الانتقال لقسم آخر.
          {this.state.errorId && <><br />رقم التتبع: <code>{this.state.errorId}</code></>}
        </p>
        <button type="button" onClick={this.reset}>إعادة المحاولة</button>
      </div>
    );
  }
}
