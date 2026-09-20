import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type GeometricDividerProps = HTMLAttributes<HTMLDivElement>;

/** فاصل هندسي بين الأقسام الرئيسية فقط — ليس بين كل فقرة. */
export function GeometricDivider({ className, ...rest }: GeometricDividerProps) {
  return (
    <div
      {...rest}
      className={cn("svl-divider", className)}
      role="separator"
      aria-hidden="true"
      data-svl-divider="1"
    >
      <span className="svl-divider__line" />
      <span className="svl-divider__mark" />
      <span className="svl-divider__line" />
    </div>
  );
}
