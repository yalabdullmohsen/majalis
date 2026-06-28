import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  ACHIEVEMENTS,
  aggregateStats,
  applySessionUpdate,
  buildCalendarMonth,
  computeRankMetrics30,
  detectAchievements,
  flattenLog,
  kuwaitDateKey,
  loadAchievementsFromDb,
  loadPrayerSessionsFromDb,
  mergeStores,
  PRAYER_LABELS,
  readEarnedAchievements,
  readPrayerStore,
  refreshPrayerAggregates,
  resolveRank,
  saveAchievementsToDb,
  syncPrayerStoreToDb,
  upsertPrayerSession,
  writeEarnedAchievements,
  writePrayerStore,
  type AchievementKey,
  type CalendarDay,
  type PrayerKey,
  type PrayerLogEntry,
  type PrayerRank,
  type PrayerSession,
  type PrayerStats,
  type PrayerStore,
} from "@/lib/prayer-tracker";

export function usePrayerTracker() {
  const { user, isLoggedIn } = useAuth();
  const [store, setStore] = useState<PrayerStore>(() => readPrayerStore());
  const [earned, setEarned] = useState<Set<AchievementKey>>(() => new Set(readEarnedAchievements()) as Set<AchievementKey>);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const dateKey = kuwaitDateKey();

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    let active = true;
    setSyncing(true);
    loadPrayerSessionsFromDb(user.id)
      .then(async (remote) => {
        if (!active) return;
        const local = readPrayerStore();
        const merged = mergeStores(local, remote);
        setStore(merged);
        writePrayerStore(merged);

        const remoteAch = await loadAchievementsFromDb(user.id);
        const localAch = new Set(readEarnedAchievements()) as Set<AchievementKey>;
        const combined = new Set([...localAch, ...remoteAch]);
        setEarned(combined);
        writeEarnedAchievements(combined);
        setSyncNote("تمت مزامنة سجل الصلوات");
      })
      .finally(() => {
        if (active) setSyncing(false);
      });
    return () => {
      active = false;
    };
  }, [isLoggedIn, user?.id]);

  const stats: PrayerStats = useMemo(() => aggregateStats(store), [store]);
  const rank: PrayerRank = useMemo(() => resolveRank(computeRankMetrics30(store)), [store]);
  const rankMetrics = useMemo(() => computeRankMetrics30(store), [store]);

  const calendarMonth = useCallback(
    (year: number, month: number): CalendarDay[] => buildCalendarMonth(store, year, month),
    [store],
  );

  const log: PrayerLogEntry[] = useMemo(
    () =>
      flattenLog(store, 100).map((s) => ({
        ...s,
        prayerLabel: PRAYER_LABELS[s.prayerKey],
      })),
    [store],
  );

  const achievements = useMemo(
    () =>
      ACHIEVEMENTS.map((a) => ({
        ...a,
        earned: earned.has(a.key),
      })),
    [earned],
  );

  const persist = useCallback(
    async (next: PrayerStore, session?: PrayerSession) => {
      setStore(next);
      writePrayerStore(next);

      const newAch = detectAchievements(next, earned);
      if (newAch.length) {
        const updated = new Set([...earned, ...newAch]);
        setEarned(updated);
        writeEarnedAchievements(updated);
      }

      if (isLoggedIn && user?.id) {
        if (session) await upsertPrayerSession(user.id, session);
        else await syncPrayerStoreToDb(user.id, next);
        if (newAch.length) await saveAchievementsToDb(user.id, newAch);
        await refreshPrayerAggregates(user.id, next);
        setSyncNote("تم حفظ التقدم");
      }
    },
    [earned, isLoggedIn, user?.id],
  );

  const updatePrayer = useCallback(
    (key: PrayerKey, patch: Partial<PrayerSession>) => {
      const next = applySessionUpdate(store, dateKey, key, {
        ...patch,
        prayedAt: patch.status === "done" ? new Date().toISOString() : patch.prayedAt,
      });
      const session = next[dateKey][key];
      void persist(next, session);
    },
    [store, dateKey, persist],
  );

  const today = store[dateKey];

  return {
    store,
    today,
    dateKey,
    stats,
    rank,
    rankMetrics,
    log,
    achievements,
    calendarMonth,
    updatePrayer,
    syncing,
    syncNote,
    isLoggedIn,
  };
}
