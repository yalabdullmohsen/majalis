"use client";

import { useState } from "react";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import type { PrayerSlot } from "@/lib/prayer-times";

const PRAYER_AR: Record<string, string> = {
  Fajr:    "الفجر",
  Sunrise: "الشروق",
  Dhuhr:   "الظهر",
  Asr:     "العصر",
  Maghrib: "المغرب",
  Isha:    "العشاء",
};

// ── الوقت الحالي بتوقيت الكويت (ثوانٍ منذ منتصف الليل) ──
function kuwaitNowSeconds(): { totalMinutes: number; seconds: number } {
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
  return { totalMinutes: h * 60 + m, seconds: s };
}

// ── حساب الثواني المتبقية لصلاة بحسب minutes (دقائق منذ منتصف الليل) ──
function secondsUntilPrayer(prayerMinutes: number | null): { seconds: number; isTomorrow: boolean } {
  if (prayerMinutes == null) return { seconds: 0, isTomorrow: false };
  const now = kuwaitNowSeconds();
  if (prayerMinutes > now.totalMinutes) {
    return { seconds: (prayerMinutes - now.totalMinutes) * 60 - now.seconds, isTomorrow: false };
  }
  // الصلاة مضت اليوم → احسب حتى الغد
  return {
    seconds: (24 * 60 - now.totalMinutes + prayerMinutes) * 60 - now.seconds,
    isTomorrow: true,
  };
}

function formatHms(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function PrayerTimesPage() {
  const { data, countdown, loading } = usePrayerCountdown();
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="pt-wrap" dir="rtl">
        <div className="pt-skeleton" aria-busy="true">
          <div className="pt-skeleton__label">جارٍ تحميل المواقيت…</div>
        </div>
      </div>
    );
  }

  if (!countdown?.next) {
    return (
      <div className="pt-wrap" dir="rtl">
        <p className="pt-error">تعذّر تحميل مواقيت الصلاة — تحقق من الاتصال.</p>
      </div>
    );
  }

  const prayers: PrayerSlot[] = (data?.prayers ?? []).filter((p) => p.time);

  // تحديد الصلاة المعروضة في العداد
  const displayKey  = pinnedKey ?? countdown.next.key;
  const displayItem = prayers.find((p) => p.key === displayKey);
  const displayName = PRAYER_AR[displayKey] ?? countdown.next.name;
  const displayTime = displayItem?.time ?? countdown.next.time;

  // حساب الوقت المتبقي للصلاة المختارة
  let displayHms: string;
  let isTomorrow = false;
  if (pinnedKey && pinnedKey !== countdown.next.key) {
    // الصلاة المثبّتة ليست التالية تلقائياً — احسب بتوقيت الكويت من p.minutes
    const { seconds, isTomorrow: tmrw } = secondsUntilPrayer(displayItem?.minutes ?? null);
    displayHms = formatHms(seconds);
    isTomorrow = tmrw;
  } else {
    displayHms = countdown.remainingHms ?? "--:--:--";
  }

  const isNext = (key: string) => key === countdown.next?.key;
  const isPinned = (key: string) => key === displayKey;

  return (
    <div className="pt-wrap" dir="rtl">
      {/* ── العداد الرئيسي ── */}
      <section className="pt-hero" aria-label="العداد التنازلي">
        <div className="pt-hero__label">
          {pinnedKey && pinnedKey !== countdown.next.key ? "الوقت المتبقي لـ" : "الصلاة القادمة"}
        </div>
        <h1 className="pt-hero__name" key={displayKey}>
          {displayName}
        </h1>
        <div className="pt-hero__time">{displayTime}</div>
        <div
          className="pt-hero__countdown"
          dir="ltr"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`الوقت المتبقي: ${displayHms}`}
          key={displayHms}
        >
          {displayHms}
        </div>
        <div className="pt-hero__hint">
          {pinnedKey && pinnedKey !== countdown.next.key ? (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              {isTomorrow && <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: "999px", padding: "0.1rem 0.55rem", fontSize: "0.72rem", fontWeight: 700 }}>غداً</span>}
              <button className="pt-hero__reset" onClick={() => setPinnedKey(null)}>العودة للصلاة القادمة</button>
            </span>
          ) : "الوقت المتبقي"}
        </div>
      </section>

      {/* ── شريط الصلوات الخمس القابل للنقر ── */}
      {prayers.length > 0 && (
        <nav className="pt-prayers" role="list" aria-label="صلوات اليوم">
          {prayers.map((p) => (
            <button
              key={p.key}
              role="listitem"
              className={[
                "pt-prayer",
                isNext(p.key) ? "pt-prayer--next" : "",
                isPinned(p.key) ? "pt-prayer--pinned" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => setPinnedKey(p.key === pinnedKey ? null : p.key)}
              aria-pressed={isPinned(p.key)}
              aria-label={`صلاة ${PRAYER_AR[p.key] ?? p.name} — ${p.time}`}
            >
              <span className="pt-prayer__name">{PRAYER_AR[p.key] ?? p.name}</span>
              <span className="pt-prayer__time">{p.time}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ── بيانات المدينة ── */}
      {data?.city && (
        <p className="pt-city">{data.city}</p>
      )}
    </div>
  );
}
