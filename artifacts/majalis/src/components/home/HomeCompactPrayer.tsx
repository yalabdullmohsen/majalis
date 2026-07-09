import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Clock } from "lucide-react";
import {
  computePrayerCountdown,
  fetchPrayerTimes,
  type PrayerSlot,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";

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

function fmtHms(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getRemainingForPrayer(prayerMinutes: number): string {
  const { minutes: nowMin, seconds: nowSec } = kuwaitNowParts();
  let rem: number;
  if (prayerMinutes > nowMin) {
    rem = (prayerMinutes - nowMin) * 60 - nowSec;
  } else {
    rem = ((24 * 60 - nowMin) + prayerMinutes) * 60 - nowSec;
  }
  return fmtHms(Math.max(0, rem));
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
    if (!data?.prayers?.length) return;
    const tick = () => {
      const cd = computePrayerCountdown(data.prayers);
      setNextKey(cd.next?.key ?? null);
      setCountdown(cd.remainingHms ?? "");
      setSinceSeconds(cd.sinceSeconds);
      setGraceNextHms(cd.graceNextHms ?? null);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
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
    const tick = () => setSelectedCountdown(getRemainingForPrayer(prayer.minutes!));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
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
              <span className="hcp-strip__countdown-time" dir="ltr">
                {selectedCountdown || "—"}
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
                  style={{ width: `${graceProgress}%` }}
                  aria-hidden="true"
                />
              </span>
              {actualNextPrayer && graceNextHms && (
                <span className="hcp-next-hint">
                  {actualNextPrayer.name} بعد{" "}
                  <span dir="ltr">{graceNextHms}</span>
                </span>
              )}
            </span>
          ) : (
            actualNextPrayer && countdown && (
              <span className="hcp-strip__countdown" aria-live="off">
                متبقٍّ على {actualNextPrayer.name}:{" "}
                <span className="hcp-strip__countdown-time" dir="ltr">{countdown}</span>
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
