import { Flame, Medal } from "lucide-react";
import type { LPStreak } from "@/lib/learning-path-service";

interface Props {
  streak: LPStreak;
}

export function StreakCounter({ streak }: Props) {
  const { current_streak, longest_streak } = streak;

  return (
    <div className="flex gap-3">
      <div className="streak-current">
        <div className="streak-number--active">{current_streak}</div>
        <div className="streak-label--active"><Flame size={12} className="inline ml-1" />أيام متتالية</div>
      </div>
      <div className="streak-longest">
        <div className="streak-number">{longest_streak}</div>
        <div className="streak-label"><Medal size={12} className="inline ml-1" />الأعلى</div>
      </div>
    </div>
  );
}
