import { useCallback, useEffect, useMemo, useState } from "react";
import {
  computeFamilyStreak,
  createGroupKhatmah,
  exportGroupKhatmahJson,
  importGroupKhatmahJson,
  loadGroupKhatmah,
  loadGroupKhatmahAsync,
  markJuzComplete,
  pullGroupKhatmahRemote,
  pushGroupKhatmahRemote,
  reallocateGroupJuz,
  type FamilyStreakSnapshot,
  type GroupKhatmahState,
} from "@/lib/group-khatmah-manager";

/** Group/family khatmah state manager — logic only. */
export function useGroupKhatmah() {
  const [group, setGroup] = useState<GroupKhatmahState | null>(() => loadGroupKhatmah());

  useEffect(() => {
    let cancelled = false;
    void loadGroupKhatmahAsync().then((g) => {
      if (!cancelled && g) setGroup(g);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const familyStreak: FamilyStreakSnapshot | null = useMemo(
    () => (group ? computeFamilyStreak(group) : null),
    [group],
  );

  const create = useCallback((memberNames: string[], title?: string, syncUrl?: string | null) => {
    const g = createGroupKhatmah({ memberNames, title, syncUrl });
    setGroup(g);
    return g;
  }, []);

  const completeJuz = useCallback((memberId: string, juz: number, done = true) => {
    setGroup((prev) => {
      if (!prev) return prev;
      return markJuzComplete(prev, memberId, juz, done);
    });
  }, []);

  const reallocate = useCallback(() => {
    setGroup((prev) => (prev ? reallocateGroupJuz(prev) : prev));
  }, []);

  const exportJson = useCallback(() => (group ? exportGroupKhatmahJson(group) : "{}"), [group]);

  const importJson = useCallback((json: string) => {
    const g = importGroupKhatmahJson(json);
    if (g) setGroup(g);
    return g;
  }, []);

  const syncPush = useCallback(async () => {
    if (!group) return false;
    return pushGroupKhatmahRemote(group);
  }, [group]);

  const syncPull = useCallback(async () => {
    if (!group) return null;
    const next = await pullGroupKhatmahRemote(group);
    if (next) setGroup(next);
    return next;
  }, [group]);

  return {
    group,
    familyStreak,
    create,
    completeJuz,
    reallocate,
    exportJson,
    importJson,
    syncPush,
    syncPull,
  };
}
