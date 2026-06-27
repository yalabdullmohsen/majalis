import { C } from "@/lib/theme";

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <header className="ds-page-header">
      {eyebrow && <p className="ds-page-header__eyebrow">{eyebrow}</p>}
      <h1 className="ds-page-header__title">{title}</h1>
      {subtitle && <p className="ds-page-header__subtitle">{subtitle}</p>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`ui-card ds-card ${className}`.trim()}>{children}</div>;
}

export function Loading() {
  return (
    <div className="ds-empty" role="status" aria-live="polite">
      <div className="ds-skeleton" style={{ width: "2rem", height: "2rem", borderRadius: "50%", margin: "0 auto 0.75rem" }} />
      <p>جارٍ التحميل...</p>
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="ui-card ds-empty" role="alert">
      <p style={{ color: "#b91c1c", marginBottom: onRetry ? "0.75rem" : 0 }}>{text}</p>
      {onRetry && (
        <button type="button" className="ds-btn ds-btn--primary" onClick={onRetry}>
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="ds-empty">{text}</p>;
}

export function QaSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="qa-skeleton-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="qa-skeleton-item">
          <div className="qa-skeleton-line qa-skeleton-line--title ds-skeleton" />
          <div className="qa-skeleton-line qa-skeleton-line--meta ds-skeleton" />
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
          <div className="qa-skeleton-line qa-skeleton-line--title ds-skeleton" />
          <div className="qa-skeleton-line qa-skeleton-line--chip ds-skeleton" />
        </div>
      ))}
    </div>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ds-btn ds-btn--sm ${active ? "ds-btn--primary" : "ds-btn--ghost"}`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

/** @deprecated inline C still exported for legacy admin panels */
export { C };
