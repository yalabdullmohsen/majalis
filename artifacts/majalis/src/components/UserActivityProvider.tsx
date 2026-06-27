"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  readActivity,
  recordActivity,
  recordSearch,
  recordVisit,
  type ActivityItem,
  type UserActivityState,
} from "@/lib/user-activity";
import { applyReadingSurface, readReadingSurface } from "@/lib/reading-surface";

type ActivityContextValue = {
  activity: UserActivityState;
  refresh: () => void;
  track: (item: Omit<ActivityItem, "at">) => void;
  trackSearch: () => void;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function UserActivityProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<UserActivityState>(() => readActivity());

  const refresh = useCallback(() => {
    setActivity(readActivity());
  }, []);

  useEffect(() => {
    recordVisit();
    applyReadingSurface(readReadingSurface());
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("majalis-activity-updated", onUpdate);
    return () => window.removeEventListener("majalis-activity-updated", onUpdate);
  }, [refresh]);

  const track = useCallback(
    (item: Omit<ActivityItem, "at">) => {
      recordActivity(item);
      refresh();
    },
    [refresh],
  );

  const trackSearch = useCallback(() => {
    recordSearch();
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ activity, refresh, track, trackSearch }),
    [activity, refresh, track, trackSearch],
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useUserActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useUserActivity must be used within UserActivityProvider");
  return ctx;
}

export function useTrackActivity() {
  return useUserActivity().track;
}
