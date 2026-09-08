import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/prefetch-route";

type LessonCardProps = {
  href: string;
  title: string;
  description?: string;
  meta?: string;
  icon?: LucideIcon;
  className?: string;
};

/** بطاقة درس — نفس لغة البطاقات الناعمة. */
export function LessonCard({
  href,
  title,
  description,
  meta,
  icon: Icon,
  className,
}: LessonCardProps) {
  return (
    <Link
      href={href}
      aria-label={title}
      className={cn("ds-lesson-card", className)}
      onPointerDown={() => prefetchRoute(href)}
    >
      {Icon ? (
        <span className="ds-lesson-card__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.75} />
        </span>
      ) : null}
      <strong className="ds-lesson-card__title">{title}</strong>
      {description ? <p className="ds-lesson-card__desc">{description}</p> : null}
      {meta ? <p className="ds-lesson-card__desc">{meta}</p> : null}
    </Link>
  );
}
