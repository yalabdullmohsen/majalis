import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
 * شبكة أزرار تصفية مستطيلة — بلا شكل بيضوي، أهداف لمس ≥44px.
 */
export function FilterChips({
  items,
  value,
  onChange,
  ariaLabel = "تصفية",
  className,
}: FilterChipsProps) {
  return (
    <div
      className={cn("filter-chips", className)}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={item.disabled}
            className={cn("filter-chips__chip", active && "is-active")}
            onClick={() => onChange(item.id)}
          >
            <span className="filter-chips__label">{item.label}</span>
            {item.soon ? <span className="filter-chips__soon">قريبًا</span> : null}
          </button>
        );
      })}
    </div>
  );
}
