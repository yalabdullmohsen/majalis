import { memo, type ReactNode } from "react";
import { Link } from "wouter";
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

/**
 * بطاقة بوابة قسم — SectionGatewayCard: زوايا ناعمة، سهم مدمج، بلا تراكب.
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
  const iconNode =
    icon ??
    (Icon ? (
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
    ) : null);

  return (
    <Link
      href={href}
      className={cn(
        "hub-card",
        featured && "hub-card--featured",
        soon && "hub-card--soon",
        className,
      )}
      aria-label={soon ? `${title} — قريبًا` : title}
    >
      <div className="hub-card__head">
        {badge != null ? <span className="hub-card__chip mj-badge">{badge}</span> : null}
        {soon ? <span className="hub-card__soon">قريبًا</span> : null}
        {iconNode ? <span className="hub-card__icon">{iconNode}</span> : null}
      </div>
      <div className="hub-card__body">
        <h3 className="hub-card__title">{title}</h3>
        {description ? <p className="hub-card__desc">{description}</p> : null}
        {meta ? <p className="hub-card__meta">{meta}</p> : null}
        {footer}
      </div>
      {!soon ? (
        <span className="hub-card__go" aria-hidden="true">
          <ChevronLeft size={16} strokeWidth={2.5} />
        </span>
      ) : null}
    </Link>
  );
});
