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
import { getActivePrayerLocation } from "@/lib/prayer-location-prefs";
import { setPrayerTimesCache } from "@/lib/lesson-time";

/** عدّاد الثواني يُحدَّث كل ثانية دائمًا — صفحة الصلاة والشريط يعرضان HMS كاملًا. */
const TICK_MS = 1_000;

function syncLessonCache(payload: PrayerTimesPayload) {
  const cache: Record<string, number> = {};
  for (const p of payload.prayers) {
    if (p.minutes != null) cache[p.name] = p.minutes;
  }
  setPrayerTimesCache(cache);
}

function activeTz(payload?: PrayerTimesPayload | null): string {
  return payload?.timezone || getActivePrayerLocation().timeZone || "Asia/Kuwait";
}

function initialPayload(governorateId?: string): PrayerTimesPayload {
  const cached = getCachedPrayerTimes(governorateId);
  if (cached?.ok && cached.prayers?.length) return cached;
  const loc = getActivePrayerLocation();
  const city = governorateId
    ? `الكويت – محافظة ${getSelectedGovernorate().name}`
    : loc.label;
  return staticPrayerFallback(city);
}

export function usePrayerCountdown(governorateId?: string) {
  const [data, setData] = useState<PrayerTimesPayload | null>(() => initialPayload(governorateId));
  const [countdown, setCountdown] = useState<PrayerCountdown | null>(() => {
    const seed = initialPayload(governorateId);
    return seed.prayers?.length
      ? computePrayerCountdown(seed.prayers, activeTz(seed))
      : null;
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
    setCountdown(
      seed.prayers?.length ? computePrayerCountdown(seed.prayers, activeTz(seed)) : null,
    );
    syncLessonCache(seed);
    setLoading(false);

    void fetchPrayerTimes(governorateId)
      .then((payload) => {
        if (cancelled || !payload?.prayers?.length) return;
        setData(payload);
        syncLessonCache(payload);
        setCountdown(computePrayerCountdown(payload.prayers, activeTz(payload)));
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
      /* دائمًا من Date.now عبر computePrayerCountdown — لا تراكم عدّاد قديم */
      const cd = computePrayerCountdown(data.prayers, activeTz(data));
      setCountdown(cd);
      timer = window.setTimeout(schedule, TICK_MS);
    };

    schedule();

    const resyncNow = () => {
      if (timer != null) window.clearTimeout(timer);
      schedule();
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      resyncNow();
    };
    document.addEventListener("visibilitychange", onVisible);

    let removeAppListener: (() => void) | undefined;
    void import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) resyncNow();
        }),
      )
      .then((handle) => {
        if (cancelled) {
          void handle.remove();
          return;
        }
        removeAppListener = () => {
          void handle.remove();
        };
      })
      .catch(() => {
        /* ويب / بلا Capacitor */
      });

    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      removeAppListener?.();
    };
  }, [data]);

  return { data, countdown, loading, reload };
}
