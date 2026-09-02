import {
  FIQH_DOOR_META,
  FIQH_DOOR_ORDER,
  type FiqhCanonicalDoor,
} from "@/lib/fiqh/fiqhNormalize";
import type { FiqhDoorFilter } from "@/lib/fiqh/fiqhFilters";
import { cn } from "@/lib/utils";

type Props = {
  value: FiqhDoorFilter;
  onChange: (door: FiqhDoorFilter) => void;
  className?: string;
};

const ALL_CHIP = { id: "all" as const, label: "كل الأبواب" };

export function FiqhFilters({ value, onChange, className }: Props) {
  const chips: Array<{ id: FiqhDoorFilter; label: string }> = [
    ALL_CHIP,
    ...FIQH_DOOR_ORDER.map((id: FiqhCanonicalDoor) => ({
      id,
      label: FIQH_DOOR_META[id].label,
    })),
  ];

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
