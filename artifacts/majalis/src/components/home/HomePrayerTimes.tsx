import { useEffect, useMemo, useState } from "react";
import { Loading } from "@/components/ui-common";
import {
  computePrayerStatus,
  fetchPrayerTimes,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";

export function HomePrayerTimes() {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    fetchPrayerTimes()
      .then((payload) => {
        if (active) setData(payload);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = new Date();
    const kuwaitParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuwait",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const h = Number(kuwaitParts.find((p) => p.type === "hour")?.value || 0);
    const m = Number(kuwaitParts.find((p) => p.type === "minute")?.value || 0);
    const s = Number(kuwaitParts.find((p) => p.type === "second")?.value || 0);
    const msUntilMidnight = ((23 - h) * 3600 + (59 - m) * 60 + (60 - s)) * 1000;

    const timer = window.setTimeout(() => {
      fetchPrayerTimes().then(setData);
    }, msUntilMidnight);

    return () => window.clearTimeout(timer);
  }, [data?.date?.gregorian]);

  const status = useMemo(
    () => (data?.prayers ? computePrayerStatus(data.prayers) : null),
    [data?.prayers, tick],
  );

  if (loading && !data) {
    return (
      <section className="home-section" aria-labelledby="prayer-times-heading">
        <Loading />
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="home-section" aria-labelledby="prayer-times-heading">
      <h2 id="prayer-times-heading" className="prayer-section-title">
        مواقيت الصلاة في الكويت
      </h2>

      {status && (
        <div className="prayer-status-card ui-card prayer-status-card--compact">
          <div className="prayer-status-grid prayer-status-grid--three">
            <div className="prayer-status-block prayer-status-block--previous">
              <span className="prayer-status-label">الصلاة السابقة</span>
              <strong>{status.previous?.name || "—"}</strong>
              <span>{status.previous?.time || "—"}</span>
            </div>
            <div className="prayer-status-block prayer-status-block--next">
              <span className="prayer-status-label">الصلاة القادمة</span>
              <strong>{status.next?.name || "—"}</strong>
              <span>{status.next?.time || "—"}</span>
            </div>
            <div className="prayer-status-block prayer-status-block--remaining">
              <span className="prayer-status-label">الوقت المتبقي</span>
              <strong className="prayer-countdown">{status.remainingLabel}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="home-prayer-grid ui-card">
        {data.prayers.map((item) => {
          const isNext = status?.next?.key === item.key;
          return (
            <div
              key={item.key}
              className={`home-prayer-cell${isNext ? " is-next" : ""}`}
            >
              <span className="home-prayer-name">{item.name}</span>
              <strong className="home-prayer-time">{item.time}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
