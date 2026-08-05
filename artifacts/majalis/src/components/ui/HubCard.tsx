import type { ReactNode } from "react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type HubCardProps = {
  href: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  icon?: ReactNode;
  Icon?: LucideIcon;
  soon?: boolean;
  featured?: boolean;
  className?: string;
  footer?: ReactNode;
};

/**
 * بطاقة قسم موحّدة: سطح فاتح + أيقونة soft، بلا كتلة داكنة فارغة.
 */
export function HubCard({
  href,
  title,
  description,
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
      {iconNode ? <span className="hub-card__icon">{iconNode}</span> : null}
      <div className="hub-card__body">
        <div className="hub-card__heading">
          <h3 className="hub-card__title">{title}</h3>
          {badge != null ? <span className="hub-card__badge mj-badge">{badge}</span> : null}
          {soon ? <span className="hub-card__soon">قريبًا</span> : null}
        </div>
        {description ? <p className="hub-card__desc">{description}</p> : null}
        {footer}
      </div>
    </Link>
  );
}
