import { C } from "@/lib/theme";

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <header className="page-header calm-header">
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </header>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: "0.375rem", border: `1px solid ${C.line}`, padding: "1.25rem", background: C.panel }}>
      {children}
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 0" }} role="status" aria-live="polite">
      <p style={{ color: C.inkSoft, marginBottom: "0.75rem" }}>جارٍ التحميل...</p>
      <div style={{ width: "2rem", height: "2rem", margin: "0 auto", border: `3px solid ${C.line}`, borderTopColor: C.emerald, borderRadius: "50%", animation: "majalis-spin 0.8s linear infinite" }} />
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchmentDeep }}>
      <p style={{ color: "#b91c1c", marginBottom: onRetry ? "1rem" : 0 }} role="alert">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
export function Empty({ text }: { text: string }) {
  return <p style={{ textAlign: "center", padding: "2.5rem 0", color: C.inkSoft }}>{text}</p>;
}

export function QaSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="qa-skeleton-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="qa-skeleton-item">
          <div className="qa-skeleton-line qa-skeleton-line--title" />
          <div className="qa-skeleton-line qa-skeleton-line--meta" />
        </div>
      ))}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="qa-skeleton-list" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="qa-skeleton-item qa-skeleton-item--row">
          <div className="qa-skeleton-line qa-skeleton-line--title" />
          <div className="qa-skeleton-line qa-skeleton-line--chip" />
        </div>
      ))}
    </div>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={
        active
          ? { fontSize: "0.875rem", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.emerald}`, background: C.emerald, color: C.parchment, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }
          : { fontSize: "0.875rem", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, color: C.inkSoft, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }
      }
    >
      {children}
    </button>
  );
}
