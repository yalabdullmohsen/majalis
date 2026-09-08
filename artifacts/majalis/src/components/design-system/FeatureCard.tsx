import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { AppCard } from "./AppCard";

export type FeatureCardProps = {
  href: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  onNavigate?: () => void;
};

/** بطاقة ميزة/قسم قابلة للنقر — شبكة 2 أعمدة على الموبايل. */
export function FeatureCard({ href, title, description, icon, className, onNavigate }: FeatureCardProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
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
  );
}
