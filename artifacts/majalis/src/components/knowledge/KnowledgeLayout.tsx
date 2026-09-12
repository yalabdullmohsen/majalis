import type { HTMLAttributes, ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import "@/styles/knowledge-experience.css";

export type KnowledgeLayoutKind =
  | "reader"
  | "knowledge"
  | "library"
  | "timeline"
  | "hadith"
  | "fiqh"
  | "biography";

type KnowledgeLayoutProps = {
  kind?: KnowledgeLayoutKind;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/** غلاف تخطيط معرفة — يحدد كثافة وعرض القراءة حسب نوع القسم. */
export function KnowledgeLayout({
  kind = "knowledge",
  className,
  children,
  ...rest
}: KnowledgeLayoutProps) {
  return (
    <div
      className={cn("kx-layout", `kx-layout--${kind}`, className)}
      data-kx-layout={kind}
      dir="rtl"
      {...rest}
    >
      {children}
    </div>
  );
}

export type KnowledgeHeroVariant = "knowledge" | "hadith" | "biography" | "library";

type KnowledgeHeroProps = {
  variant?: KnowledgeHeroVariant;
  eyebrow?: string;
  title: string;
  lead?: string;
  className?: string;
  children?: ReactNode;
};

export function KnowledgeHero({
  variant = "knowledge",
  eyebrow,
  title,
  lead,
  className,
  children,
}: KnowledgeHeroProps) {
  return (
    <header className={cn("kx-hero", `kx-hero--${variant}`, className)}>
      {eyebrow ? <p className="kx-hero__eyebrow">{eyebrow}</p> : null}
      <h1 className="kx-hero__title">{title}</h1>
      {lead ? <p className="kx-hero__lead">{lead}</p> : null}
      {children}
    </header>
  );
}

type KnowledgeLibraryCardProps = {
  href: string;
  title: string;
  description?: string;
  countLabel?: string;
  actionLabel?: string;
  className?: string;
};

export function KnowledgeLibraryCard({
  href,
  title,
  description,
  countLabel,
  actionLabel = "فتح",
  className,
}: KnowledgeLibraryCardProps) {
  return (
    <Link href={href} className={cn("kx-library-card", className)}>
      <span>
        <h3 className="kx-library-card__title">{title}</h3>
        {description ? <p className="kx-library-card__desc">{description}</p> : null}
        {countLabel ? <p className="kx-library-card__meta">{countLabel}</p> : null}
      </span>
      <span className="kx-library-card__action">{actionLabel}</span>
    </Link>
  );
}
