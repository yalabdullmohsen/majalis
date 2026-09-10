import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { AppCard } from "./AppCard";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";

export type FeatureCardProps = {
  href: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  onNavigate?: () => void;
};

/** بطاقة ميزة/قسم قابلة للنقر — شبكة 2 أعمدة على الموبايل + prefetch فوري. */
export function FeatureCard({ href, title, description, icon, className, onNavigate }: FeatureCardProps) {
  const { ref, onPointerEnter, onPointerDown, onFocus } = usePrefetchRoute(href);

  return (
    <div ref={ref} className="ss-feature-card-host">
      <Link
        href={href}
        onClick={onNavigate}
        onPointerEnter={onPointerEnter}
        onPointerDown={onPointerDown}
        onFocus={onFocus}
        className={cn("ss-feature-card mj-pressable", className)}
        data-feature-card="1"
        aria-label={description ? `${title} — ${description}` : title}
      >
        <AppCard as="div" padding="sm" className="ss-feature-card__inner">
          {icon ? (
            <span className="ss-feature-card__icon" aria-hidden>
              {icon}
            </span>
          ) : null}
          <span className="ss-feature-card__title">{title}</span>
          {description ? <span className="ss-feature-card__desc">{description}</span> : null}
        </AppCard>
      </Link>
    </div>
  );
}
