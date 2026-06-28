type Props = { pct: number; label?: string };

export function PrayerCommitmentRing({ pct, label = "الالتزام الشهري" }: Props) {
  const safe = Math.min(100, Math.max(0, pct));
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (safe / 100) * c;

  return (
    <section className="ui-card prayer-commitment-ring" aria-label={label}>
      <svg viewBox="0 0 128 128" className="prayer-commitment-ring__svg" role="img" aria-hidden>
        <circle cx="64" cy="64" r={r} className="prayer-commitment-ring__track" />
        <circle
          cx="64"
          cy="64"
          r={r}
          className="prayer-commitment-ring__progress"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="prayer-commitment-ring__label">
        <strong>{safe}%</strong>
        <span>{label}</span>
      </div>
    </section>
  );
}
