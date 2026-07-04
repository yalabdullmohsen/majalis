import { C } from "@/lib/theme";

/* ── Skeleton primitives ── */

/** خط نص واحد بعرض قابل للتخصيص */
export function SkeletonLine({ width = "100%", height = "0.75rem" }: { width?: string; height?: string }) {
  return <div className="ds-skeleton" style={{ width, height }} aria-hidden="true" />;
}

/** بطاقة هيكلية: صورة + عنوان + سطرا نص */
export function SkeletonCard() {
  return (
    <div className="sk-card" aria-hidden="true">
      <div className="ds-skeleton sk-card__thumb" />
      <div className="sk-card__body">
        <div className="ds-skeleton sk-card__title" />
        <div className="ds-skeleton sk-card__line" />
        <div className="ds-skeleton sk-card__line sk-card__line--short" />
      </div>
    </div>
  );
}

/** شبكة بطاقات هيكلية */
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="sk-card-grid" aria-hidden="true" role="status" aria-label="جارٍ التحميل">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

/** جدول هيكلي: رأس + صفوف */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="sk-table" aria-hidden="true" role="status">
      <div className="sk-table__head">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="ds-skeleton sk-table__cell sk-table__cell--head" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="sk-table__row">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="ds-skeleton sk-table__cell" style={{ width: c === 0 ? "45%" : "15%" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** حالة تحميل صفحة كاملة — عمود من الأسطر الهيكلية */
export function SkeletonPage() {
  return (
    <div className="sk-page" role="status" aria-label="جارٍ التحميل" aria-live="polite">
      <div className="ds-skeleton sk-page__title" />
      <div className="ds-skeleton sk-page__subtitle" />
      <SkeletonCardGrid count={6} />
    </div>
  );
}

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
