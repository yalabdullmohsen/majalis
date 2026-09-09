import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AppCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  /** سطح فاتح (افتراضي) أو تمييز ذهبي ناعم */
  tone?: "default" | "accent" | "muted";
  padding?: "md" | "sm" | "none";
  children?: ReactNode;
};

/**
 * بطاقة تطبيق موحّدة — soft-card على سطح فاتح، حواف 24px، ظل خفيف.
 */
export function AppCard({
  as: Tag = "article",
  tone = "default",
  padding = "md",
  className,
  children,
  ...rest
}: AppCardProps) {
  return (
    <Tag
      data-app-card="1"
      className={cn(
        "soft-card soft-card--on-light ss-app-card",
        tone === "accent" && "soft-card--accent",
        tone === "muted" && "ss-app-card--muted",
        padding === "sm" && "ss-app-card--pad-sm",
        padding === "none" && "ss-app-card--pad-none",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
