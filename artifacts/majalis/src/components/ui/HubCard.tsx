import { memo, useCallback, type MouseEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch-route";
import { CardTitle, SupportingText, Caption, LabelText } from "@/components/design-system/text";
import "@/styles/components/hub-card.css";

export type SectionEntryVariant = "primary" | "soft" | "compact" | "detailed" | "featured";

export type SectionEntryCardProps = {
  title: string;
  /** وصف قصير — يُفضَّل سطران مكتملان بلا قصّ قبيح */
  subtitle?: string;
  description?: string;
  meta?: string;
  badge?: ReactNode;
  icon?: ReactNode;
  Icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: SectionEntryVariant;
  soon?: boolean;
  disabled?: boolean;
  loading?: boolean;
  featured?: boolean;
  className?: string;
  footer?: ReactNode;
};

/** @deprecated استخدم SectionEntryCardProps — يُبقى للتوافق */
export type HubCardProps = SectionEntryCardProps & { href: string };

function normalizePath(path: string): string {
  const bare = String(path || "/").split("?")[0].split("#")[0].trim() || "/";
  return bare.replace(/\/+$/, "") || "/";
}

function hrefHash(href: string): string {
  const i = String(href || "").indexOf("#");
  return i >= 0 ? href.slice(i + 1).split("?")[0] : "";
}

/**
 * بطاقة دخول موحّدة للأقسام والصفحات الداخلية.
 * البطاقة كلها قابلة للضغط؛ السهم زخرفة مدمجة فقط.
 */
export const SectionEntryCard = memo(function SectionEntryCard({
  href,
  onClick,
  title,
  subtitle,
  description,
  meta,
  badge,
  icon,
  Icon,
  variant = "primary",
  soon,
  disabled,
  loading,
  featured,
  className,
  footer,
}: SectionEntryCardProps) {
  const [location] = useLocation();
  if (soon) return null;

  const desc = (subtitle ?? description)?.trim() || undefined;
  const current = normalizePath(location);
  const safeHref = href?.trim() || "";
  const hashOnly = safeHref.startsWith("#");
  const hash = hrefHash(safeHref);
  const target = !safeHref ? "" : hashOnly ? current : normalizePath(safeHref);
  const samePathHash = Boolean(hash) && target === current;
  const isCurrent = Boolean(target) && target === current && !hash;
  const nonInteractive = isCurrent || disabled || loading || (!safeHref && !onClick);

  const iconNode =
    icon ??
    (Icon ? <Icon size={20} strokeWidth={1.85} aria-hidden="true" /> : null);

  const classNames = cn(
    "hub-card sec-entry soft-card soft-card--on-light ss-hub-card mj-pressable",
    `hub-card--${variant}`,
    (featured || variant === "featured") && "hub-card--featured",
    variant === "detailed" && "hub-card--detailed",
    isCurrent && "hub-card--current",
    disabled && "hub-card--disabled",
    loading && "hub-card--loading",
    className,
  );

  const warmRoute = useCallback(() => {
    if (nonInteractive || samePathHash || !safeHref) return;
    prefetchRoute(safeHref);
  }, [safeHref, nonInteractive, samePathHash]);

  const scrollToHash = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!hash) return;
      const el = document.getElementById(hash);
      if (!el) return;
      event.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof history !== "undefined") {
        history.pushState(null, "", `#${hash}`);
      }
    },
    [hash],
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (disabled || loading) {
        event.preventDefault();
        return;
      }
      onClick?.();
    },
    [disabled, loading, onClick],
  );

  const body = (
    <>
      <div className="hub-card__top">
        {iconNode ? <span className="hub-card__icon">{iconNode}</span> : null}
        <div className="hub-card__top-meta">
          {badge != null ? <span className="hub-card__chip mj-badge">{badge}</span> : null}
          {isCurrent ? (
            <LabelText className="hub-card__soon">أنت هنا</LabelText>
          ) : null}
          {loading ? (
            <LabelText className="hub-card__soon">تجهيز…</LabelText>
          ) : null}
        </div>
      </div>
      <div className="hub-card__body">
        <CardTitle className="hub-card__title">{title}</CardTitle>
        {desc ? <SupportingText className="hub-card__desc">{desc}</SupportingText> : null}
      </div>
      <div className="hub-card__foot">
        <div className="hub-card__foot-start">
          {meta ? <Caption className="hub-card__meta">{meta}</Caption> : null}
          {footer}
        </div>
        {!nonInteractive || samePathHash ? (
          <span className="hub-card__go" aria-hidden="true">
            <ChevronLeft size={16} strokeWidth={2.5} />
          </span>
        ) : null}
      </div>
    </>
  );

  if (nonInteractive && !samePathHash) {
    return (
      <div
        className={classNames}
        aria-label={isCurrent ? `${title} — الصفحة الحالية` : title}
        aria-current={isCurrent ? "page" : undefined}
        aria-disabled={disabled || loading ? true : undefined}
        data-hub-card-current={isCurrent ? "1" : undefined}
        data-section-entry="1"
      >
        {body}
      </div>
    );
  }

  if (samePathHash) {
    return (
      <a
        href={`#${hash}`}
        className={classNames}
        aria-label={title}
        data-section-entry="1"
        onClick={(e) => {
          handleClick(e);
          scrollToHash(e);
        }}
      >
        {body}
      </a>
    );
  }

  if (safeHref) {
    return (
      <Link
        href={safeHref}
        className={classNames}
        aria-label={title}
        data-section-entry="1"
        onPointerEnter={warmRoute}
        onPointerDown={warmRoute}
        onClick={handleClick}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classNames}
      aria-label={title}
      data-section-entry="1"
      onClick={(e) => handleClick(e as unknown as MouseEvent)}
    >
      {body}
    </button>
  );
});

/** توافق خلفي — نفس SectionEntryCard */
export const HubCard = SectionEntryCard;
