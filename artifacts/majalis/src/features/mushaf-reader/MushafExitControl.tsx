import { memo } from "react";

type Props = {
  onExit: () => void;
  label?: string;
};

/**
 * زر خروج ثابت على جذر القارئ — مستقل عن دورة الصفحة وشريط Chrome.
 * mount مرة واحدة؛ لا يغيّر Geometry.
 */
export const MushafExitControl = memo(function MushafExitControl({
  onExit,
  label = "الخروج من المصحف",
}: Props) {
  return (
    <button
      type="button"
      className="nm-exit-control"
      data-testid="mushaf-exit-control"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onExit();
      }}
    >
      <span className="nm-exit-control__chevron" aria-hidden="true">
        ›
      </span>
      <span className="nm-exit-control__label">{label}</span>
    </button>
  );
});
