import { useEffect, useMemo, useState } from "react";

type Props = {
  percentage: number;
  label?: string;
  className?: string;
};

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * حلقة تقدم دائرية — CSS فقط (بلا مكتبات حركة خارجية).
 * أخضر عند ≥80٪، ذهبي تحته.
 */
export function CircularProgress({
  percentage,
  label = "نسبة الإتقان",
  className = "",
}: Props) {
  const target = useMemo(
    () => Math.max(0, Math.min(100, Math.round(percentage))),
    [percentage],
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setProgress(target);
      return;
    }
    const timer = window.setTimeout(() => setProgress(target), 300);
    return () => window.clearTimeout(timer);
  }, [target]);

  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
  const strokeColor = progress >= 80 ? "var(--rai-emerald, #16a34a)" : "var(--rai-gold, #c9a227)";

  return (
    <div className={`rai-circular-progress ${className}`.trim()} dir="rtl">
      <div className="rai-circular-progress__ring" aria-hidden="true">
        <svg className="rai-circular-progress__svg" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="transparent"
            stroke="var(--rai-ring-track, rgba(14,110,82,.12))"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="rai-circular-progress__arc"
          />
        </svg>
        <div className="rai-circular-progress__center">
          <span className="rai-circular-progress__value">{progress}%</span>
          <span className="rai-circular-progress__label">{label}</span>
        </div>
      </div>
    </div>
  );
}
