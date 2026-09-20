import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ScreenTitle,
  SupportingText,
  Caption,
  LabelText,
} from "@/components/design-system/text";
import { HeaderOrnament } from "@/components/design-system/geometry/HeaderOrnament";
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
  /** زخرفة تحت العنوان (SVL) */
  withOrnament?: boolean;
};

/**
 * رأس قسم موحّد مضغوط — بديل البطاقات الخضراء الضخمة.
 * SVL PR-3: سطح خفيف + زخرفة هندسية بدل الخط الأخضر القصير.
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
  withOrnament = true,
}: Props) {
  return (
    <header
      className={cn("compact-section-header", "svl-section-header--compact", className)}
      data-section-hero="1"
      data-svl-section-header="1"
      aria-labelledby={titleId}
    >
      <div className="compact-section-header__row">
        {Icon ? (
          <span className="compact-section-header__icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.8} />
          </span>
        ) : null}
        <div className="compact-section-header__text">
          {eyebrow ? (
            <Caption as="p" className="compact-section-header__eyebrow">
              {eyebrow}
            </Caption>
          ) : null}
          <ScreenTitle id={titleId} className="compact-section-header__title">
            {title}
          </ScreenTitle>
          {withOrnament ? <HeaderOrnament /> : null}
          {description ? (
            <SupportingText className="compact-section-header__desc">{description}</SupportingText>
          ) : null}
        </div>
      </div>
      {stats && stats.length > 0 ? (
        <ul className="compact-section-header__stats" aria-label="إحصاءات القسم">
          {stats.map((stat) => (
            <li key={stat.id} className="compact-section-header__chip">
              <LabelText>{stat.label}</LabelText>
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
/** اسم SVL الموحّد */
export const SectionHeader = CompactSectionHeader;
