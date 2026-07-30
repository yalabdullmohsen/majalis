import { useCallback, useEffect, useState } from "react";
import {
  computePrayerCountdown,
  fetchPrayerTimes,
  type PrayerCountdown,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";
import { setPrayerTimesCache } from "@/lib/lesson-time";
import { PRE_ALERT_MINUTES } from "@/lib/prayer-alert-preferences";

const PRE_ALERT_MS = PRE_ALERT_MINUTES * 60 * 1000;
const FAST_TICK_MS = 1_000;
const SLOW_TICK_MS = 30_000;

function tickIntervalFor(cd: PrayerCountdown | null): number {
  if (!cd) return SLOW_TICK_MS;
  if (cd.sinceSeconds != null) return FAST_TICK_MS;
  if (cd.remainingMs > 0 && cd.remainingMs <= PRE_ALERT_MS) return FAST_TICK_MS;
  return SLOW_TICK_MS;
}

export function usePrayerCountdown(governorateId?: string) {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [countdown, setCountdown] = useState<PrayerCountdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPrayerTimes(governorateId)
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          // مزامنة أوقات الصلاة الفعلية مع حساب مواعيد الدروس
          const cache: Record<string, number> = {};
          for (const p of payload.prayers) {
            if (p.minutes != null) cache[p.name] = p.minutes;
          }
          setPrayerTimesCache(cache);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
