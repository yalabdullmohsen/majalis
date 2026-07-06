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

// ── مساعد: فرق بالدقائق بين توقيت صلاة واللحظة الحالية ──
function minutesUntil(timeStr: string): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  let diff = (target.getTime() - now.getTime()) / 60000;
  if (diff < 0) diff += 24 * 60;
  return Math.floor(diff);
}

function hmsFromMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
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
  if (pinnedKey && pinnedKey !== countdown.next.key) {
    const mins = minutesUntil(displayTime ?? "");
    displayHms = mins !== null ? hmsFromMinutes(mins) : "--:--:--";
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
          {pinnedKey && pinnedKey !== countdown.next.key
            ? <button className="pt-hero__reset" onClick={() => setPinnedKey(null)}>العودة للصلاة القادمة</button>
            : "الوقت المتبقي"}
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
