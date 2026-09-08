import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch-route";

type FeatureCardProps = {
  href: string;
  title: string;
  description?: string;
  cta?: string;
  icon?: LucideIcon;
  hero?: boolean;
  className?: string;
  children?: ReactNode;
};

/** بطاقة ميزة موحّدة — أيقونة دائرية + عنوان + وصف قصير. */
export function FeatureCard({
  href,
  title,
  description,
  cta = "افتح",
  icon: Icon,
  hero = false,
  className,
  children,
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      aria-label={title}
      className={cn("ds-feature-card", hero && "ds-feature-card--hero", className)}
      onPointerDown={() => prefetchRoute(href)}
    >
      {Icon ? (
        <span className="ds-feature-card__icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.75} />
        </span>
      ) : null}
      <strong className="ds-feature-card__title">{title}</strong>
      {description ? <p className="ds-feature-card__desc">{description}</p> : null}
      {children}
      <span className="ds-feature-card__cta">{cta} ←</span>
    </Link>
  );
}
