import { useCallback, useEffect, useState } from "react";
import {
  isInForbiddenPrayerWindow,
  resolveSacredTimeState,
  type SacredAzkarRecommendation,
  type SacredTimeState,
} from "@/lib/sacred-time-calculator";
import { fetchPrayerTimes, type PrayerSlot } from "@/lib/prayer-times";

/** Sacred time marks + azkar recommendations — logic only. */
export function useSacredTime(opts?: { intervalMs?: number }) {
  const [prayers, setPrayers] = useState<PrayerSlot[]>([]);
  const [state, setState] = useState<SacredTimeState | null>(null);

  const refresh = useCallback((slots?: PrayerSlot[]) => {
    const list = slots ?? prayers;
    if (!list.length) return null;
    const next = resolveSacredTimeState(list);
    setState(next);
    return next;
  }, [prayers]);

  useEffect(() => {
    let cancelled = false;
    void fetchPrayerTimes()
      .then((payload) => {
        if (cancelled || !payload?.prayers?.length) return;
        setPrayers(payload.prayers);
        setState(resolveSacredTimeState(payload.prayers));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!prayers.length) return;
    const ms = opts?.intervalMs ?? 60_000;
    const id = window.setInterval(() => refresh(prayers), ms);
    return () => window.clearInterval(id);
  }, [prayers, opts?.intervalMs, refresh]);

  const recommendations: SacredAzkarRecommendation[] = state?.azkarRecommendations ?? [];
  const forbidden = state ? isInForbiddenPrayerWindow(state) : false;

  return { state, prayers, recommendations, forbidden, refresh };
}
