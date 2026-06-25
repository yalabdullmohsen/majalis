import { useEffect, useState } from "react";
import {
  computePrayerCountdown,
  fetchPrayerTimes,
  type PrayerCountdown,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";

export function usePrayerCountdown() {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [countdown, setCountdown] = useState<PrayerCountdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPrayerTimes()
      .then((payload) => {
        if (!cancelled) setData(payload);
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
  }, []);

  useEffect(() => {
    if (!data?.prayers?.length) {
      setCountdown(null);
      return;
    }

    const tick = () => setCountdown(computePrayerCountdown(data.prayers));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [data]);

  return { data, countdown, loading };
}
