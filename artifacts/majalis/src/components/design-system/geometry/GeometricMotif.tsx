import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type GeometricMotifProps = HTMLAttributes<HTMLSpanElement> & {
  /** زاوية Hero / Section Header فقط */
  placement?: "corner";
};

/** زخرفة هندسية خفيفة — لا تدخل ترتيب القراءة ولا تستقبل الضغط. */
export function GeometricMotif({
  placement = "corner",
  className,
  ...rest
}: GeometricMotifProps) {
  return (
    <span
      {...rest}
      className={cn("svl-motif", placement === "corner" && "svl-motif--corner", className)}
      aria-hidden="true"
      data-svl-motif={placement}
    >
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 4 L44 24 L24 44 L4 24 Z"
          stroke="currentColor"
          strokeWidth="1.25"
          fill="none"
        />
        <path
          d="M24 12 L36 24 L24 36 L12 24 Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.7"
        />
      </svg>
    </span>
  );
}
