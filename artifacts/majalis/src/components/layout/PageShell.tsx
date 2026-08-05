import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** narrow = reading/content pages */
  variant?: "default" | "narrow" | "wide";
  className?: string;
};

export function PageShell({ children, variant = "default", className = "" }: Props) {
  const widthClass =
    variant === "narrow" ? "page-shell narrow ds-page mj-page" : variant === "wide" ? "page-shell wide ds-page mj-page" : "page-shell ds-page mj-page";
  return <div className={`${widthClass} ${className}`.trim()}>{children}</div>;
}
