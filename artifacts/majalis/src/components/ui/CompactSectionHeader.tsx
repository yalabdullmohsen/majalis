import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./compact-section-header.css";

export type CompactSectionStat = {
  id: string;
  label: string;
};

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  stats?: CompactSectionStat[];
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  titleId?: string;
};

/**
 * رأس قسم موحّد مضغوط — بديل البطاقات الخضراء الضخمة.
 */
export function CompactSectionHeader({
  title,
  description,
  icon: Icon,
  stats,
  eyebrow,
  actions,
  className,
  titleId = "compact-section-title",
}: Props) {
  return (
    <header
      className={cn("compact-section-header", className)}
      data-section-hero="1"
      aria-labelledby={titleId}
    >
      <div className="compact-section-header__row">
        {Icon ? (
          <span className="compact-section-header__icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.8} />
          </span>
        ) : null}
        <div className="compact-section-header__text">
          {eyebrow ? <p className="compact-section-header__eyebrow">{eyebrow}</p> : null}
          <h1 id={titleId} className="compact-section-header__title">
            {title}
          </h1>
          {description ? <p className="compact-section-header__desc">{description}</p> : null}
        </div>
      </div>
      {stats && stats.length > 0 ? (
        <ul className="compact-section-header__stats" aria-label="إحصاءات القسم">
          {stats.map((stat) => (
            <li key={stat.id} className="compact-section-header__chip">
              {stat.label}
            </li>
          ))}
        </ul>
      ) : null}
      {actions ? <div className="compact-section-header__actions">{actions}</div> : null}
    </header>
  );
}

/** اسم بديل مطابق للمواصفات */
export const SectionIntroHeader = CompactSectionHeader;
