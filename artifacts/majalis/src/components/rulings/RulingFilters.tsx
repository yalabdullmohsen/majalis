import type { RulingSortMode } from "@/lib/rulings-types";
import { RULING_SORT_LABELS } from "@/lib/rulings-types";

type Props = {
  sort: RulingSortMode;
  onSortChange: (sort: RulingSortMode) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
};

export function RulingFilters({ sort, onSortChange, showAdvanced, onToggleAdvanced }: Props) {
  return (
    <div className="ruling-filters">
      <div className="ruling-sort-row">
        {(Object.keys(RULING_SORT_LABELS) as RulingSortMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`content-hub-chip${sort === mode ? " content-hub-chip--active" : ""}`}
            onClick={() => onSortChange(mode)}
          >
            {RULING_SORT_LABELS[mode]}
          </button>
        ))}
      </div>
      <button type="button" className="ruling-advanced-toggle" onClick={onToggleAdvanced}>
        {showAdvanced ? "إخفاء التصفية المتقدمة" : "تصفية متقدمة"}
      </button>
    </div>
  );
}
