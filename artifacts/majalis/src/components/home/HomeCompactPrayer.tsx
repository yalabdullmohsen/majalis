import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Clock } from "lucide-react";
import {
  computePrayerCountdown,
  fetchPrayerTimes,
  type PrayerSlot,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";

function useCompactPrayer() {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [nextKey, setNextKey] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    fetchPrayerTimes().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!data?.prayers?.length) return;
    const tick = () => {
      const cd = computePrayerCountdown(data.prayers);
      setNextKey(cd.next?.key ?? null);
      setCountdown(cd.remainingHms ?? "");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [data]);

  return { data, nextKey, countdown };
}

export function HomeCompactPrayer() {
  const { data, nextKey, countdown } = useCompactPrayer();
  if (!data?.prayers?.length) return null;

  const obligatory = data.prayers.filter((p: PrayerSlot) => p.obligatory);
  const nextPrayer = obligatory.find((p) => p.key === nextKey);

  return (
    <div className="hcp-strip" dir="rtl" role="complementary" aria-label="مواقيت الصلاة">
      <div className="hcp-strip__head">
        <span className="hcp-strip__label">
          <Clock size={13} aria-hidden="true" />
          مواقيت الصلاة
        </span>
        <div className="hcp-strip__head-end">
          {nextPrayer && countdown && (
            <span className="hcp-strip__countdown" aria-live="off">
              {nextPrayer.name} بعد{" "}
              <span className="hcp-strip__countdown-time" dir="ltr">{countdown}</span>
            </span>
          )}
          <Link href="/prayer-times" className="hcp-strip__link">التفاصيل ←</Link>
        </div>
      </div>
      <div className="hcp-strip__prayers">
        {obligatory.map((p: PrayerSlot) => (
          <div
            key={p.key}
            className={`hcp-prayer-cell${p.key === nextKey ? " hcp-prayer-cell--next" : ""}`}
          >
            <span className="hcp-prayer-cell__name">{p.name}</span>
            <span className="hcp-prayer-cell__time">{p.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
