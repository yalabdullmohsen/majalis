import { Flame, Medal } from "lucide-react";
import type { LPStreak } from "@/lib/learning-path-service";

interface Props {
  streak: LPStreak;
}

export function StreakCounter({ streak }: Props) {
  const { current_streak, longest_streak } = streak;

  return (
    <div className="flex gap-3">
      <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 text-center border border-emerald-100 dark:border-emerald-800">
        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{current_streak}</div>
        <div className="text-xs text-orange-500 dark:text-orange-400 mt-1"><Flame size={12} className="inline ml-1" />أيام متتالية</div>
      </div>
      <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 text-center border border-purple-100 dark:border-purple-800">
        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{longest_streak}</div>
        <div className="text-xs text-purple-500 dark:text-purple-400 mt-1"><Medal size={12} className="inline ml-1" />الأعلى</div>
      </div>
    </div>
  );
}
