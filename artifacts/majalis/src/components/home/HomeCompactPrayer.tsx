import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Clock } from "lucide-react";
import {
  computePrayerCountdown,
  fetchPrayerTimes,
  type PrayerSlot,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";
import { subscribeSecondTick } from "@/lib/second-tick";
import { subscribePrayerDayRollover } from "@/lib/prayer-day-rollover";
import { formatAdhanRemainingPhrase } from "@/lib/prayer-ticker-copy";

function kuwaitNowParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuwait",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const s = Number(parts.find((p) => p.type === "second")?.value ?? 0);
  return { minutes: h * 60 + m, seconds: s };
}

function getRemainingSecondsForPrayer(prayerMinutes: number): number {
  const { minutes: nowMin, seconds: nowSec } = kuwaitNowParts();
  let rem: number;
  if (prayerMinutes > nowMin) {
    rem = (prayerMinutes - nowMin) * 60 - nowSec;
  } else {
    rem = ((24 * 60 - nowMin) + prayerMinutes) * 60 - nowSec;
  }
  return Math.max(0, rem);
}

function getRemainingForPrayer(prayerMinutes: number): string {
  return formatAdhanRemainingPhrase(getRemainingSecondsForPrayer(prayerMinutes));
}

const GRACE_MINUTES = 30;

function getActualNextPrayer(obligatory: PrayerSlot[], currentKey: string | null): PrayerSlot | null {
  if (!currentKey) return null;
  const idx = obligatory.findIndex((p) => p.key === currentKey);
  if (idx < 0) return null;
  return obligatory[(idx + 1) % obligatory.length] ?? null;
}

function useCompactPrayer() {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [nextKey, setNextKey] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [sinceSeconds, setSinceSeconds] = useState<number | null>(null);
  const [graceNextHms, setGraceNextHms] = useState<string | null>(null);

  useEffect(() => {
    fetchPrayerTimes().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    return subscribePrayerDayRollover("Asia/Kuwait", () => {
      void fetchPrayerTimes().then(setData).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (!data?.prayers?.length) return;
    return subscribeSecondTick(() => {
      const cd = computePrayerCountdown(data.prayers);
      setNextKey(cd.next?.key ?? null);
      setCountdown(formatAdhanRemainingPhrase(Math.max(0, Math.round(cd.remainingMs / 1000))));
      setSinceSeconds(cd.sinceSeconds);
      setGraceNextHms(
        cd.graceNextSeconds != null
          ? formatAdhanRemainingPhrase(cd.graceNextSeconds)
          : null,
      );
    });
  }, [data]);

  return { data, nextKey, countdown, sinceSeconds, graceNextHms };
}

export function HomeCompactPrayer() {
  const { data, nextKey, countdown, sinceSeconds, graceNextHms } = useCompactPrayer();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedCountdown, setSelectedCountdown] = useState<string>("");

  useEffect(() => {
    if (!selectedKey || !data?.prayers?.length) {
      setSelectedCountdown("");
      return;
    }
    const prayer = data.prayers.find((p: PrayerSlot) => p.key === selectedKey);
    if (!prayer || prayer.minutes == null) {
      setSelectedCountdown("—");
      return;
    }
    return subscribeSecondTick(() => {
      setSelectedCountdown(getRemainingForPrayer(prayer.minutes!));
    });
  }, [selectedKey, data]);

  if (!data?.prayers?.length) return null;

  const obligatory = data.prayers.filter(
    (p: PrayerSlot) => p.obligatory || p.key === "Sunrise"
  );

  // الصلاة التي أذّنت للتو (خلال نافذة 30 دقيقة)
  const justRangPrayer = sinceSeconds != null ? obligatory.find((p) => p.key === nextKey) : null;
  // الصلاة التالية الفعلية (التي لم تأتِ بعد)
  const actualNextPrayer = sinceSeconds != null
    ? getActualNextPrayer(obligatory, nextKey)
    : obligatory.find((p) => p.key === nextKey);
  const selectedPrayer = selectedKey ? obligatory.find((p) => p.key === selectedKey) : null;
  const sinceMinutes = sinceSeconds != null ? Math.floor(sinceSeconds / 60) : 0;
  const graceProgress = sinceSeconds != null ? Math.min(100, (sinceSeconds / (GRACE_MINUTES * 60)) * 100) : 0;

  return (
    <div className="hcp-strip" dir="rtl" role="complementary" aria-label="مواقيت الصلاة">
      <div className="hcp-strip__head">
        <span className="hcp-strip__label">
          <Clock size={13} aria-hidden="true" />
          مواقيت الصلاة
        </span>
        <div className="hcp-strip__head-end">
          {selectedPrayer ? (
            <span className="hcp-strip__countdown hcp-strip__countdown--sel" aria-live="polite">
              متبقٍّ لـ{selectedPrayer.name}:{" "}
              <span className="hcp-strip__countdown-time">
                {selectedCountdown ? selectedCountdown : "—"}
              </span>
            </span>
          ) : sinceSeconds != null && justRangPrayer ? (
            <span className="hcp-strip__countdown hcp-strip__countdown--elapsed" aria-live="polite">
              <span className="hcp-since-pill">
                <span className="hcp-since-pill__text">
                  مضى على أذان {justRangPrayer.name}:{" "}
                  <span dir="ltr">{sinceMinutes} دقيقة</span>
                </span>
                <span
                  className="hcp-since-pill__bar"
                  style={{ "--hcp-bar-w": `${graceProgress}%` } as React.CSSProperties}
                  aria-hidden="true"
                />
              </span>
              {actualNextPrayer && graceNextHms && (
                <span className="hcp-next-hint">
                  متبقي على {actualNextPrayer.name}: {graceNextHms}
                </span>
              )}
            </span>
          ) : (
            actualNextPrayer && countdown && (
              <span className="hcp-strip__countdown" aria-live="off">
                متبقي على {actualNextPrayer.name}:{" "}
                <span className="hcp-strip__countdown-time">{countdown}</span>
              </span>
            )
          )}
          <Link href="/prayer-times" className="hcp-strip__link">التفاصيل ←</Link>
        </div>
      </div>
      <div className="hcp-strip__prayers">
        {obligatory.map((p: PrayerSlot) => (
          <button
            key={p.key}
            type="button"
            className={[
              "hcp-prayer-cell",
              p.key === nextKey ? "hcp-prayer-cell--next" : "",
              p.key === selectedKey ? "hcp-prayer-cell--sel" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setSelectedKey((prev) => (prev === p.key ? null : p.key))}
            aria-pressed={p.key === selectedKey}
            title={`اضغط لعرض الوقت المتبقي لـ${p.name}`}
          >
            <span className="hcp-prayer-cell__name">{p.name}</span>
            <span className="hcp-prayer-cell__time">{p.time}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
