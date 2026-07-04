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
    <div role="status" aria-label="جارٍ التحميل" aria-live="polite">
      <span className="sr-only">جارٍ التحميل…</span>
      <div className="sk-card-grid" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

/** جدول هيكلي: رأس + صفوف */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="جارٍ التحميل" aria-live="polite">
      <span className="sr-only">جارٍ التحميل…</span>
      <div className="sk-table" aria-hidden="true">
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
    </div>
  );
}

/** حالة تحميل صفحة كاملة — عمود من الأسطر الهيكلية */
export function SkeletonPage() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">جارٍ التحميل…</span>
      <div className="sk-page" aria-hidden="true">
        <div className="ds-skeleton sk-page__title" />
        <div className="ds-skeleton sk-page__subtitle" />
        <div className="sk-card-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <header className="ds-page-header" dir="rtl">
      {eyebrow && <p className="ds-page-header__eyebrow">{eyebrow}</p>}
      <h1 className="ds-page-header__title">{title}</h1>
      {subtitle && <p className="ds-page-header__subtitle">{subtitle}</p>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`ui-card ds-card ${className}`.trim()}>{children}</div>;
}

export function Loading({ label = "جارٍ التحميل…" }: { label?: string } = {}) {
  return (
    <div className="ds-empty" role="status" aria-live="polite" aria-label={label}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.875rem", padding: "2.5rem 1rem" }}>
      <IslamicLoaderInline />
      <p style={{ fontSize: "0.85rem", color: "var(--v2-ink-3, #8A847E)", margin: 0 }}>{label}</p>
    </div>
  );
}

function IslamicLoaderInline() {
  const size = 44;
  const cx = size / 2;
  const pts = star8Pts(cx, cx, size * 0.43, size * 0.22);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true"
      style={{ display: "block", animation: "ui-common-rotate 2s linear infinite", flexShrink: 0 }}>
      <style>{`@keyframes ui-common-rotate{to{transform:rotate(360deg)}}
        @media(prefers-reduced-motion:reduce){svg[aria-hidden]{animation:none!important}}`}</style>
      <polygon points={pts} fill="none" stroke="var(--v2-green,#1F6F52)" strokeWidth="1.6"
        strokeLinejoin="round" opacity="0.85" />
      <circle cx={cx} cy={cx} r={size * 0.09} fill="var(--v2-green,#1F6F52)" opacity="0.6" />
    </svg>
  );
}

function star8Pts(cx: number, cy: number, r1: number, r2: number) {
  return Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
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
