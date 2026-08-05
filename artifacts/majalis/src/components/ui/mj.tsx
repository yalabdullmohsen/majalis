import type { ReactNode } from "react";
import { goBackOrFallback } from "@/lib/navigation-back";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  showBack = true,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  className?: string;
}) {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  return (
    <header className={cn("mj-page-head", className)} dir="rtl">
      {showBack ? (
        <button
          type="button"
          className="mj-btn mj-btn--ghost"
          style={{ marginBottom: "var(--mj-s3)", padding: "8px 14px", fontSize: "var(--mj-fs-small)" }}
          onClick={() => goBackOrFallback(currentPath)}
          aria-label="رجوع"
        >
          → رجوع
        </button>
      ) : null}
      {eyebrow ? <p className="mj-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  );
}

export function Card({
  children,
  className,
  link,
  raised,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  link?: boolean;
  raised?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn("mj-card", link && "mj-card--link", raised && "mj-card--raised", className)}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

export function ListRow({
  title,
  subtitle,
  trailing,
  onClick,
  className,
  disabled,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={cn("mj-row", className)} onClick={onClick} disabled={disabled}>
      <span>
        <b style={{ fontWeight: 500 }}>{title}</b>
        {subtitle ? <em>{subtitle}</em> : null}
      </span>
      {trailing}
    </button>
  );
}

export function Button({
  children,
  variant = "primary",
  pill,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "soft";
  pill?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "mj-btn",
        variant === "ghost" && "mj-btn--ghost",
        variant === "soft" && "mj-btn--soft",
        pill && "mj-btn--pill",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mj-badge",
        tone === "brand" && "mj-badge--brand",
        tone === "accent" && "mj-badge--accent",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("mj-progress", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SearchField({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="search" className={cn("mj-search", className)} {...props} />;
}

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mj-empty", className)}>
      <div className="mj-dot" />
      <b>{title}</b>
      {description ? <span>{description}</span> : null}
    </div>
  );
}
