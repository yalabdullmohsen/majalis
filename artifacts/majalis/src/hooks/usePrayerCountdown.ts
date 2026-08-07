import { useCallback, useEffect, useState } from "react";
import {
  computePrayerCountdown,
  fetchPrayerTimes,
  getCachedPrayerTimes,
  getSelectedGovernorate,
  staticPrayerFallback,
  type PrayerCountdown,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";
import { setPrayerTimesCache } from "@/lib/lesson-time";
import { PRE_ALERT_MINUTES } from "@/lib/prayer-alert-preferences";

const PRE_ALERT_MS = PRE_ALERT_MINUTES * 60_000;
const FAST_TICK_MS = 1_000;
const SLOW_TICK_MS = 30_000;

function tickIntervalFor(cd: PrayerCountdown | null): number {
  if (!cd) return SLOW_TICK_MS;
  if (cd.sinceSeconds != null) return FAST_TICK_MS;
  if (cd.remainingMs > 0 && cd.remainingMs <= PRE_ALERT_MS) return FAST_TICK_MS;
  return SLOW_TICK_MS;
}

function syncLessonCache(payload: PrayerTimesPayload) {
  const cache: Record<string, number> = {};
  for (const p of payload.prayers) {
    if (p.minutes != null) cache[p.name] = p.minutes;
  }
  setPrayerTimesCache(cache);
}

function initialPayload(governorateId?: string): PrayerTimesPayload {
  const cached = getCachedPrayerTimes(governorateId);
  if (cached?.ok && cached.prayers?.length) return cached;
  const gov = governorateId
    ? undefined
    : getSelectedGovernorate();
  const city = gov ? `الكويت – محافظة ${gov.name}` : "الكويت – محافظة العاصمة";
  return staticPrayerFallback(city);
}

export function usePrayerCountdown(governorateId?: string) {
  const [data, setData] = useState<PrayerTimesPayload | null>(() => initialPayload(governorateId));
  const [countdown, setCountdown] = useState<PrayerCountdown | null>(() => {
    const seed = initialPayload(governorateId);
    return seed.prayers?.length ? computePrayerCountdown(seed.prayers) : null;
  });
  /** لا يمنع الرسم — يبقى للتوافق مع المستهلكين القدامى */
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const seed = initialPayload(governorateId);
    setData(seed);
    setCountdown(seed.prayers?.length ? computePrayerCountdown(seed.prayers) : null);
    syncLessonCache(seed);
    setLoading(false);

    void fetchPrayerTimes(governorateId)
      .then((payload) => {
        if (cancelled || !payload?.prayers?.length) return;
        setData(payload);
        syncLessonCache(payload);
        setCountdown(computePrayerCountdown(payload.prayers));
      })
      .catch(() => {
        /* الإبقاء على البذرة المحلية */
      });

    return () => {
      cancelled = true;
    };
  }, [governorateId, reloadToken]);

  useEffect(() => {
    if (!data?.prayers?.length) {
      setCountdown(null);
      return;
    }

    let timer: number | undefined;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const cd = computePrayerCountdown(data.prayers);
      setCountdown(cd);
      timer = window.setTimeout(schedule, tickIntervalFor(cd));
    };

    schedule();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (timer != null) window.clearTimeout(timer);
      schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [data]);

  return { data, countdown, loading, reload };
}
