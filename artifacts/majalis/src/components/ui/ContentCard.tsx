import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch-route";

type ContentCardProps = {
  href?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
};

/** بطاقة محتوى عامة — رابط أو زر. */
export function ContentCard({
  href,
  title,
  description,
  icon: Icon,
  className,
  children,
  onClick,
}: ContentCardProps) {
  const inner = (
    <>
      {Icon ? (
        <span className="ds-content-card__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.75} />
        </span>
      ) : null}
      <strong className="ds-content-card__title">{title}</strong>
      {description ? <p className="ds-content-card__desc">{description}</p> : null}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={title}
        className={cn("ds-content-card", className)}
        onPointerDown={() => prefetchRoute(href)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={title}
      className={cn("ds-content-card", className)}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}
