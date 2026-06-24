import { useEffect, useMemo, useState } from "react";
import { Loading } from "@/components/ui-common";
import {
  computePrayerStatus,
  fetchPrayerTimes,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";

export function HomePrayerTimes() {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    fetchPrayerTimes()
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setError("تعذر تحميل مواقيت الصلاة.");
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
      setLoading(true);
      fetchPrayerTimes()
        .then(setData)
        .catch(() => setError("تعذر تحديث مواقيت اليوم."))
        .finally(() => setLoading(false));
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

  if (error && !data) {
    return (
      <section className="home-section" aria-labelledby="prayer-times-heading">
        <p className="home-inline-error">{error}</p>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="home-section" aria-labelledby="prayer-times-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">الكويت – محافظة العاصمة</p>
          <h2 id="prayer-times-heading">مواقيت الصلاة — الكويت</h2>
          {data.date.readable && <p className="home-prayer-date">{data.date.readable}</p>}
        </div>
      </div>

      {status && (
        <div className="prayer-status-card ui-card">
          <div className="prayer-status-grid">
            <div className="prayer-status-block prayer-status-block--current">
              <span className="prayer-status-label">الصلاة الحالية</span>
              <strong>{status.current?.icon} {status.current?.name || "—"}</strong>
              <span>{status.current?.time || "—"}</span>
            </div>
            <div className="prayer-status-block prayer-status-block--next">
              <span className="prayer-status-label">الصلاة القادمة</span>
              <strong>{status.next?.icon} {status.next?.name || "—"}</strong>
              <span>{status.next?.time || "—"}</span>
            </div>
            <div className="prayer-status-block prayer-status-block--remaining">
              <span className="prayer-status-label">الوقت المتبقي</span>
              <strong className="prayer-countdown">{status.remainingLabel}</strong>
              <span>حتى {status.next?.name || "الصلاة القادمة"}</span>
            </div>
            <div className="prayer-status-block prayer-status-block--previous">
              <span className="prayer-status-label">الصلاة السابقة</span>
              <strong>{status.previous?.icon} {status.previous?.name || "—"}</strong>
              <span>{status.previous?.time || "—"}</span>
            </div>
          </div>
        </div>
      )}

      <div className="home-prayer-grid ui-card">
        {data.prayers.map((item) => {
          const isCurrent = status?.current?.key === item.key;
          const isNext = status?.next?.key === item.key;
          return (
            <div
              key={item.key}
              className={`home-prayer-cell${isCurrent ? " is-current" : ""}${isNext ? " is-next" : ""}`}
            >
              <span className="home-prayer-icon" aria-hidden="true">{item.icon}</span>
              <span className="home-prayer-name">{item.name}</span>
              <strong className="home-prayer-time">{item.time}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
