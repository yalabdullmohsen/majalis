import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getTaskStats,
  getTodayProgress,
  PROGRESS_TASKS,
} from "@/lib/daily-progress";
import { Widget } from "@/components/widgets/Widget";

const ProgressIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" style={{ marginTop: "0.15rem", flexShrink: 0 }}>
    <polygon points="8,1 10,6 15.5,6 11,9.5 13,15 8,11.5 3,15 5,9.5 0.5,6 6,6" fill="#176B57" opacity="0.75"/>
  </svg>
);

export function HomeDailyProgress() {
  const [progress, setProgress] = useState(getTodayProgress());

  useEffect(() => {
    const refresh = () => setProgress(getTodayProgress());
    window.addEventListener("majalis-progress-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("majalis-progress-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <Widget
      id="daily-progress"
      icon={<ProgressIcon />}
      eyebrow="متابعة يومية"
      title="تقدمك اليومي"
      description="تتبع وردك وأذكارك ونوافلك، يُحفظ على جهازك."
      moreHref="/daily-wird"
      moreLabel="الورد"
      state="ready"
    >
      <div className="home-progress-grid">
        {PROGRESS_TASKS.map((task) => {
          const stats = getTaskStats(task, progress);
          return (
            <Link key={task.id} href={task.href} className="home-progress-card ui-card">
              <div className="home-progress-card__head">
                <strong>{task.label}</strong>
                <span>{stats.percent}%</span>
              </div>
              <div className="home-progress-card__bar" aria-hidden="true">
                <span style={{ "--hdp-pct": `${stats.percent}%` } as React.CSSProperties} />
              </div>
              <p className="home-progress-card__meta">
                {stats.done} من {stats.target}
                {stats.remaining > 0 ? ` · متبقٍ ${stats.remaining}` : " · مكتمل"}
              </p>
            </Link>
          );
        })}
      </div>
    </Widget>
  );
}

export default HomeDailyProgress;
