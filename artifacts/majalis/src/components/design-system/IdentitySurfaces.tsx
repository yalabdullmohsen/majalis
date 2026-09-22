/**
 * CompactNavigationCard — بدون نشر props غريبة على Link.
 */
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { CardTitle, SupportingText, Caption } from "@/components/design-system/text";
import "@/styles/sunnah-identity-cards.css";

export type CompactNavigationCardProps = {
  href: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  onNavigate?: () => void;
};

/** صف تنقّل مضغوط — أيقونة · عنوان · وصف قصير · سهم ملاصق. */
export function CompactNavigationCard({
  href,
  title,
  description,
  icon,
  className,
  onNavigate,
}: CompactNavigationCardProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn("id-nav-card mj-pressable", className)}
      data-identity-card="compact-nav"
      aria-label={description ? `${title} — ${description}` : title}
    >
      {icon ? (
        <span className="id-nav-card__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="id-nav-card__body">
        <CardTitle className="id-nav-card__title">{title}</CardTitle>
        {description ? (
          <SupportingText className="id-nav-card__desc">{description}</SupportingText>
        ) : null}
      </span>
      <ChevronLeft className="id-nav-card__chevron" size={18} strokeWidth={1.8} aria-hidden />
    </Link>
  );
}

export type ContentRowProps = {
  href?: string;
  title: string;
  meta?: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  onNavigate?: () => void;
};

/** صف قائمة طويل — كثافة أعلى من البطاقة العملاقة + فاصل خفيف. */
export function ContentRow({
  href,
  title,
  meta,
  description,
  leading,
  trailing,
  className,
  onNavigate,
}: ContentRowProps) {
  const inner = (
    <>
      {leading ? <span className="id-content-row__leading">{leading}</span> : null}
      <span className="id-content-row__body">
        {meta ? <Caption className="id-content-row__meta">{meta}</Caption> : null}
        <CardTitle className="id-content-row__title">{title}</CardTitle>
        {description ? (
          <SupportingText className="id-content-row__desc">{description}</SupportingText>
        ) : null}
      </span>
      {trailing ? <span className="id-content-row__trailing">{trailing}</span> : null}
      {href ? (
        <ChevronLeft className="id-content-row__chevron" size={16} strokeWidth={1.8} aria-hidden />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn("id-content-row id-content-row--link mj-pressable", className)}
        data-identity-card="content-row"
        aria-label={title}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={cn("id-content-row", className)} data-identity-card="content-row">
      {inner}
    </div>
  );
}

export type DetailSectionProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

/** سطح واحد للمحتوى التفصيلي — بلا Card داخل Card. */
export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <section className={cn("id-detail-section", className)} data-identity-card="detail-section">
      {title ? <h2 className="id-detail-section__title">{title}</h2> : null}
      <div className="id-detail-section__body">{children}</div>
    </section>
  );
}

export type QuoteSurfaceProps = {
  children: ReactNode;
  source?: string;
  className?: string;
};

/** اقتباس محدود — Display type عبر data-display-type. */
export function QuoteSurface({ children, source, className }: QuoteSurfaceProps) {
  return (
    <blockquote
      className={cn("id-quote-surface quote-surface", className)}
      data-identity-card="quote"
      data-display-type="1"
    >
      <div className="id-quote-surface__text quote-surface__text">{children}</div>
      {source ? <cite className="id-quote-surface__source">{source}</cite> : null}
    </blockquote>
  );
}

export type StatusNoticeProps = {
  tone?: "info" | "success" | "warning" | "neutral";
  title?: string;
  children: ReactNode;
  className?: string;
};

/** إشعار حالة — سطح هادئ بلا بطاقة ضخمة. */
export function StatusNotice({
  tone = "neutral",
  title,
  children,
  className,
}: StatusNoticeProps) {
  return (
    <aside
      className={cn("id-status-notice", `id-status-notice--${tone}`, className)}
      data-identity-card="status-notice"
      role="note"
    >
      {title ? <strong className="id-status-notice__title">{title}</strong> : null}
      <div className="id-status-notice__body">{children}</div>
    </aside>
  );
}
