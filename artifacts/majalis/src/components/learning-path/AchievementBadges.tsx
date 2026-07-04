import type { LPAchievement } from "@/lib/learning-path-service";

interface Props {
  achievements: LPAchievement[];
}

export function AchievementBadges({ achievements }: Props) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--majalis-ink-soft)] opacity-60">
        <div className="text-4xl mb-2">🌱</div>
        <p className="text-sm">أكمل كتابك الأول لتحصل على أول وسام!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {achievements.map((a) => (
        <div
          key={a.id}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center"
          style={{ borderColor: `${a.badge_color}40`, background: `${a.badge_color}08` }}
        >
          <span className="text-3xl">{a.badge_icon}</span>
          <span className="text-xs font-semibold text-[var(--majalis-ink-soft)]">{a.badge_name}</span>
          <span className="text-xs text-[var(--majalis-ink-soft)] opacity-60">
            {new Date(a.earned_at).toLocaleDateString("ar-KW", { day: "numeric", month: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}
