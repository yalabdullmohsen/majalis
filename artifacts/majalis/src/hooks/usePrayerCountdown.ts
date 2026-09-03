import { useCallback, useEffect, useState } from "react";
import {
  computePrayerCountdown,
  fetchPrayerTimes,
  getCachedPrayerTimes,
  isEstimatedPrayerPayload,
  type PrayerCountdown,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";
import { getActivePrayerLocation } from "@/lib/prayer-location-prefs";
import { setPrayerTimesCache } from "@/lib/lesson-time";
import { subscribeSecondTick } from "@/lib/second-tick";
import { subscribePrayerDayRollover } from "@/lib/prayer-day-rollover";

const FETCH_TIMEOUT_MS = 4_000;

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

/** كاش حقيقي فقط — لا أوقات تقديرية وهمية تُعرض كصحيحة. */
function initialPayload(governorateId?: string): PrayerTimesPayload | null {
  const cached = getCachedPrayerTimes(governorateId);
  if (cached?.ok && cached.prayers?.length && !isEstimatedPrayerPayload(cached)) {
    return cached;
  }
  return null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, ms);
    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(null);
      });
  });
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
    return seed?.prayers?.length
      ? computePrayerCountdown(seed.prayers, activeTz(seed))
      : null;
  });
  /** لا يمنع الرسم — يبقى للتوافق مع المستهلكين القدامى */
  const [loading, setLoading] = useState(() => !initialPayload(governorateId));
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const seed = initialPayload(governorateId);
    setData(seed);
    setCountdown(
      seed?.prayers?.length ? computePrayerCountdown(seed.prayers, activeTz(seed)) : null,
    );
    if (seed?.prayers?.length) syncLessonCache(seed);
    setLoading(!seed);

    void withTimeout(fetchPrayerTimes(governorateId), FETCH_TIMEOUT_MS).then((payload) => {
      if (cancelled) return;
      setLoading(false);
      if (!payload?.ok || !payload.prayers?.length || isEstimatedPrayerPayload(payload)) {
        /* الإبقاء على الكاش الحقيقي إن وُجد؛ وإلا تبقى الواجهة بلا أوقات وهمية */
        return;
      }
      setData(payload);
      syncLessonCache(payload);
      setCountdown(computePrayerCountdown(payload.prayers, activeTz(payload)));
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

  // عبور منتصف الليل → إعادة جلب مواقيت اليوم دون إعادة تشغيل التطبيق
  useEffect(() => {
    const tz = activeTz(data);
    return subscribePrayerDayRollover(tz, () => {
      setReloadToken((n) => n + 1);
    });
  }, [data?.timezone, governorateId]);

  return { data, countdown, loading, reload };
}
