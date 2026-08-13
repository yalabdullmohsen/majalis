import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FilterChipProps = {
  label: ReactNode;
  active?: boolean;
  disabled?: boolean;
  soon?: boolean;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
};

/** شريحة فلتر موحّدة — هدف لمس ≥44px، حالة نشطة واضحة. */
export function FilterChip({
  label,
  active = false,
  disabled = false,
  soon = false,
  onClick,
  className,
  "aria-label": ariaLabel,
}: FilterChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn("mj-filter-chip", active && "is-active", className)}
      onClick={onClick}
    >
      <span className="mj-filter-chip__label">{label}</span>
      {soon ? <span className="mj-filter-chip__soon">قريبًا</span> : null}
    </button>
  );
}
