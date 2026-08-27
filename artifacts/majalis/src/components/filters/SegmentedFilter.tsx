import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FilterChip } from "./FilterChip";
import "@/styles/components/filters.css";

export type SegmentedFilterItem = {
  id: string;
  label: ReactNode;
  soon?: boolean;
  disabled?: boolean;
};

type Props = {
  items: SegmentedFilterItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
  /** تمرير أفقي عند كثرة العناصر (افتراضي true) */
  scroll?: boolean;
};

/**
 * مجموعة اختيار حصري موحّدة — Chips أفقية قابلة للتمرير.
 * بديل موحّد لـ FilterChips / content-hub-chips / page-chip-row.
 */
export function SegmentedFilter({
  items,
  value,
  onChange,
  ariaLabel = "تصفية",
  className,
  scroll = true,
}: Props) {
  return (
    <div
      className={cn(
        "mj-segmented-filter",
        scroll && "mj-segmented-filter--scroll",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <FilterChip
          key={item.id}
          label={item.label}
          active={value === item.id}
          disabled={item.disabled}
          soon={item.soon}
          onClick={() => onChange(item.id)}
        />
      ))}
    </div>
  );
}
