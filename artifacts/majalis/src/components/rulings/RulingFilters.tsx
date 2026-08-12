import type { RulingSortMode } from "@/lib/rulings-types";
import { RULING_SORT_LABELS } from "@/lib/rulings-types";
import { ExclusiveChoiceGroup } from "@/components/ui/ExclusiveChoiceGroup";

type Props = {
  sort: RulingSortMode;
  onSortChange: (sort: RulingSortMode) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
};

export function RulingFilters({ sort, onSortChange, showAdvanced, onToggleAdvanced }: Props) {
  return (
    <div className="ruling-filters">
      <ExclusiveChoiceGroup
        className="ruling-sort-row"
        ariaLabel="ترتيب الأحكام"
        value={sort}
        onChange={(id) => onSortChange(id as RulingSortMode)}
        items={(Object.keys(RULING_SORT_LABELS) as RulingSortMode[]).map((mode) => ({
          id: mode,
          label: RULING_SORT_LABELS[mode],
        }))}
      />
      <button type="button" className="ruling-advanced-toggle" onClick={onToggleAdvanced}>
        {showAdvanced ? "إخفاء التصفية المتقدمة" : "تصفية متقدمة"}
      </button>
    </div>
  );
}
