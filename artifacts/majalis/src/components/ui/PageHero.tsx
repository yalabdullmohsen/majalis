import type { ReactNode } from "react";
import { lazy, Suspense, useId } from "react";
import { cn } from "@/lib/utils";
import { PatternBackdrop } from "./PatternBackdrop";
import {
  ScreenTitle,
  SupportingText,
  ExplanationText,
  Caption,
} from "@/components/design-system/text";
import { HeaderOrnament } from "@/components/design-system/geometry/HeaderOrnament";
import { GeometricMotif } from "@/components/design-system/geometry/GeometricMotif";
import "@/styles/components/page-hero.css";

const PageHeroIntegratedBack = lazy(() => import("./PageHeroIntegratedBack"));

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  /** سطر ثانٍ تحت العنوان (مثل شعار المنصة في الرئيسية) */
  headline?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  withPattern?: boolean;
  /** بطل بعرض الشاشة الكامل وخلفية هوية عميقة (افتراضي للصفحات الداخلية) */
  fullBleed?: boolean;
  /** رجوع مدمج في الهيرو — يخفي FAB العام عبر data-section-back / .page-hero-mj__back */
  showBack?: boolean;
  backFallbackHref?: string;
  /** زخرفة هندسية تحت العنوان (افتراضي: نعم؛ تُخفى في الرئيسية عبر CSS) */
  withOrnament?: boolean;
  /** زخرفة زاوية خفيفة */
  withCornerMotif?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * بطل صفحة موحّد: تباين مضمون (--mj-ink / --mj-ink-2 على --mj-bg)
 * مع زخرفة عبر PatternBackdrop فقط.
 * الرجوع مدمج (showBack) عبر chunk مؤجّل — لا ينتفخ entry عبر الرئيسية.
 */
export function PageHero({
  eyebrow,
  title,
  headline,
  description,
  actions,
  withPattern = true,
  fullBleed = true,
  showBack = true,
  backFallbackHref = "/",
  withOrnament = true,
  withCornerMotif = true,
  className,
  children,
}: PageHeroProps) {
  const titleId = useId();
  const onHero = fullBleed;

  return (
    <header
      className={cn(
        "page-hero-mj",
        "svl-page-header",
        "svl-ornament-host",
        fullBleed && "page-hero-mj--bleed",
        className,
      )}
      dir="rtl"
      aria-labelledby={titleId}
      data-svl-page-header="1"
    >
      {withPattern ? <PatternBackdrop /> : null}
      {withCornerMotif ? <GeometricMotif placement="corner" /> : null}
      <div className="page-hero-mj__content">
        {showBack ? (
          <Suspense
            fallback={
              <span
                className="page-hero-mj__back"
                data-section-back="1"
                aria-hidden="true"
                hidden
              />
            }
          >
            <PageHeroIntegratedBack fallbackHref={backFallbackHref} />
          </Suspense>
        ) : null}
        {eyebrow ? (
          <Caption
            as="p"
            className="page-hero-mj__eyebrow"
            tone={onHero ? "onBrand" : "muted"}
          >
            {eyebrow}
          </Caption>
        ) : null}
        <ScreenTitle id={titleId} className="page-hero-mj__title" tone={onHero ? "onBrand" : "default"}>
          {title}
        </ScreenTitle>
        {withOrnament ? <HeaderOrnament /> : null}
        {headline ? (
          <SupportingText
            as="p"
            className="page-hero-mj__headline"
            tone={onHero ? "onBrand" : "default"}
          >
            {headline}
          </SupportingText>
        ) : null}
        {description ? (
          <ExplanationText
            className="page-hero-mj__desc"
            tone={onHero ? "onBrand" : "default"}
          >
            {description}
          </ExplanationText>
        ) : null}
        {actions ? <div className="page-hero-mj__actions">{actions}</div> : null}
        {children}
      </div>
    </header>
  );
}
