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
 * صف شرائح تصفية أفقي قابل للتمرير بهوية --mj.
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
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
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
