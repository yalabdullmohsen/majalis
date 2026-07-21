import { useReadingProgress } from "@/hooks/useReadingProgress";

export function ReadingProgressBar() {
  const pct = useReadingProgress();
  if (pct <= 0) return null;
  return (
    <div
      className="reading-progress-bar"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`تقدم القراءة: ${pct}%`}
      style={{ "--rpb-pct": `${pct}%` } as React.CSSProperties}
    />
  );
}
