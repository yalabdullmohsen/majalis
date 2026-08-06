import type { ReactNode } from "react";
import "@/styles/components/page-shell.css";

export type PageShellDensity = "dense" | "medium" | "airy";
export type PageShellVariant = "default" | "narrow" | "wide";

type Props = {
  children?: ReactNode;
  /** مقدمة مضغوطة (عنوان + وصف) — ارتفاع الكتلة محدود بالـCSS */
  intro?: ReactNode;
  /** المحتوى الرئيسي */
  content?: ReactNode;
  /** شريط «متصل بـ» / روابط ذات صلة — شكل موحّد */
  related?: ReactNode;
  /** narrow = قراءة · wide = فهارس عريضة */
  variant?: PageShellVariant;
  /** كثافة الإيقاع: فهارس / بطاقات / قراءة */
  density?: PageShellDensity;
  className?: string;
  as?: "div" | "article" | "main" | "section";
  "aria-labelledby"?: string;
};

/**
 * غلاف الصفحة الواحد — الأغلفة العامة تشتق منه.
 * إن مُرِّرت الفتحات (intro/content/related) تُرتَّب؛ وإلا يُمرَّر children كما هو
 * للحفاظ على محددات CSS الحالية أثناء الترحيل التدريجي.
 */
export function PageShell({
  children,
  intro,
  content,
  related,
  variant = "default",
  density = "medium",
  className = "",
  as: Tag = "div",
  "aria-labelledby": ariaLabelledBy,
}: Props) {
  const widthClass =
    variant === "narrow"
      ? "page-shell narrow"
      : variant === "wide"
        ? "page-shell wide"
        : "page-shell";

  const classNames = `${widthClass} ds-page mj-page page-shell--${density} ${className}`.trim();
  const useSlots = intro != null || content != null || related != null;

  if (!useSlots) {
    return (
      <Tag
        className={classNames}
        data-page-shell="1"
        data-density={density}
        aria-labelledby={ariaLabelledBy}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={classNames}
      data-page-shell="1"
      data-density={density}
      aria-labelledby={ariaLabelledBy}
    >
      {intro ? <div className="page-shell__intro">{intro}</div> : null}
      {(content ?? children) ? (
        <div className="page-shell__content">{content ?? children}</div>
      ) : null}
      {related ? (
        <aside className="page-shell__related" aria-label="روابط ذات صلة">
          {related}
        </aside>
      ) : null}
    </Tag>
  );
}

/** شريط روابط ذات صلة موحّد الشكل */
export function PageRelatedLinks({
  title = "متصل بـ",
  links,
}: {
  title?: string;
  links: Array<{ href: string; label: string }>;
}) {
  if (!links.length) return null;
  return (
    <div className="page-related">
      <h2 className="page-related__title">{title}</h2>
      <ul className="page-related__grid">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <a href={l.href} className="page-related__link">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
