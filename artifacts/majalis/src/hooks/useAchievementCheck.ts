import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { readLocalJson, writeLocalJson, isStringArray } from "@/lib/safe-json";

/** Light type — avoid pulling user-profile-service into the entry graph. */
export type AchievementBadge = {
  key: string;
  titleAr: string;
  descAr: string;
  icon: string;
  category: string;
  earned_at: string;
};

const STORAGE_KEY = "majalis_notified_badges";

function getNotifiedKeys(): Set<string> {
  const list = readLocalJson<string[]>(STORAGE_KEY, [], isStringArray);
  return new Set(list);
}

function markNotified(keys: string[]) {
  try {
    const existing = getNotifiedKeys();
    keys.forEach((k) => existing.add(k));
    writeLocalJson(STORAGE_KEY, [...existing]);
  } catch {
    /* localStorage unavailable */
  }
}

export function useAchievementCheck() {
  const { user, isLoggedIn } = useAuth();
  const [newBadges, setNewBadges] = useState<AchievementBadge[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const runCheck = useCallback(async () => {
    if (!isLoggedIn || !user?.id) return;
    try {
      // Deferred: badge defs + profile/supabase stay out of the initial entry bundle.
      const [{ getUserProfileStats, checkAndAwardBadges }, { BADGE_MAP }] = await Promise.all([
        import("@/lib/user-profile-service"),
        import("@/lib/user-badges"),
      ]);
      const stats = await getUserProfileStats(user.id);
      const newKeys = await checkAndAwardBadges(user.id, stats);
      if (newKeys.length === 0 || !mountedRef.current) return;

      const notified = getNotifiedKeys();
      const unnotified = newKeys.filter((k) => !notified.has(k));
      if (unnotified.length === 0) return;

      const badges: AchievementBadge[] = unnotified.map((key) => {
        const def = BADGE_MAP.get(key);
        return {
          key,
          titleAr: def?.titleAr ?? key,
          descAr: def?.descAr ?? "",
          icon: def?.icon ?? "Medal",
          category: def?.category ?? "general",
          earned_at: new Date().toISOString(),
        };
      });

      markNotified(unnotified);
      if (mountedRef.current) setNewBadges(badges);
    } catch {
      /* silent — badge check is non-critical */
    }
  }, [isLoggedIn, user?.id]);

  const scheduleCheck = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runCheck, 3000);
  }, [runCheck]);

  const dismissBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  // فحص تلقائي عند تسجيل الدخول بعد 5 ثوانٍ
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    const t = setTimeout(runCheck, 5000);
    return () => clearTimeout(t);
  }, [isLoggedIn, user?.id, runCheck]);

  return { newBadges, scheduleCheck, dismissBadges };
}
