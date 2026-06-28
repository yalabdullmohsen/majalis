import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { usePrayerTracker } from "@/hooks/usePrayerTracker";

export default function PrayerAchievementsPage() {
  const { achievements, stats } = usePrayerTracker();
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="page-shell prayer-achievements-page">
      <PageHeader
        eyebrow="العبادة"
        title="إنجازات الصلاة"
        subtitle={`${earnedCount} من ${achievements.length} إنجاز — استمر في المحافظة`}
      />

      <nav className="prayer-subnav" aria-label="أقسام الصلاة">
        <Link href="/prayer-times">المواقيت</Link>
        <Link href="/prayer-achievements" className="is-active">الإنجازات</Link>
        <Link href="/prayer-log">سجل الصلوات</Link>
        <Link href="/prayer-ranks">مراتب الخشوع</Link>
      </nav>

      <div className="prayer-achievements-summary ui-card">
        <span>المستوى {stats.level}</span>
        <span>{stats.totalPoints.toLocaleString("ar-KW")} نقطة</span>
        <span>{stats.longestStreak} يوم متتالي</span>
      </div>

      <div className="prayer-achievements-grid">
        {achievements.map((a) => (
          <article
            key={a.key}
            className={`ui-card prayer-achievement-card${a.earned ? " is-earned" : ""}`}
          >
            <span className="prayer-achievement-card__emoji">{a.earned ? a.emoji : "🔒"}</span>
            <h3>{a.title}</h3>
            <p>{a.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
