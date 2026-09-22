/**
 * Page Header V2 — عنوان صفحة موحّد (Visual Redesign V2 expansion).
 * الأنماط عبر html[data-v2-app] + app-shell-v2.css (يُحمَّل كسولًا من App).
 */
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScreenTitle, SupportingText, LabelText } from "@/components/design-system/text";

export type PageHeaderV2Props = HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeaderV2({
  eyebrow,
  title,
  description,
  actions,
  className,
  ...rest
}: PageHeaderV2Props) {
  return (
    <header className={cn("page-header-v2", "ph2", className)} dir="rtl" {...rest}>
      {eyebrow ? <LabelText className="ph2__eyebrow">{eyebrow}</LabelText> : null}
      <ScreenTitle className="ph2__title">{title}</ScreenTitle>
      {description ? (
        <SupportingText className="ph2__desc">{description}</SupportingText>
      ) : null}
      {actions ? <div className="ph2__actions">{actions}</div> : null}
    </header>
  );
}
