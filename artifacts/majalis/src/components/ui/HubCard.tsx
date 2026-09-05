import { memo, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "@/styles/components/hub-card.css";

export type HubCardProps = {
  href: string;
  title: string;
  description?: string;
  /** عدد الموضوعات/الدروس إن وُجد */
  meta?: string;
  badge?: ReactNode;
  icon?: ReactNode;
  Icon?: LucideIcon;
  soon?: boolean;
  featured?: boolean;
  className?: string;
  footer?: ReactNode;
};

function normalizePath(path: string): string {
  const bare = String(path || "/").split("?")[0].split("#")[0].trim() || "/";
  return bare.replace(/\/+$/, "") || "/";
}

/**
 * بطاقة بوابة قسم — SectionGatewayCard: زوايا ناعمة، سهم مدمج، بلا تراكب.
 * لا تنتقل إلى نفس الصفحة الحالية، ولا تُعامل «قريبًا» كرابط.
 */
export const HubCard = memo(function HubCard({
  href,
  title,
  description,
  meta,
  badge,
  icon,
  Icon,
  soon,
  featured,
  className,
  footer,
}: HubCardProps) {
  const [location] = useLocation();
  const current = normalizePath(location);
  const target = normalizePath(href);
  const isCurrent = Boolean(target) && target === current;
  const nonInteractive = Boolean(soon) || isCurrent;

  const iconNode =
    icon ??
    (Icon ? (
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
    ) : null);
  const hasHead = badge != null || soon || isCurrent || iconNode != null;

  const classNames = cn(
    "hub-card",
    featured && "hub-card--featured",
    soon && "hub-card--soon",
    isCurrent && "hub-card--current",
    className,
  );

  const body = (
    <>
      {hasHead ? (
        <div className="hub-card__head">
          {badge != null ? <span className="hub-card__chip mj-badge">{badge}</span> : null}
          {soon ? <span className="hub-card__soon">قريبًا</span> : null}
          {isCurrent && !soon ? <span className="hub-card__soon">أنت هنا</span> : null}
          {iconNode ? <span className="hub-card__icon">{iconNode}</span> : null}
        </div>
      ) : null}
      <div className="hub-card__body">
        <h3 className="hub-card__title">{title}</h3>
        {description ? <p className="hub-card__desc">{description}</p> : null}
        {meta ? <p className="hub-card__meta">{meta}</p> : null}
        {footer}
      </div>
      {!nonInteractive ? (
        <span className="hub-card__go" aria-hidden="true">
          <ChevronLeft size={16} strokeWidth={2.5} />
        </span>
      ) : null}
    </>
  );

  if (nonInteractive) {
    return (
      <div
        className={classNames}
        aria-label={soon ? `${title} — قريبًا` : isCurrent ? `${title} — الصفحة الحالية` : title}
        aria-current={isCurrent ? "page" : undefined}
        data-hub-card-current={isCurrent ? "1" : undefined}
        data-hub-card-soon={soon ? "1" : undefined}
      >
        {body}
      </div>
    );
  }

  return (
    <Link href={href} className={classNames} aria-label={title}>
      {body}
    </Link>
  );
});
