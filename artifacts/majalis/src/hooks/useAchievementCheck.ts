import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  getUserProfileStats,
  checkAndAwardBadges,
  type EarnedBadge,
} from "@/lib/user-profile-service";
import { BADGE_MAP } from "@/lib/user-badges";

const STORAGE_KEY = "majalis_notified_badges";

function getNotifiedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markNotified(keys: string[]) {
  try {
    const existing = getNotifiedKeys();
    keys.forEach((k) => existing.add(k));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing]));
  } catch {}
}

export function useAchievementCheck() {
  const { user, isLoggedIn } = useAuth();
  const [newBadges, setNewBadges] = useState<EarnedBadge[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runCheck = useCallback(async () => {
    if (!isLoggedIn || !user?.id) return;
    try {
      const stats = await getUserProfileStats(user.id);
      const newKeys = await checkAndAwardBadges(user.id, stats);
      if (newKeys.length === 0) return;

      const notified = getNotifiedKeys();
      const unnotified = newKeys.filter((k) => !notified.has(k));
      if (unnotified.length === 0) return;

      const badges: EarnedBadge[] = unnotified.map((key) => {
        const def = BADGE_MAP.get(key);
        return {
          key,
          titleAr: def?.titleAr ?? key,
          descAr: def?.descAr ?? "",
          icon: def?.icon ?? "🏅",
          category: def?.category ?? "general",
          earned_at: new Date().toISOString(),
        };
      });

      markNotified(unnotified);
      setNewBadges(badges);
    } catch {}
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
