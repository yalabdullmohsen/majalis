/**
 * Empty State V2 — حالة فارغة أنيقة (Visual Redesign V2 expansion).
 * الأنماط عبر html[data-v2-app] + app-shell-v2.css (يُحمَّل كسولًا من App).
 */
import type { HTMLAttributes, ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export type EmptyStateV2Props = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  icon?: ReactNode;
  ctaLabel?: string;
  href?: string;
  onCtaClick?: () => void;
};

export function EmptyStateV2({
  title,
  description,
  icon,
  ctaLabel,
  href,
  onCtaClick,
  className,
  ...rest
}: EmptyStateV2Props) {
  const cta =
    ctaLabel &&
    (href ? (
      <Link href={href} className="es2__cta">
        {ctaLabel}
      </Link>
    ) : onCtaClick ? (
      <button type="button" className="es2__cta" onClick={onCtaClick}>
        {ctaLabel}
      </button>
    ) : null);

  return (
    <div
      className={cn("empty-state-v2", "es2", className)}
      role="status"
      data-empty-state-v2=""
      {...rest}
    >
      {icon ? (
        <div className="es2__icon" aria-hidden="true">
          {icon}
        </div>
      ) : (
        <div className="es2__icon" aria-hidden="true">
          <span className="es2__mark">س</span>
        </div>
      )}
      <p className="es2__title">{title}</p>
      {description ? <p className="es2__desc">{description}</p> : null}
      {cta}
    </div>
  );
}
