/**
 * SunnahCard V2 — بطاقة Dashboard فاخرة (Visual Redesign V2).
 * كبيرة · نظيفة · أيقونة · عنوان · وصف · CTA — بلا عمود أخضر جانبي.
 */
import type { HTMLAttributes, ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { CardTitle, SupportingText } from "@/components/design-system/text";
import "@/styles/components/sunnah-card-v2.css";

export type SunnahCardV2Props = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  /** سطح أبيض/عاجي · أو بطاقة ترحيب زمردية */
  variant?: "surface" | "welcome" | "quiet";
  icon?: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  href?: string;
  onCtaClick?: () => void;
  children?: ReactNode;
};

export function SunnahCardV2({
  as: Tag = "article",
  variant = "surface",
  icon,
  title,
  description,
  ctaLabel,
  href,
  onCtaClick,
  className,
  children,
  ...rest
}: SunnahCardV2Props) {
  const cta =
    ctaLabel &&
    (href ? (
      <Link href={href} className="sc2-cta">
        {ctaLabel}
      </Link>
    ) : (
      <button type="button" className="sc2-cta" onClick={onCtaClick}>
        {ctaLabel}
      </button>
    ));

  return (
    <Tag
      data-sunnah-card-v2=""
      data-variant={variant}
      className={cn("sc2", `sc2--${variant}`, className)}
      {...rest}
    >
      {icon ? (
        <div className="sc2-icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <div className="sc2-body">
        <CardTitle className="sc2-title">{title}</CardTitle>
        {description ? (
          <SupportingText className="sc2-desc">{description}</SupportingText>
        ) : null}
        {children}
        {cta}
      </div>
    </Tag>
  );
}
