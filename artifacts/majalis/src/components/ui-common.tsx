import { AlertTriangle, RefreshCw } from "lucide-react";
import { C } from "@/lib/theme";

/* ── Skeleton primitives ── */

/** خط نص واحد بعرض قابل للتخصيص */
export function SkeletonLine({ width = "100%", height = "0.75rem" }: { width?: string; height?: string }) {
  return <div className="ds-skeleton ds-skeleton--line" style={{ "--sk-w": width, "--sk-h": height } as React.CSSProperties} aria-hidden="true" />;
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
              <div key={c} className={`ds-skeleton sk-table__cell${c === 0 ? " sk-table__cell--wide" : ""}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** حالة تحميل صفحة تفصيلية — مقال أو محتوى مفرد */
export function SkeletonPage({ title }: { title?: string } = {}) {
  return (
    <div role="status" aria-live="polite">
      {title ? <h1 className="page-status-shell__title">{title}</h1> : null}
      <span className="sr-only">جارٍ التحميل…</span>
      <div className="sk-page sk-page--article" aria-hidden="true">
        <div className="ds-skeleton sk-page__meta" />
        <div className="ds-skeleton sk-page__title" />
        <div className="ds-skeleton sk-page__subtitle" />
        <div className="ds-skeleton sk-page__divider" />
        {[95, 88, 93, 75, 82].map((w, i) => (
          <div key={i} className="ds-skeleton sk-page__line"
            style={{ "--sk-lw": `${w}%` } as React.CSSProperties}
          />
        ))}
        <div className="ds-skeleton sk-page__line sk-page__line--section" />
        {[90, 83, 96, 60].map((w, i) => (
          <div key={i} className="ds-skeleton sk-page__line"
            style={{ "--sk-lw": `${w}%` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

export { PageHeader, Card, ListRow, Button as MjButton, Badge, Progress, SearchField, EmptyState } from "@/components/ui/mj";
export { PageHero } from "@/components/ui/PageHero";
export { PatternBackdrop } from "@/components/ui/PatternBackdrop";
export { FilterChips } from "@/components/ui/FilterChips";
export { HubCard } from "@/components/ui/HubCard";

export function Loading({ label = "جارٍ التحميل…", title }: { label?: string; title?: string } = {}) {
  return (
    <div className="ds-empty ds-loading-wrap" role="status" aria-live="polite" aria-label={label}>
      {title ? <h1 className="page-status-shell__title">{title}</h1> : null}
      <IslamicLoaderInline />
      <p className="ds-loading-label">{label}</p>
    </div>
  );
}

/** هيكل صفحة مبكر (تحميل / يطلب تسجيل دخول) مع h1 دلالي ثابت */
export function PageStatusShell({
  title,
  children,
  className = "page-shell narrow",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className} dir="rtl">
      <h1 className="page-status-shell__title">{title}</h1>
      {children}
    </div>
  );
}

function IslamicLoaderInline() {
  const size = 44;
  const cx = size / 2;
  const pts = star8Pts(cx, cx, size * 0.43, size * 0.22);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true"
      className="ds-loader-svg">
      <polygon points={pts} fill="none" stroke="var(--majalis-emerald,var(--mj-brand-deep))" strokeWidth="1.6"
        strokeLinejoin="round" opacity="0.85" />
      <circle cx={cx} cy={cx} r={size * 0.09} fill="var(--majalis-emerald,var(--mj-brand-deep))" opacity="0.6" />
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
    <div className="adv-error-state" role="alert" aria-live="assertive" dir="rtl">
      <AlertTriangle size={28} strokeWidth={1.5} className="adv-error-state__icon" aria-hidden="true" />
      <p className="adv-error-state__msg">{text}</p>
      {onRetry && (
        <button type="button" className="adv-error-state__retry" onClick={onRetry} aria-label="إعادة المحاولة">
          <RefreshCw size={14} aria-hidden="true" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function Empty({ text, title }: { text: string; title?: string }) {
  return (
    <div className="ds-empty" role="status" aria-live="polite">
      {title ? <h2>{title}</h2> : null}
      <p className="ds-empty__text">{text}</p>
    </div>
  );
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

export function Chip({
  active,
  children,
  onClick,
  className = "",
  role,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  role?: "tab" | "button";
}) {
  return (
    <button
      type="button"
      role={role}
      onClick={onClick}
      className={`ds-btn ds-btn--sm ${active ? "ds-btn--primary" : "ds-btn--ghost"} ${className}`.trim()}
      aria-pressed={active}
      aria-selected={role === "tab" ? Boolean(active) : undefined}
    >
      {children}
    </button>
  );
}

/** @deprecated inline C still exported for legacy admin panels */
export { C };
