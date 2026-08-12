import { getItemCompletionScore, MIN_FIQH_COMPLETION_SCORE } from "@/lib/fiqh-verification-service";

type Props = {
  score: number;
  className?: string;
  showLabel?: boolean;
};

export function FiqhCompletionBar({ score, className = "", showLabel = true }: Props) {
  const pct = Math.max(0, Math.min(100, score));
  const tone =
    pct >= MIN_FIQH_COMPLETION_SCORE ? "fiqh-completion-bar--ok" :
    pct >= 50 ? "fiqh-completion-bar--mid" :
    "fiqh-completion-bar--low";

  return (
    <div className={`fiqh-completion-bar ${tone} ${className}`.trim()} aria-label={`درجة الاكتمال ${pct}%`}>
      {showLabel && (
        <span className="fiqh-completion-bar-label">
          اكتمال: {pct}%
        </span>
      )}
      <div className="fiqh-completion-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="fiqh-completion-bar-fill" style={{ "--fcb-pct": `${pct}%` } as React.CSSProperties} />
      </div>
    </div>
  );
}

export function FiqhCompletionBarFromItem({
  item,
  className,
}: {
  item: Parameters<typeof getItemCompletionScore>[0];
  className?: string;
}) {
  return <FiqhCompletionBar score={getItemCompletionScore(item)} className={className} />;
}
