import { Link } from "wouter";
import {
  buildHadithStatsSnapshot,
  formatHadithNamedPct,
  formatHadithStat,
  type HadithStatsSnapshot,
} from "@/lib/hadith-stats";

function toneClass(tone?: string): string {
  return tone ? `hsp-tone--${tone}` : "";
}

type Props = {
  compact?: boolean;
  className?: string;
  snapshot?: HadithStatsSnapshot;
};

export function HadithStatsPanel({ compact = false, className = "", snapshot }: Props) {
  const stats = snapshot ?? buildHadithStatsSnapshot();

  return (
    <section
      className={`hsp ${compact ? "hsp--compact" : ""} ${className}`.trim()}
      aria-label="إحصائيات علوم الحديث"
    >
      <header className="hsp__head">
        <div>
          <p className="hsp__title" role="heading" aria-level={2}>
            الصحيحان بالأرقام المنقولة
          </p>
          <p className="hsp__subtitle">{stats.updatedLabel}</p>
        </div>
        {!compact && (
          <Link href="/hadith-science" className="hsp__science-link">
            مصطلح الحديث
          </Link>
        )}
      </header>

      <div className="hsp-kpi-grid" role="list">
        {stats.kpis.map((kpi) => {
          const body = (
            <>
              <strong className="hsp-kpi__value">{formatHadithStat(kpi.value)}</strong>
              <span className="hsp-kpi__label">{kpi.label}</span>
              {kpi.hint ? <span className="hsp-kpi__hint">{kpi.hint}</span> : null}
              {kpi.sourceLine ? (
                <span className="hsp-kpi__source" title={kpi.note ?? kpi.sourceLine}>
                  المصدر: {kpi.sourceLine}
                </span>
              ) : null}
              {kpi.namedRatio ? (
                <span className="hsp-kpi__pct" title={`${kpi.namedRatio.part} من ${kpi.namedRatio.whole}`}>
                  {kpi.namedRatio.label}:{" "}
                  {formatHadithNamedPct(kpi.namedRatio.part, kpi.namedRatio.whole)}
                </span>
              ) : null}
            </>
          );
          const cls = `hsp-kpi ${toneClass(kpi.tone)}`;
          if (kpi.href) {
            return (
              <Link key={kpi.id} href={kpi.href} className={`${cls} hsp-kpi--link`} role="listitem">
                {body}
              </Link>
            );
          }
          return (
            <div key={kpi.id} className={cls} role="listitem">
              {body}
            </div>
          );
        })}
      </div>

      {!compact && (
        <>
          <div className="hsp-methods" aria-label="طرق البحث">
            {stats.methods.map((m) => (
              <span key={m} className="hsp-method">
                {m}
              </span>
            ))}
          </div>
          <p className="hsp__disclaimer">{stats.disclaimer}</p>
        </>
      )}
    </section>
  );
}

export default HadithStatsPanel;
