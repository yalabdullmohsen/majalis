import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type IconMedallionProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

/** إطار أيقونة هندسي بسيط — Headers / Empty States · لا لكل بطاقة. */
export function IconMedallion({ children, className, "aria-hidden": ariaHidden = true, ...rest }: IconMedallionProps) {
  return (
    <span
      {...rest}
      className={cn("svl-medallion", className)}
      aria-hidden={ariaHidden}
      data-svl-medallion="1"
    >
      {children}
    </span>
  );
}
