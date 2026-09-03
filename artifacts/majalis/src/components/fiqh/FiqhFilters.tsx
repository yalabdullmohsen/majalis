import {
  FIQH_FILTER_CHIP_ORDER,
  fiqhFilterChipLabel,
  type FiqhCanonicalDoor,
} from "@/lib/fiqh/fiqhNormalize";
import type { FiqhDoorFilter } from "@/lib/fiqh/fiqhFilters";
import { cn } from "@/lib/utils";

type Props = {
  value: FiqhDoorFilter;
  onChange: (door: FiqhDoorFilter) => void;
  className?: string;
};

export function FiqhFilters({ value, onChange, className }: Props) {
  const chips = FIQH_FILTER_CHIP_ORDER.map((id) => ({
    id: id as FiqhDoorFilter,
    label: fiqhFilterChipLabel(id as FiqhCanonicalDoor | "all"),
  }));

  return (
    <div className={cn("fiqh-filters", className)} role="group" aria-label="فلترة أبواب الفقه">
      {chips.map((chip) => (
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
