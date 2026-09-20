import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SectionTitle,
  SupportingText,
  Caption,
} from "@/components/design-system/text";
import { HeaderOrnament } from "@/components/design-system/geometry/HeaderOrnament";
import { GeometricDivider } from "@/components/design-system/geometry/GeometricDivider";
import { IconMedallion } from "@/components/design-system/geometry/IconMedallion";

export type SvlSectionHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  /** فاصل هندسي تحت الرأس — للأقسام الرئيسية فقط */
  withDivider?: boolean;
  /** زخرفة تحت العنوان (افتراضي: نعم) */
  withOrnament?: boolean;
  className?: string;
  titleId?: string;
};

/**
 * رأس قسم SVL موحّد: عنوان + وصف اختياري + زخرفة خفيفة.
 * بلا بطاقة ضخمة · بلا خط أخضر قصير عشوائي.
 */
export function SvlSectionHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  withDivider = false,
  withOrnament = true,
  className,
  titleId = "svl-section-title",
}: SvlSectionHeaderProps) {
  return (
    <header
      className={cn("svl-section-header", className)}
      aria-labelledby={titleId}
      data-svl-section-header="1"
    >
      <div className="svl-section-header__row">
        {Icon ? (
          <IconMedallion className="svl-section-header__medallion">
            <Icon size={18} strokeWidth={1.8} aria-hidden />
          </IconMedallion>
        ) : null}
        <div className="svl-section-header__text">
          {eyebrow ? (
            <Caption as="p" className="svl-section-header__eyebrow">
              {eyebrow}
            </Caption>
          ) : null}
          <SectionTitle id={titleId} className="svl-section-header__title">
            {title}
          </SectionTitle>
          {withOrnament ? <HeaderOrnament /> : null}
          {description ? (
            <SupportingText className="svl-section-header__desc">{description}</SupportingText>
          ) : null}
        </div>
        {actions ? <div className="svl-section-header__actions">{actions}</div> : null}
      </div>
      {withDivider ? <GeometricDivider className="svl-section-header__divider" /> : null}
    </header>
  );
}
