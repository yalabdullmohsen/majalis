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
import { subscribeSecondTick } from "@/lib/second-tick";

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

export type PrayerCountdownValue = {
  data: PrayerTimesPayload | null;
  countdown: PrayerCountdown | null;
  loading: boolean;
  reload: () => void;
};

/** منطق العدّ — استخدم PrayerCountdownProvider + usePrayerCountdown من components/prayer. */
export function usePrayerCountdownState(governorateId?: string): PrayerCountdownValue {
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

    const prayers = data.prayers;
    const tz = activeTz(data);
    /* كل نبضة: فرق الهدف عن Date.now عبر computePrayerCountdown — لا تراكم */
    return subscribeSecondTick(() => {
      setCountdown(computePrayerCountdown(prayers, tz));
    });
  }, [data]);

  return { data, countdown, loading, reload };
}
