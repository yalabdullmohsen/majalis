import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Clock } from "lucide-react";
import { fetchPrayerTimes, type PrayerSlot, type PrayerTimesPayload } from "@/lib/prayer-times";

function useCompactPrayer() {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [nextKey, setNextKey] = useState<string | null>(null);

  useEffect(() => {
    fetchPrayerTimes().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!data?.prayers?.length) return;
    const update = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const obligatory = data.prayers.filter((p) => p.obligatory);
      const next = obligatory.find((p) => (p.minutes ?? 0) > nowMins) ?? obligatory[0];
      setNextKey(next?.key ?? null);
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [data]);

  return { data, nextKey };
}

export function HomeCompactPrayer() {
  const { data, nextKey } = useCompactPrayer();
  if (!data?.prayers?.length) return null;

  const obligatory = data.prayers.filter((p: PrayerSlot) => p.obligatory);

  return (
    <div className="hcp-strip" dir="rtl" role="complementary" aria-label="مواقيت الصلاة">
      <div className="hcp-strip__head">
        <span className="hcp-strip__label">
          <Clock size={13} aria-hidden="true" />
          مواقيت الصلاة
        </span>
        <Link href="/prayer-times" className="hcp-strip__link">التفاصيل ←</Link>
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
