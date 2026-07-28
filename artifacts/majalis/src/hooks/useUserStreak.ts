import { useCallback, useEffect, useState } from "react";
import {
  getUserStreak,
  recordUserActivity,
  USER_STREAK_EVENT,
  type UserStreakActivity,
  type UserStreakState,
} from "@/lib/user-streak";
import { addSafeWindowListener } from "@/lib/safe-listeners";

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
    const u1 = addSafeWindowListener(USER_STREAK_EVENT, refresh as EventListener);
    const u2 = addSafeWindowListener("majalis-progress-updated", refresh as EventListener);
    const u3 = addSafeWindowListener("storage", refresh);
    return () => {
      u1();
      u2();
      u3();
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
