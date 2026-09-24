/**
 * اختيار وضع عرض المصحف — بطاقات تحديد (SYSTEM / LIGHT / DARK).
 * للمصحف فقط؛ لا يغيّر Theme التطبيق.
 */
import { Check } from "lucide-react";
import {
  MUSHAF_DISPLAY_MODE_OPTIONS,
  type MushafAppearanceMode,
} from "@/lib/mushaf-v2/appearance-prefs";
import "./mushaf-display-mode-control.css";

type Props = {
  value: MushafAppearanceMode;
  onChange: (mode: MushafAppearanceMode) => void;
  /** عنوان القسم الظاهر للمستخدم */
  title?: string;
  className?: string;
};

export function MushafDisplayModeControl({
  value,
  onChange,
  title = "وضع عرض المصحف",
  className = "",
}: Props) {
  return (
    <section
      className={`mushaf-display-mode ${className}`.trim()}
      aria-labelledby="mushaf-display-mode-title"
      data-testid="mushaf-display-mode"
    >
      <h3 id="mushaf-display-mode-title" className="mushaf-display-mode__title">
        {title}
      </h3>
      <div className="mushaf-display-mode__grid" role="radiogroup" aria-label={title}>
        {MUSHAF_DISPLAY_MODE_OPTIONS.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              data-testid={`mushaf-display-mode-${opt.id}`}
              className={`mushaf-display-mode__card${active ? " is-active" : ""}`}
              onClick={() => onChange(opt.id)}
            >
              <span className="mushaf-display-mode__card-top">
                <span className="mushaf-display-mode__label">{opt.label}</span>
                {active ? <Check size={16} strokeWidth={2.2} aria-hidden="true" /> : null}
              </span>
              <span className="mushaf-display-mode__desc">{opt.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
