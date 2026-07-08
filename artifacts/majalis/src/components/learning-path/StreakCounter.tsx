import { Flame, Medal } from "lucide-react";
import type { LPStreak } from "@/lib/learning-path-service";

interface Props {
  streak: LPStreak;
}

export function StreakCounter({ streak }: Props) {
  const { current_streak, longest_streak } = streak;

  return (
    <div className="flex gap-3">
      <div className="flex-1 bg-[var(--majalis-emerald-muted)] rounded-2xl p-4 text-center border border-[var(--majalis-emerald)]">
        <div className="text-3xl font-bold text-[var(--majalis-emerald)]">{current_streak}</div>
        <div className="text-xs text-[var(--majalis-emerald)] mt-1"><Flame size={12} className="inline ml-1" />أيام متتالية</div>
      </div>
      <div className="flex-1 bg-[var(--majalis-parchment-deep)] rounded-2xl p-4 text-center border border-[var(--majalis-line)]">
        <div className="text-3xl font-bold text-[var(--majalis-ink)]">{longest_streak}</div>
        <div className="text-xs text-[var(--majalis-ink-soft)] mt-1"><Medal size={12} className="inline ml-1" />الأعلى</div>
      </div>
    </div>
  );
}
