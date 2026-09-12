/**
 * SectionHero — بطاقة افتتاحية موحّدة لأقسام التطبيق الداخلية.
 * تُستخدم داخل TopicPage/SectionTemplatePage، ويمكن استدعاؤها منفردة للصفحات المخصصة.
 */
import type { CSSProperties, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { goBackOrFallback } from "@/lib/navigation-back";
import {
  getTopicTheme,
  topicThemeCssVars,
  type TopicThemeId,
} from "@/config/topic-themes";
import {
  ScreenTitle,
  SupportingText,
  Caption,
  ScriptureText,
  LabelText,
} from "@/components/design-system/text";
import "@/styles/components/topic-page.css";
import "@/styles/components/safe-hero.css";

export type SectionHeroCrumb = {
  label: string;
  href?: string;
};

export type SectionHeroQuote = {
  text: string;
  ref: string;
  type?: "ayah" | "hadith";
};

export type SectionHeroProps = {
  themeId: TopicThemeId | string;
  /** لون accent اختياري يتجاوز سمة الموضوع */
  accent?: string;
  breadcrumb?: SectionHeroCrumb[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  quote?: SectionHeroQuote;
  /** أيقونة أو عنصر زخرفي بجانب العنوان */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  showBack?: boolean;
  backFallbackHref?: string;
};

export function SectionHero({
  themeId,
  accent,
  breadcrumb,
  eyebrow,
  title,
  subtitle,
  quote,
  icon,
  className,
  children,
  showBack = true,
  backFallbackHref,
}: SectionHeroProps) {
  const [location] = useLocation();
  const theme = getTopicTheme(themeId);
  const sectionAccent = accent ?? theme.accent;
  const heroStyle = {
    ...topicThemeCssVars(theme),
    "--section-accent": sectionAccent,
  } as CSSProperties;
  return (
    <div
      className={`section-hero${className ? ` ${className}` : ""}`}
      data-section-shell="1"
      data-kx-hero="knowledge"
      data-topic-theme={theme.id}
      style={heroStyle}
      dir="rtl"
    >
      {showBack ? (
        <div className="section-hero__back-row">
          <button
            type="button"
            className="section-hero__back app-back-btn app-back-btn--hero"
            aria-label="رجوع"
            onPointerDown={(e) => {
              e.preventDefault();
              goBackOrFallback(location, backFallbackHref);
            }}
          >
            رجوع
          </button>
        </div>
      ) : null}
      {breadcrumb && breadcrumb.length > 0 ? (
        <div className="section-hero__chrome">
          <nav className="topic-page__crumb" aria-label="مسار التنقل" data-section-crumb="1">
            {breadcrumb.map((item, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <span key={`${item.label}-${i}`} className="topic-page__crumb-item">
                  {i > 0 ? <span aria-hidden="true"> / </span> : null}
                  {item.href && !last ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined}>{item.label}</span>
                  )}
                </span>
              );
            })}
          </nav>
        </div>
      ) : null}

      <header
        className="topic-page__hero on-dark safe-hero"
        data-on-dark
        data-section-hero="1"
      >
        <div className="topic-page__hero-inner safe-hero__body">
          <div className="section-hero__title-row">
            {icon ? (
              <span className="section-hero__icon" aria-hidden="true">
                {icon}
              </span>
            ) : null}
            <div className="section-hero__title-stack">
              {eyebrow ? (
                <LabelText
                  as="p"
                  className="topic-page__eyebrow safe-hero__badge"
                  data-section-eyebrow="1"
                  tone="onBrand"
                >
                  {eyebrow}
                </LabelText>
              ) : null}
              <ScreenTitle
                className="topic-page__title"
                data-section-title="1"
                tone="onBrand"
              >
                {title}
              </ScreenTitle>
            </div>
          </div>
          {subtitle ? (
            <SupportingText
              className="topic-page__sub"
              data-section-sub="1"
              tone="onBrand"
            >
              {subtitle}
            </SupportingText>
          ) : null}
          {quote ? (
            <blockquote className="topic-page__quote" data-section-quote="1">
              <ScriptureText className="topic-page__quote-text" tone="onBrand">
                {quote.text}
              </ScriptureText>
              <Caption as="cite" className="topic-page__quote-ref" tone="onBrand">
                {quote.ref}
              </Caption>
            </blockquote>
          ) : null}
          {children}
        </div>
      </header>
    </div>
  );
}
