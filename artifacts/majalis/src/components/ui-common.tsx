import { AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { C } from "@/lib/theme";
import type { ShariaRulingExtended } from "@/lib/rulings-types";

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
    <div role="status" aria-busy="true" aria-live="polite" aria-label="تجهيز المحتوى">
      <div className="sk-card-grid" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

/** جدول هيكلي: رأس + صفوف */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" aria-label="تجهيز المحتوى">
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
    <div role="status" aria-busy="true" aria-live="polite" aria-label="تجهيز المحتوى">
      {title ? <h1 className="page-status-shell__title">{title}</h1> : null}
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
export {
  FilterBar,
  FilterChip,
  FilterSheet,
  FilterToggle,
  SegmentedFilter,
  ActiveFilters,
  FilterResetButton,
} from "@/components/filters";
export { HubCard } from "@/components/ui/HubCard";

export function Loading({ title }: { label?: string; title?: string } = {}) {
  return <SkeletonPage title={title} />;
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
  role?: "tab" | "button" | "radio";
}) {
  const isTab = role === "tab";
  const isRadio = role === "radio";
  return (
    <button
      type="button"
      role={role}
      onClick={onClick}
      className={`ds-btn ds-btn--sm ${active ? "ds-btn--primary" : "ds-btn--ghost"} ${className}`.trim()}
      aria-pressed={!isTab && !isRadio ? Boolean(active) : undefined}
      aria-selected={isTab ? Boolean(active) : undefined}
      aria-checked={isRadio ? Boolean(active) : undefined}
    >
      {children}
    </button>
  );
}

/** فاصل زخرفي موحّد — وضع CSS (افتراضي) أو SVG بعرض صريح */
export function IslamicDivider({
  className = "",
  size = 28,
  width,
  color = "currentColor",
  opacity = 0.35,
}: {
  className?: string;
  size?: number;
  width?: number;
  color?: string;
  opacity?: number;
}) {
  if (width != null) {
    const h = 24;
    const cx = width / 2;
    const cy = h / 2;
    const r = 7;
    const pts = Array.from({ length: 8 }, (_, i) => {
      const outerA = (i * Math.PI) / 4 - Math.PI / 8;
      const innerA = (i * Math.PI) / 4 + Math.PI / 8;
      const ri = r * 0.4;
      return [
        `${cx + r * Math.cos(outerA)},${cy + r * Math.sin(outerA)}`,
        `${cx + ri * Math.cos(innerA)},${cy + ri * Math.sin(innerA)}`,
      ].join(" ");
    }).join(" ");
    return (
      <svg
        width={width}
        height={h}
        viewBox={`0 0 ${width} ${h}`}
        aria-hidden="true"
        className={className}
        style={{ opacity }}
        role="presentation"
      >
        <polygon points={pts} fill={color} />
        <line x1={0} y1={cy} x2={cx - r - 10} y2={cy} stroke={color} strokeWidth={0.8} />
        <line x1={cx + r + 10} y1={cy} x2={width} y2={cy} stroke={color} strokeWidth={0.8} />
        {[-1, 1].map((side) => {
          const x = cx + side * (r + 22);
          return (
            <polygon
              key={side}
              points={`${x},${cy - 3} ${x + 4},${cy} ${x},${cy + 3} ${x - 4},${cy}`}
              fill={color}
            />
          );
        })}
      </svg>
    );
  }

  return (
    <div className={`islamic-divider ${className}`.trim()} aria-hidden="true">
      <span className="islamic-divider__line" />
      <span className="islamic-divider__ornament">
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16 3 L18.5 13.5 L29 16 L18.5 18.5 L16 29 L13.5 18.5 L3 16 L13.5 13.5 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M16 3 L18.5 13.5 L29 16 L18.5 18.5 L16 29 L13.5 18.5 L3 16 L13.5 13.5 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            transform="rotate(45 16 16)"
            opacity="0.6"
          />
          <circle cx="16" cy="16" r="2.5" fill="currentColor" opacity="0.7" />
        </svg>
      </span>
      <span className="islamic-divider__line" />
    </div>
  );
}

/** بطاقة حكم شرعي — مصدر الحقيقة لقوائم الموسوعة */
export function RulingCard({ ruling }: { ruling: ShariaRulingExtended }) {
  return (
    <Link href={`/rulings/${ruling.id}`} className="ruling-card ui-card">
      <div className="ruling-card__head">
        <span className="ruling-card__category">{ruling.category}</span>
        {ruling.subcategory && <span className="ruling-card__sub">{ruling.subcategory}</span>}
      </div>
      <h2 className="ruling-card__title">{ruling.title}</h2>
      {ruling.summary && <p className="ruling-card__summary">{ruling.summary}</p>}
      <div className="ruling-card__meta">
        {ruling.prevailing_view && <span className="ruling-card__badge">{ruling.prevailing_view}</span>}
        {(ruling.view_count ?? 0) > 0 && <span>{ruling.view_count} مشاهدة</span>}
        {(ruling.importance_score ?? 0) >= 75 && <span className="ruling-card__important">مهم</span>}
      </div>
      {ruling.keywords && ruling.keywords.length > 0 && (
        <div className="ruling-card__tags">
          {ruling.keywords.slice(0, 4).map((k) => (
            <span key={k} className="ruling-card__tag">
              {k}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

/** @deprecated inline C still exported for legacy admin panels */
export { C };
