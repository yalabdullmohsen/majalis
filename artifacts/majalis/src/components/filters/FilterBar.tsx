import type { ReactNode } from "react";
import { cn, toArabicDigits } from "@/lib/utils";
import { FilterToggle } from "./FilterSheet";
import { FilterResetButton } from "./FilterResetButton";

type Props = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  onSearchSubmit?: () => void;
  suggestions?: string[];
  showSuggestions?: boolean;
  onSuggestionPick?: (value: string) => void;
  onSuggestionsOpenChange?: (open: boolean) => void;
  activeCount?: number;
  onOpenFilters?: () => void;
  filtersOpen?: boolean;
  filterToggleLabel?: string;
  onClearAll?: () => void;
  trailing?: ReactNode;
  className?: string;
  /** قائمة اقتراحات البحث (listbox id) */
  listboxId?: string;
};

/**
 * شريط بحث + فتح ورقة الفلاتر + مسح — الواجهة الثابتة أعلى القوائم.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "ابحث…",
  searchAriaLabel = "بحث",
  onSearchSubmit,
  suggestions = [],
  showSuggestions = false,
  onSuggestionPick,
  onSuggestionsOpenChange,
  activeCount = 0,
  onOpenFilters,
  filtersOpen = false,
  filterToggleLabel = "تصفية",
  onClearAll,
  trailing,
  className,
  listboxId = "mj-filter-bar-listbox",
}: Props) {
  return (
    <div className={cn("mj-filter-bar", className)}>
      <form
        className="mj-filter-bar__search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit?.();
          onSuggestionsOpenChange?.(false);
        }}
      >
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => onSuggestionsOpenChange?.(true)}
          onBlur={() => window.setTimeout(() => onSuggestionsOpenChange?.(false), 150)}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          role="combobox"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-haspopup="listbox"
          autoComplete="off"
          enterKeyHint="search"
          dir="rtl"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul id={listboxId} className="mj-filter-bar__suggestions" role="listbox" aria-label="اقتراحات البحث">
            {suggestions.map((item) => (
              <li key={item} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSuggestionPick?.(item);
                    onSuggestionsOpenChange?.(false);
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="mj-filter-bar__actions">
        {activeCount > 0 && onClearAll ? (
          <FilterResetButton onClick={onClearAll} label="مسح" />
        ) : null}
        {onOpenFilters ? (
          <div className="mj-filter-bar__toggle-wrap">
            <FilterToggle
              onClick={onOpenFilters}
              label={filterToggleLabel}
              expanded={filtersOpen}
            />
            {activeCount > 0 ? (
              <span className="mj-filter-bar__badge" aria-label={`${toArabicDigits(activeCount)} تصفية نشطة`}>
                {toArabicDigits(activeCount)}
              </span>
            ) : null}
          </div>
        ) : null}
        {trailing}
      </div>
    </div>
  );
}
