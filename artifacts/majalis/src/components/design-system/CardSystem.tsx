/**
 * Card System — الأنواع العشرة الرسمية فقط.
 * لا تُنشأ بطاقات خارج هذا النظام؛ أعد التصدير أو غلّف الموجود.
 */
import type { HTMLAttributes, ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { AppCard } from "./AppCard";
import { type ContentCardProps } from "./ContentCard";
import { BodyText, Caption, CardTitle } from "./text";

export type { ContentCardProps };

/* ── HeroCard ── */
export type HeroCardProps = HTMLAttributes<HTMLElement> & {
  as?: "header" | "section" | "div";
  title: string;
  description?: string;
  visual?: ReactNode;
  cta?: ReactNode;
  children?: ReactNode;
};

export function HeroCard({
  as: Tag = "header",
  title,
  description,
  visual,
  cta,
  className,
  children,
  ...rest
}: HeroCardProps) {
  return (
    <Tag
      data-cs-card="1"
      data-cs-type="hero"
      className={cn("cs-card cs-hero", className)}
      {...rest}
    >
      {visual ? <div className="cs-card__icon" aria-hidden="true">{visual}</div> : null}
      <CardTitle className="cs-card__title">{title}</CardTitle>
      {description ? <BodyText className="cs-card__desc">{description}</BodyText> : null}
      {children}
      {cta ? <div className="cs-hero__cta">{cta}</div> : null}
    </Tag>
  );
}

/* ── أنواع مبنية على المنتج الحالي ── */
export { SectionCard } from "@/components/sections/SectionCard";
export { TopicCard } from "@/components/ui/InternalCards";
export { UnifiedLessonCard as LessonCard } from "@/components/lessons/UnifiedLessonCard";
export { HadithCard } from "@/components/hadith/HadithCard";
export {
  RelatedContentCard,
  RelatedContentStack,
  type RelatedContentCardProps,
} from "@/components/content/RelatedContentCard";

/* ── CourseCard — مسارات/دورات ── */
export type CourseCardProps = {
  href?: string;
  title: string;
  description?: string;
  topicsCount?: number | string;
  updatedAt?: string;
  progress?: string;
  className?: string;
  children?: ReactNode;
};

export function CourseCard({
  href,
  title,
  description,
  topicsCount,
  updatedAt,
  progress,
  className,
  children,
}: CourseCardProps) {
  const body = (
    <AppCard
      as="article"
      className={cn("cs-card cs-course lesson-course-card", className)}
      data-cs-type="course"
    >
      <CardTitle className="cs-card__title">{title}</CardTitle>
      {description ? <BodyText className="cs-card__desc">{description}</BodyText> : null}
      <div className="cs-card__meta-row">
        {topicsCount != null && topicsCount !== "" ? (
          <Caption as="span" className="cs-card__meta">
            {typeof topicsCount === "number" ? `${topicsCount} موضوع` : topicsCount}
          </Caption>
        ) : null}
        {updatedAt ? (
          <Caption as="span" className="cs-card__meta">
            آخر تحديث: {updatedAt}
          </Caption>
        ) : null}
        {progress ? (
          <Caption as="span" className="cs-card__meta">
            {progress}
          </Caption>
        ) : null}
      </div>
      {children}
    </AppCard>
  );

  if (!href) return body;
  return (
    <Link href={href} className="cs-course__anchor mj-pressable" aria-label={title}>
      {body}
    </Link>
  );
}

/* ── محتوى مطبوع بنوع ── */
function TypedContentCard({
  type,
  href,
  title,
  meta,
  excerpt,
  footer,
  className,
  children,
}: ContentCardProps & { type: "quran" | "reference" }) {
  const body = (
    <AppCard
      as="article"
      className={cn("ss-content-card", `cs-${type}`, href && "ss-content-card--link", className)}
      data-content-card="1"
      data-cs-type={type}
    >
      {meta ? (
        <Caption as="p" className="ss-content-card__meta cs-card__meta">
          {meta}
        </Caption>
      ) : null}
      <CardTitle className="ss-content-card__title cs-card__title">{title}</CardTitle>
      {excerpt ? (
        <BodyText className="ss-content-card__excerpt cs-card__desc">{excerpt}</BodyText>
      ) : null}
      {children}
      {footer ? <div className="ss-content-card__footer">{footer}</div> : null}
    </AppCard>
  );

  if (!href) return body;
  return (
    <Link href={href} className="ss-content-card__anchor mj-pressable" aria-label={title}>
      {body}
    </Link>
  );
}

export function QuranCard(props: ContentCardProps) {
  return <TypedContentCard type="quran" {...props} />;
}

export function ReferenceCard(props: ContentCardProps) {
  return <TypedContentCard type="reference" {...props} />;
}

/* ── ActionCard ── */
export type ActionCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  title?: string;
  description?: string;
  children?: ReactNode;
};

export function ActionCard({
  as = "article",
  title,
  description,
  className,
  children,
  ...rest
}: ActionCardProps) {
  return (
    <AppCard
      as={as}
      tone="accent"
      className={cn("cs-card cs-action", className)}
      data-cs-type="action"
      {...rest}
    >
      {title ? <CardTitle className="cs-card__title">{title}</CardTitle> : null}
      {description ? <BodyText className="cs-card__desc">{description}</BodyText> : null}
      {children}
    </AppCard>
  );
}

/** قائمة الأنواع الرسمية — للبوابات والتوثيق */
export const CS_CARD_TYPES = [
  "HeroCard",
  "SectionCard",
  "TopicCard",
  "LessonCard",
  "CourseCard",
  "HadithCard",
  "QuranCard",
  "ReferenceCard",
  "RelatedContentCard",
  "ActionCard",
] as const;

export type CsCardTypeName = (typeof CS_CARD_TYPES)[number];
