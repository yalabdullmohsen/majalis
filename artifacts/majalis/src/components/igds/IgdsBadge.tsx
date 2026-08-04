import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "brand" | "accent" | "muted";
  className?: string;
};

export function IgdsBadge({ children, tone = "brand", className }: Props) {
  const cn = [
    "igds-badge",
    tone === "accent" ? "igds-badge--accent" : "",
    tone === "muted" ? "igds-badge--muted" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return <span className={cn}>{children}</span>;
}
