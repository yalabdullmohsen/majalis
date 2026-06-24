import { FONT_OPTIONS } from "@/lib/font-preference";
import { useFontPreference } from "./FontPreferenceProvider";

type FontSelectorProps = {
  compact?: boolean;
};

export function FontSelector({ compact = false }: FontSelectorProps) {
  const { preference, setPreference } = useFontPreference();

  return (
    <div
      className={compact ? "font-selector font-selector-compact" : "font-selector"}
      role="group"
      aria-label="اختيار نوع الخط"
    >
      {!compact && <span className="font-selector-label">نوع الخط</span>}
      <div className="font-selector-options">
        {FONT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`font-selector-btn${preference === option.id ? " is-active" : ""}`}
            aria-pressed={preference === option.id}
            title={option.description}
            onClick={() => setPreference(option.id)}
          >
            {compact ? option.label.slice(0, 1) : option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
