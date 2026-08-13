import type { ReactNode } from "react";
import { SegmentedFilter, type SegmentedFilterItem } from "@/components/filters/SegmentedFilter";

export type FilterChipItem = {
  id: string;
  label: ReactNode;
  soon?: boolean;
  disabled?: boolean;
};

type FilterChipsProps = {
  items: FilterChipItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
};

/**
 * شبكة أزرار تصفية موحّدة — غلاف على SegmentedFilter للحفاظ على الاستيرادات القديمة.
 */
export function FilterChips({
  items,
  value,
  onChange,
  ariaLabel = "تصفية",
  className,
}: FilterChipsProps) {
  return (
    <SegmentedFilter
      items={items as SegmentedFilterItem[]}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      className={["filter-chips", className].filter(Boolean).join(" ")}
      scroll={false}
    />
  );
}
