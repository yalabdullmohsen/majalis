import { Lightbulb } from "lucide-react";
import { Link } from "wouter";
import {
  contentKindLabel,
  getPublishableLearningSeasons,
  type LearningSeasonCard,
} from "@/lib/religious-content";
import "@/styles/components/home/home-learning-seasons.css";

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isActive(season: LearningSeasonCard): boolean {
  const now = new Date();
  return now >= season.startDate && now <= season.endDate;
}

export function HomeLearningSeasonsWidget() {
  // المواسم من السجلات الموثّقة فقط — لا تخمين لغوي ولا ربط الهجرة بمحرّم
  const seasons = getPublishableLearningSeasons();
  const now = new Date();

  const active = seasons.find((s) => isActive(s));
  const upcoming = seasons
    .filter((s) => s.startDate > now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 3);

  const featured = active ?? upcoming[0];
  if (!featured) return null;

  const days = daysUntil(featured.startDate);
  const isNow = isActive(featured);

  return (
    <section className="lsw-section ds-section">
      <div className="ds-section__head">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20">
            <polygon points="10,1 12.5,7 19,7 14,11 16,18 10,14 4,18 6,11 1,7 7.5,7" fill="none" stroke="#143F35" strokeWidth="1.3"/>
            <circle cx="10" cy="10" r="3" fill="none" stroke="#143F35" strokeWidth="0.9"/>
          </svg>
          <h2 className="ds-section__title">مواسم التعلّم</h2>
        </div>
        <span className="lsw-badge">موثّق</span>
      </div>

      <div className={`lsw-featured lsw--month-${featured.hijriMonth}`} style={{ position: "relative", overflow: "hidden" }}>
        <svg aria-hidden="true" style={{ position: "absolute", top: "-15px", left: "-15px", opacity: 0.07, pointerEvents: "none" }} width="100" height="100" viewBox="0 0 100 100">
          <polygon points="50,5 62,35 92,35 68,55 78,85 50,65 22,85 32,55 8,35 38,35" fill="white"/>
          <circle cx="50" cy="50" r="18" fill="none" stroke="white" strokeWidth="1.5"/>
        </svg>
        <div className="lsw-featured__header">
          <div>
            <span className="lsw-featured__name">
              {featured.arabicName}
            </span>
            <p className="lsw-featured__desc">{featured.description}</p>
            <span
              className={`religious-kind-badge religious-kind-badge--${featured.contentKind}`}
            >
              {contentKindLabel(featured.contentKind)}
            </span>
          </div>
          <div className="lsw-featured__countdown">
            {isNow ? (
              <span className="lsw-featured__now">الآن</span>
            ) : (
              <span className="lsw-featured__days">
                <strong>{days}</strong>
                <span>يوم</span>
              </span>
            )}
          </div>
        </div>
        <p className="lsw-featured__suggestion">
          <Lightbulb size={14} className="inline ms-1" />
          <strong>
            {featured.contentKind === "personal_suggestion" ? "اقتراح تنظيمي:" : "اقتراح:"}
          </strong>{" "}
          {featured.suggestion}
        </p>
        {featured.caveat ? (
          <p className="lsw-featured__caveat">{featured.caveat}</p>
        ) : null}
        <p className="lsw-featured__source">المصدر: {featured.sourceName}</p>
        <Link href={featured.href} className="lsw-featured__cta">
          ابدأ الآن ←
        </Link>
      </div>

      {upcoming.length > 1 && (
        <div className="lsw-mini-list">
          {upcoming.slice(active ? 0 : 1).map((s) => {
            const d = daysUntil(s.startDate);
            return (
              <div key={s.id} className={`lsw-mini-item lsw--month-${s.hijriMonth}`}>
                <span className="lsw-mini-item__dot" />
                <span className="lsw-mini-item__name">{s.arabicName}</span>
                <span className="lsw-mini-item__days">{d} يوم</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
