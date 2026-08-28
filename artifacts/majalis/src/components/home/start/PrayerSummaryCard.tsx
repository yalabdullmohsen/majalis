import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AppCard } from "@/components/home/start/AppCard";
import { AppSectionHeader } from "@/components/home/start/AppSectionHeader";
import { useNumerals } from "@/hooks/useNumerals";
import {
  computePrayerCountdown,
  fetchPrayerTimes,
  getCachedPrayerTimes,
  type PrayerSlot,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";
import { subscribeSecondTick } from "@/lib/second-tick";
import { subscribePrayerDayRollover } from "@/lib/prayer-day-rollover";

function usePrayerSummary() {
  const [data, setData] = useState<PrayerTimesPayload | null>(() => getCachedPrayerTimes());
  const [nextKey, setNextKey] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [nextName, setNextName] = useState("");
  const [nextTime, setNextTime] = useState("");

  useEffect(() => {
    void fetchPrayerTimes().then(setData).catch(() => undefined);
  }, []);

  useEffect(() => {
    return subscribePrayerDayRollover("Asia/Kuwait", () => {
      void fetchPrayerTimes().then(setData).catch(() => undefined);
    });
  }, []);

  useEffect(() => {
    if (!data?.prayers?.length) return;
    return subscribeSecondTick(() => {
      const cd = computePrayerCountdown(data.prayers);
      setNextKey(cd.next?.key ?? null);
      setCountdown(cd.remainingHms ?? "");
      setNextName(cd.next?.name ?? "");
      setNextTime(cd.next?.time ?? "");
    });
  }, [data]);

  return { data, nextKey, countdown, nextName, nextTime };
}

function PrayerRow({ prayers, nextKey }: { prayers: PrayerSlot[]; nextKey: string | null }) {
  const fmt = useNumerals();
  const obligatory = prayers.filter((p) => p.obligatory || p.key === "Sunrise");

  return (
    <div className="mj-prayer-summary__row" role="list" aria-label="مواقيت اليوم">
      {obligatory.map((p) => (
        <div
          key={p.key}
          role="listitem"
          className={["mj-prayer-summary__cell", p.key === nextKey ? "is-next" : ""].filter(Boolean).join(" ")}
        >
          <span className="mj-prayer-summary__cell-name">{p.name}</span>
          <span className="mj-prayer-summary__cell-time" dir="ltr">
            {fmt(p.time)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PrayerSummaryCard() {
  const { data, nextKey, countdown, nextName, nextTime } = usePrayerSummary();
  const fmt = useNumerals();
  const hasPrayers = Boolean(data?.prayers?.length);

  return (
    <AppCard className="mj-prayer-summary" as="section" aria-label="مواقيت الصلاة">
      <AppSectionHeader
        title="مواقيت الصلاة"
        action={
          <Link href="/prayer-times" className="mj-prayer-summary__link">
            التفاصيل
          </Link>
        }
      />

      {hasPrayers ? (
        <>
          <div className="mj-prayer-summary__hero">
            <div className="mj-prayer-summary__next">
              <span className="mj-prayer-summary__next-label">
                {nextName ? `الصلاة القادمة: ${nextName}` : "الصلاة القادمة"}
              </span>
              <strong className="mj-prayer-summary__next-time" dir="ltr">
                {nextTime ? fmt(nextTime) : "—"}
              </strong>
            </div>
            {countdown ? (
              <p className="mj-prayer-summary__countdown" aria-live="polite">
                متبقٍّ{" "}
                <span dir="ltr">{fmt(countdown)}</span>
              </p>
            ) : null}
          </div>

          {(data?.date?.hijri || data?.date?.gregorian) && (
            <p className="mj-prayer-summary__dates">
              {data?.date?.hijri ? <span>{data.date.hijri}</span> : null}
              {data?.date?.gregorian ? <span dir="ltr">{data.date.gregorian}</span> : null}
            </p>
          )}

          <PrayerRow prayers={data!.prayers} nextKey={nextKey} />
        </>
      ) : (
        <div className="mj-prayer-summary__empty">
          <p>اختر المدينة لعرض المواقيت</p>
          <Link href="/prayer-times" className="mj-prayer-summary__empty-cta">
            تحديد الموقع
          </Link>
        </div>
      )}
    </AppCard>
  );
}
