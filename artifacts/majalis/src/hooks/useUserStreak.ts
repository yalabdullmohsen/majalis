import { useCallback, useEffect, useState } from "react";
import {
  getUserStreak,
  recordUserActivity,
  USER_STREAK_EVENT,
  type UserStreakActivity,
  type UserStreakState,
} from "@/lib/user-streak";

/**
 * Read current streak count / metrics without refactoring existing UI.
 * Subscribe via CustomEvent so home widgets can opt-in later.
 */
export function useUserStreak() {
  const [state, setState] = useState<UserStreakState>(() =>
    typeof window === "undefined"
      ? {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          totalGoalsCompleted: 0,
          freezeTokens: 1,
          freezeUsedOn: null,
        }
      : getUserStreak(),
  );

  useEffect(() => {
    const refresh = () => setState(getUserStreak());
    refresh();
    window.addEventListener(USER_STREAK_EVENT, refresh as EventListener);
    window.addEventListener("majalis-progress-updated", refresh as EventListener);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(USER_STREAK_EVENT, refresh as EventListener);
      window.removeEventListener("majalis-progress-updated", refresh as EventListener);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const track = useCallback((activity: UserStreakActivity, completedGoal = false) => {
    setState(recordUserActivity(activity, { completedGoal }));
  }, []);

  return {
    ...state,
    streak: state.currentStreak,
    track,
    refresh: () => setState(getUserStreak()),
  };
}
