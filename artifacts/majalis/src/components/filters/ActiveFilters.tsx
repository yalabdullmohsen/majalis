import type { ReactNode } from "react";
import { cn, toArabicDigits } from "@/lib/utils";
import { FilterResetButton } from "./FilterResetButton";

export type ActiveFilterItem = {
  id: string;
  label: ReactNode;
  onRemove?: () => void;
};

type Props = {
  items: ActiveFilterItem[];
  onClearAll?: () => void;
  resultCount?: number | null;
  className?: string;
};

/** شريط الفلاتر النشطة + عدد النتائج + مسح الكل. */
export function ActiveFilters({
  items,
  onClearAll,
  resultCount = null,
  className,
}: Props) {
  if (!items.length && resultCount == null) return null;

  return (
    <div className={cn("mj-active-filters", className)} aria-live="polite">
      {resultCount != null && (
        <p className="mj-active-filters__count">
          {resultCount === 0
            ? "لا توجد نتائج مطابقة"
            : `${toArabicDigits(resultCount)} ${resultCount === 1 ? "نتيجة" : "نتائج"}`}
        </p>
      )}
      {items.length > 0 && (
        <div className="mj-active-filters__row">
          <ul className="mj-active-filters__list">
            {items.map((item) => (
              <li key={item.id}>
                {item.onRemove ? (
                  <button
                    type="button"
                    className="mj-active-filters__pill"
                    onClick={item.onRemove}
                    aria-label={`إزالة ${typeof item.label === "string" ? item.label : "فلتر"}`}
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ) : (
                  <span className="mj-active-filters__pill is-static">{item.label}</span>
                )}
              </li>
            ))}
          </ul>
          {items.length > 1 && onClearAll ? (
            <FilterResetButton onClick={onClearAll} />
          ) : null}
        </div>
      )}
    </div>
  );
}
