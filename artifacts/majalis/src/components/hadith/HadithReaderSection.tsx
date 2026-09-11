import type { ReactNode } from "react";
import { Link } from "wouter";

type Props = {
  title: string;
  children?: ReactNode;
  examples?: string[];
  links?: { href: string; label: string }[];
  variant?: "default" | "sharh" | "fawaid" | "notice" | "matn";
  className?: string;
};

/** قسم قارئ موحّد: عنوان + محتوى + أمثلة + روابط */
export function HadithReaderSection({
  title,
  children,
  examples,
  links,
  variant = "default",
  className = "",
}: Props) {
  const roleClass =
    variant === "sharh"
      ? "hdl-role--sharh"
      : variant === "fawaid"
        ? "hdl-role--fawaid"
        : variant === "notice"
          ? "hdl-role--notice"
          : variant === "matn"
            ? "hdl-role--matn"
            : "";

  return (
    <section className={`hdl-reader-section ${className}`.trim()} aria-label={title}>
      <h3 className="hdl-reader-section__title">{title}</h3>
      {children ? (
        <div className={`hdl-reader-section__body ${roleClass}`.trim()}>{children}</div>
      ) : null}
      {examples && examples.length > 0 ? (
        <ul className="hdl-reader-section__list">
          {examples.map((ex) => (
            <li key={ex}>{ex}</li>
          ))}
        </ul>
      ) : null}
      {links && links.length > 0 ? (
        <nav className="hdl-reader-section__nav" aria-label={`روابط: ${title}`}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hdl-reader-section__link">
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </section>
  );
}

type HeroProps = {
  eyebrow?: string;
  title: string;
  lead: string;
  className?: string;
};

export function HadithInfoHero({ eyebrow, title, lead, className = "" }: HeroProps) {
  return (
    <header className={`hdl-info-hero ${className}`.trim()}>
      {eyebrow ? <p className="hdl-info-hero__eyebrow">{eyebrow}</p> : null}
      <h1 className="hdl-info-hero__title">{title}</h1>
      <p className="hdl-info-hero__lead">{lead}</p>
    </header>
  );
}
