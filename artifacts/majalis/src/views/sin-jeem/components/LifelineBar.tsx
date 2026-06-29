import { LIFELINES } from "@/lib/sin-jeem/constants";
import type { LifelineType } from "@/lib/sin-jeem/types";
import { SjIcon, type SjIconName } from "@/components/sin-jeem/SjIcon";

interface LifelineBarProps {
  available: Record<LifelineType, boolean>;
  onUse: (type: LifelineType) => void;
  disabled?: boolean;
}

export function LifelineBar({ available, onUse, disabled }: LifelineBarProps) {
  return (
    <div className="sj-lifelines">
      {LIFELINES.map((l) => (
        <button
          key={l.type}
          type="button"
          className="sj-lifeline"
          disabled={disabled || !available[l.type]}
          onClick={() => onUse(l.type)}
          title={l.label}
        >
          <SjIcon name={l.icon as SjIconName} size={16} />
          {l.label}
        </button>
      ))}
    </div>
  );
}
