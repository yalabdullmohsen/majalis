"use client";

import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { useUserActivity } from "@/components/UserActivityProvider";
import { getUnlockedAchievements, ACHIEVEMENTS, getAchievementProgress } from "@/lib/achievements";
import { readFavorites } from "@/lib/local-favorites";
import { readFollows } from "@/lib/follows";
import { useMemo } from "react";

function ActivityRow({ label, item }: { label: string; item: { title: string; href: string; meta?: string } | null }) {
  if (!item) {
    return (
      <div className="profile-activity-row profile-activity-row--empty">
        <span>{label}</span>
        <em>لا يوجد بعد</em>
      </div>
    );
  }
  return (
    <Link href={item.href} className="profile-activity-row">
      <span>{label}</span>
      <div>
        <strong>{item.title}</strong>
        {item.meta && <small>{item.meta}</small>}
      </div>
    </Link>
  );
}

export default function ProfilePage() {
  const { activity } = useUserActivity();
  const favorites = useMemo(() => readFavorites(), [activity.stats.totalVisits]);
  const follows = useMemo(() => readFollows(), [activity.stats.totalVisits]);
  const achievements = useMemo(() => getUnlockedAchievements(favorites.length), [favorites.length, activity]);
  const progress = getAchievementProgress();

  const savedLessons = favorites.filter((f) => f.type === "lesson");
  const savedStories = favorites.filter((f) => f.type === "surah-story");
  const savedQa = favorites.filter((f) => f.type === "qa");

  return (
    <div className="platform-page profile-page">
      <PageHeader
        eyebrow="حسابك"
        title="لوحتي الشخصية"
        subtitle="آخر نشاطك، محفوظاتك، إنجازاتك، وإحصائيات استخدامك"
      />

      <div className="profile-stats-bar">
        <div className="profile-stat">
          <strong>{activity.streakDays}</strong>
          <span>يوم متتالي</span>
        </div>
        <div className="profile-stat">
          <strong>{progress.unlocked}/{progress.total}</strong>
          <span>إنجاز</span>
        </div>
        <div className="profile-stat">
          <strong>{favorites.length}</strong>
          <span>محفوظ</span>
        </div>
        <div className="profile-stat">
          <strong>{follows.length}</strong>
          <span>متابَع</span>
        </div>
      </div>

      <section className="platform-section">
        <h2 className="platform-section-title">آخر نشاط</h2>
        <div className="profile-activity-list">
          <ActivityRow label="آخر قراءة" item={activity.lastRead} />
          <ActivityRow label="آخر سؤال" item={activity.lastQa} />
          <ActivityRow label="آخر سورة" item={activity.lastSurah} />
          <ActivityRow label="آخر درس" item={activity.lastLesson} />
        </div>
        <Link href="/continue" className="platform-link-btn">واصل من حيث توقفت ←</Link>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">المحفوظات</h2>
        <div className="profile-saved-grid">
          <Link href="/favorites?type=lesson" className="profile-saved-card">
            <strong>{savedLessons.length}</strong>
            <span>دروس محفوظة</span>
          </Link>
          <Link href="/favorites?type=surah-story" className="profile-saved-card">
            <strong>{savedStories.length}</strong>
            <span>قصص سور</span>
          </Link>
          <Link href="/favorites?type=qa" className="profile-saved-card">
            <strong>{savedQa.length}</strong>
            <span>أسئلة مفضلة</span>
          </Link>
          <Link href="/favorites" className="profile-saved-card">
            <strong>{favorites.length}</strong>
            <span>كل المفضلة</span>
          </Link>
        </div>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">الإنجازات</h2>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = achievements.some((u) => u.id === a.id);
            return (
              <div key={a.id} className={`achievement-card${unlocked ? " achievement-card--unlocked" : ""}`}>
                <span className="achievement-card__icon" aria-hidden="true">{a.icon}</span>
                <strong>{a.title}</strong>
                <p>{a.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="platform-section">
        <h2 className="platform-section-title">إحصائيات الاستخدام</h2>
        <div className="usage-stats-grid">
          <div className="usage-stat"><strong>{activity.stats.quranSessions}</strong><span>جلسات قرآن</span></div>
          <div className="usage-stat"><strong>{activity.stats.lessonsWatched}</strong><span>دروس</span></div>
          <div className="usage-stat"><strong>{activity.stats.qaAnswered}</strong><span>أسئلة</span></div>
          <div className="usage-stat"><strong>{activity.stats.surahStoriesRead}</strong><span>قصص سور</span></div>
          <div className="usage-stat"><strong>{activity.stats.fawaidRead}</strong><span>فوائد</span></div>
          <div className="usage-stat"><strong>{activity.stats.searchCount}</strong><span>عمليات بحث</span></div>
          <div className="usage-stat"><strong>{activity.stats.sinJeemGames}</strong><span>سين وجيم</span></div>
          <div className="usage-stat"><strong>{activity.stats.totalVisits}</strong><span>زيارة</span></div>
        </div>
      </section>
    </div>
  );
}
