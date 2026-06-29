import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { SjIcon } from "@/components/sin-jeem/SjIcon";
import { fetchPlayerProgress } from "@/lib/sin-jeem/progress-service";
import type { PlayerProfile } from "@/lib/sin-jeem/types";

export function PlayerProgressPanel() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    setLoading(true);
    fetchPlayerProgress(user.id).then(({ profile: p }) => {
      setProfile(p);
      setLoading(false);
    });
  }, [user?.id]);

  if (!user) {
    return (
      <div className="sj-progress-panel sj-progress-panel--guest">
        <SjIcon name="brain" size={18} />
        <p>سجّل دخولك لحفظ تقدّمك الشخصي ومسار تعلّم فريد</p>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="sj-progress-panel sj-progress-loading">
        <span className="sj-pulse-dot" />
        جاري تحميل تقدّمك…
      </div>
    );
  }

  if (!profile) return null;

  return (
    <section className="sj-progress-panel sj-animate-in" aria-label="تقدّمك الشخصي">
      <div className="sj-progress-header">
        <div>
          <span className="sj-progress-level">المستوى {profile.level}</span>
          <h3 className="sj-progress-title">{profile.title}</h3>
        </div>
        <div className="sj-progress-xp">
          <SjIcon name="sparkles" size={16} />
          {profile.xp.toLocaleString("ar")} XP
        </div>
      </div>

      <div className="sj-progress-bars">
        <div className="sj-progress-bar-row">
          <span>إكمال المحتوى</span>
          <div className="sj-progress-track">
            <div className="sj-progress-fill" style={{ width: `${Math.min(100, profile.completion_pct)}%` }} />
          </div>
          <span>{Math.round(profile.completion_pct)}%</span>
        </div>
        <div className="sj-progress-bar-row">
          <span>الدقة</span>
          <div className="sj-progress-track">
            <div className="sj-progress-fill sj-progress-fill--gold" style={{ width: `${Math.min(100, profile.accuracy_pct)}%` }} />
          </div>
          <span>{Math.round(profile.accuracy_pct)}%</span>
        </div>
      </div>

      <div className="sj-progress-stats">
        <div className="sj-progress-stat">
          <SjIcon name="flame" size={16} />
          <span>{profile.daily_streak} يوم</span>
        </div>
        <div className="sj-progress-stat">
          <SjIcon name="target" size={16} />
          <span>{Math.round(profile.mastery_score)}%</span>
        </div>
        <div className="sj-progress-stat">
          <SjIcon name="zap" size={16} />
          <span>{profile.avg_response_ms > 0 ? `${(profile.avg_response_ms / 1000).toFixed(1)}ث` : "—"}</span>
        </div>
        <div className="sj-progress-stat">
          <SjIcon name="trophy" size={16} />
          <span>{Math.round(profile.knowledge_rating)}</span>
        </div>
      </div>
    </section>
  );
}
