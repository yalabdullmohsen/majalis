import { useEffect, useState } from "react";
import {
  computePrayerCountdown,
  fetchPrayerTimes,
  type PrayerCountdown,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";
import { setPrayerTimesCache } from "@/lib/lesson-time";

export function usePrayerCountdown(governorateId?: string) {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [countdown, setCountdown] = useState<PrayerCountdown | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [governorateId]);

  useEffect(() => {
    if (!data?.prayers?.length) {
      setCountdown(null);
      return;
    }

    const tick = () => setCountdown(computePrayerCountdown(data.prayers, new Date()));
    tick();
    const timer = window.setInterval(tick, 1000);

    // عند الرجوع من الخلفية: أعد الحساب فورًا وفق الوقت الحقيقي
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [data]);

  return { data, countdown, loading };
}
