import { Sprout } from "lucide-react";
import type { LPAchievement } from "@/lib/learning-path-service";

interface Props {
  achievements: LPAchievement[];
}

export function AchievementBadges({ achievements }: Props) {
  if (achievements.length === 0) {
    return (
      <div className="ach-empty">
        <div className="text-4xl mb-2"><Sprout size={40} strokeWidth={1.3} /></div>
        <p className="text-sm">أكمل كتابك الأول لتحصل على أول وسام!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {achievements.map((a) => (
        <div
          key={a.id}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center ach-badge-card"
          style={{ "--ach-bc-border": `${a.badge_color}40`, "--ach-bc-bg": `${a.badge_color}08` } as React.CSSProperties}
        >
          <span className="text-3xl">{a.badge_icon}</span>
          <span className="ach-badge-name">{a.badge_name}</span>
          <span className="ach-badge-date">
            {new Date(a.earned_at).toLocaleDateString("ar-KW", { day: "numeric", month: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}
