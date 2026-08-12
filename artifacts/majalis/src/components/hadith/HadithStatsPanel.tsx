import { Link } from "wouter";
import {
  buildHadithStatsSnapshot,
  formatHadithPct,
  formatHadithStat,
  ringConicGradient,
  type HadithRingSlice,
  type HadithStatBar,
  type HadithStatsSnapshot,
} from "@/lib/hadith-stats";

function toneClass(tone: HadithStatBar["tone"]): string {
  return `hsp-tone--${tone}`;
}

function StatBar({ bar }: { bar: HadithStatBar }) {
  const pct = bar.total > 0 ? Math.min(100, (bar.value / bar.total) * 100) : 0;
  const isPercentScale = bar.total === 100;
  const valueLabel = isPercentScale
    ? formatHadithPct(bar.value, 100)
    : formatHadithStat(bar.value);
  const noteLabel = bar.note
    ? bar.note
    : isPercentScale
      ? null
      : `/ ${formatHadithStat(bar.total)}`;
  const inner = (
    <>
      <div className="hsp-bar__head">
        <span className="hsp-bar__label">{bar.label}</span>
        <span className="hsp-bar__value">
          {valueLabel}
          {noteLabel ? <small>{` · ${noteLabel}`}</small> : null}
        </span>
      </div>
      <div className="hsp-bar__track" aria-hidden="true">
        <div className={`hsp-bar__fill ${toneClass(bar.tone)}`} style={{ width: `${pct}%` }} />
      </div>
    </>
  );
  if (bar.href) {
    return (
      <Link href={bar.href} className="hsp-bar hsp-bar--link">
        {inner}
      </Link>
    );
  }
  return <div className="hsp-bar">{inner}</div>;
}

function StatRing({
  title,
  slices,
  centerValue,
  centerLabel,
}: {
  title: string;
  slices: HadithRingSlice[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="hsp-ring-card">
      <p className="hsp-panel__title" role="heading" aria-level={3}>
        {title}
      </p>
      <div className="hsp-ring-layout">
        <div
          className="hsp-ring"
          style={{ background: ringConicGradient(slices) }}
          role="img"
          aria-label={`${title}: ${slices.map((s) => `${s.label} ${formatHadithPct(s.value, total)}`).join("، ")}`}
        >
          <div className="hsp-ring__hole">
            <strong>{centerValue}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>
        <ul className="hsp-ring-legend">
          {slices.map((slice) => {
            const body = (
              <>
                <i className={`hsp-dot ${toneClass(slice.tone)}`} aria-hidden="true" />
                <span className="hsp-ring-legend__label">{slice.label}</span>
                <span className="hsp-ring-legend__meta">
                  {formatHadithStat(slice.value)}
                  <small>{formatHadithPct(slice.value, total)}</small>
                </span>
              </>
            );
            return (
              <li key={slice.id}>
                {slice.href ? (
                  <Link href={slice.href} className="hsp-ring-legend__link">
                    {body}
                  </Link>
                ) : (
                  <div className="hsp-ring-legend__row">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
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
          {/* عنوان غير h2 لتفادي قواعد .page-shell h2 الداكنة عالية الخصوصية */}
          <p className="hsp__title" role="heading" aria-level={2}>
            علوم الحديث بالأرقام
          </p>
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
              <strong className="hsp-kpi__value">
                {formatHadithStat(kpi.value)}
                {kpi.suffix ?? ""}
              </strong>
              <span className="hsp-kpi__label">{kpi.label}</span>
              {kpi.hint && <span className="hsp-kpi__hint">{kpi.hint}</span>}
              {kpi.pctOf != null && (
                <span className="hsp-kpi__pct">{formatHadithPct(kpi.value, kpi.pctOf)}</span>
              )}
            </>
          );
          const cls = `hsp-kpi ${kpi.tone ? toneClass(kpi.tone) : ""}`;
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
          <div className="hsp-rings">
            <StatRing
              title="توزيع الصحيحين"
              slices={stats.sahihaynRing}
              centerValue={formatHadithStat(
                stats.sahihaynRing.reduce((n, s) => n + s.value, 0),
              )}
              centerLabel="حديث"
            />
            <StatRing
              title="توزيع الروايات المبيَّنة"
              slices={stats.curatedRing}
              centerValue={formatHadithStat(
                stats.curatedRing.reduce((n, s) => n + s.value, 0),
              )}
              centerLabel="رواية"
            />
            <StatRing
              title="مصطلح الحديث"
              slices={stats.mustalahRing}
              centerValue={formatHadithStat(
                stats.mustalahRing.reduce((n, s) => n + s.value, 0),
              )}
              centerLabel="مصطلح"
            />
          </div>

          <div className="hsp-panels">
            <div className="hsp-panel">
              <p className="hsp-panel__title" role="heading" aria-level={3}>توزيع الأقسام</p>
              <div className="hsp-bars">
                {stats.authenticityBars.map((bar) => (
                  <StatBar key={bar.id} bar={bar} />
                ))}
              </div>
            </div>
            <div className="hsp-panel">
              <p className="hsp-panel__title" role="heading" aria-level={3}>نِسب الصحيحين والكتب</p>
              <div className="hsp-bars">
                {stats.sahihaynBars.map((bar) => (
                  <StatBar key={bar.id} bar={bar} />
                ))}
              </div>
            </div>
            <div className="hsp-panel">
              <p className="hsp-panel__title" role="heading" aria-level={3}>علوم الحديث ومصطلحه</p>
              <div className="hsp-bars">
                {stats.scienceBars.map((bar) => (
                  <StatBar key={bar.id} bar={bar} />
                ))}
              </div>
            </div>
          </div>

          <div className="hsp-coverage" role="list">
            {stats.coverage.map((c) => (
              <div key={c.label} className="hsp-coverage__item" role="listitem">
                <strong>{c.value}</strong>
                <span>{c.label}</span>
                <small>{c.hint}</small>
              </div>
            ))}
          </div>

          <div className="hsp-methods" aria-label="طرق البحث الحديثة">
            {stats.methods.map((m) => (
              <span key={m} className="hsp-method">{m}</span>
            ))}
          </div>

          <p className="hsp__disclaimer">{stats.disclaimer}</p>
        </>
      )}
    </section>
  );
}

export default HadithStatsPanel;
