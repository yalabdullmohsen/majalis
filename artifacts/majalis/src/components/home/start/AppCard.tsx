import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  "aria-label"?: string;
  "data-testid"?: string;
};

export function AppCard({
  children,
  className,
  as: Tag = "div",
  "aria-label": ariaLabel,
  "data-testid": testId,
}: Props) {
  return (
    <Tag
      className={["mj-app-card", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </Tag>
  );
}
