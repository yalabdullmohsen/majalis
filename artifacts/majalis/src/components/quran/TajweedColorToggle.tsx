/**
 * Compact Tajweed color-coding toggle bound to QuranEngineContext.
 * Used in mushaf settings and QuranViewer chrome.
 */
import { useQuranEngineCore } from "@/core/quran/QuranEngineContext";

export type TajweedColorToggleProps = {
  className?: string;
  /** Compact label for toolbar chips. */
  compact?: boolean;
};

export function TajweedColorToggle({ className, compact = false }: TajweedColorToggleProps) {
  const { isTajweedEnabled, toggleTajweed } = useQuranEngineCore();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isTajweedEnabled}
      className={`mpv-chip tajweed-toggle ${isTajweedEnabled ? "is-active" : ""} ${className ?? ""}`.trim()}
      onClick={() => toggleTajweed()}
    >
      {compact ? "تجويد ملوّن" : "تفعيل تلوين أحكام التجويد"}
      <span className="tajweed-toggle__state" aria-hidden="true">
        {isTajweedEnabled ? "تشغيل" : "إيقاف"}
      </span>
    </button>
  );
}

export default TajweedColorToggle;
