import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { PatternBackdrop } from "./PatternBackdrop";
import "@/styles/components/page-hero.css";

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
  className?: string;
  children?: ReactNode;
};

/**
 * بطل صفحة موحّد: تباين مضمون (--mj-ink / --mj-ink-2 على --mj-bg)
 * مع زخرفة عبر PatternBackdrop فقط.
 * الرجوع عبر FloatingBackButton فقط (لا زر داخل الهيرو).
 */
export function PageHero({
  eyebrow,
  title,
  headline,
  description,
  actions,
  withPattern = true,
  fullBleed = true,
  className,
  children,
}: PageHeroProps) {
  const titleId = useId();

  return (
    <header
      className={cn("page-hero-mj", fullBleed && "page-hero-mj--bleed", className)}
      dir="rtl"
      aria-labelledby={titleId}
    >
      {withPattern ? <PatternBackdrop /> : null}
      <div className="page-hero-mj__content">
        {eyebrow ? <p className="page-hero-mj__eyebrow">{eyebrow}</p> : null}
        <h1 id={titleId} className="page-hero-mj__title">{title}</h1>
        {headline ? <p className="page-hero-mj__headline">{headline}</p> : null}
        {description ? <p className="page-hero-mj__desc">{description}</p> : null}
        {actions ? <div className="page-hero-mj__actions">{actions}</div> : null}
        {children}
      </div>
    </header>
  );
}
