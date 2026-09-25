/**
 * بطاقة موضوع/حقيقة داخل قصة النبي — نص داكن على فاتح (وليلي عكسي).
 */
import type { CSSProperties, ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  wide?: boolean;
  meterPct?: number;
  className?: string;
};

export function ProphetTopicCard({ label, value, wide, meterPct, className = "" }: Props) {
  const classes = [
    "prophet-fact-card",
    "prophet-fact-card--interactive",
    "prophet-topic-card",
    wide ? "prophet-fact-card--wide" : "",
    meterPct != null ? "prophet-fact-card--meter" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      data-component="ProphetTopicCard"
      data-testid="prophet-topic-card"
      style={meterPct != null ? ({ "--meter": `${meterPct}%` } as CSSProperties) : undefined}
    >
      <span className="prophet-fact-card__label">{label}</span>
      <span className="prophet-fact-card__value">{value}</span>
      {meterPct != null ? (
        <div className="prophet-fact-card__ring" aria-hidden="true" />
      ) : null}
    </div>
  );
}
