import {
  FIQH_GROUP_FILTER_CHIPS,
  type FiqhHubGroupFilter,
} from "@/lib/fiqh/fiqhNormalize";
import { cn } from "@/lib/utils";

type Props = {
  value: FiqhHubGroupFilter;
  onChange: (group: FiqhHubGroupFilter) => void;
  className?: string;
};

export function FiqhFilters({ value, onChange, className }: Props) {
  return (
    <div className={cn("fiqh-filters fiqh-filters--groups", className)} role="group" aria-label="فلترة أبواب الفقه">
      {FIQH_GROUP_FILTER_CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={cn("fiqh-filters__chip", value === chip.id && "is-active")}
          aria-pressed={value === chip.id}
          onClick={() => onChange(chip.id)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
