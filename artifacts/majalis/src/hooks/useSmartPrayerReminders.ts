import { useEffect, useRef, useState } from "react";
import type { PrayerCountdown, PrayerSlot, PrayerTimesPayload } from "@/lib/prayer-times";
import { PRAYER_SLOT_MAP, type PrayerKey } from "@/lib/prayer-tracker";

export type SmartReminder = {
  type: "approaching" | "late" | "missed" | "info";
  message: string;
  prayerKey?: PrayerKey;
};

const APPROACH_MS = 15 * 60 * 1000;
const LATE_MS = 30 * 60 * 1000;

function slotToKey(slot: PrayerSlot | null): PrayerKey | undefined {
  if (!slot) return undefined;
  const entry = Object.entries(PRAYER_SLOT_MAP).find(([, v]) => v === slot.key);
  return entry?.[0] as PrayerKey | undefined;
}

function findSlot(payload: PrayerTimesPayload | null, key: PrayerKey): PrayerSlot | null {
  const slotKey = PRAYER_SLOT_MAP[key];
  return payload?.prayers.find((p) => p.key === slotKey) || null;
}

export function useSmartPrayerReminders(
  data: PrayerTimesPayload | null,
  countdown: PrayerCountdown | null,
  todayDone: Record<PrayerKey, "pending" | "done" | "missed"> | undefined,
) {
  const [reminder, setReminder] = useState<SmartReminder | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data || !countdown) {
      setReminder(null);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const next = countdown.next;
      const current = countdown.current;

      if (next && countdown.remainingMs <= APPROACH_MS && countdown.remainingMs > 0) {
        const key = slotToKey(next);
        const id = `approach-${key}-${data.date.gregorian}`;
        if (!notifiedRef.current.has(id)) {
          setReminder({
            type: "approaching",
            message: `اقترب وقت ${next.name} — تبقّى ${countdown.remainingLabel}`,
            prayerKey: key,
          });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("تذكير الصلاة", { body: `اقترب وقت ${next.name}` });
          }
          notifiedRef.current.add(id);
        }
        return;
      }

      if (current && current.obligatory) {
        const key = slotToKey(current);
        const status = key && todayDone ? todayDone[key] : "pending";
        const currentSlot = findSlot(data, key!);
        const nextObligatory = data.prayers.find(
          (p) => p.obligatory && p.minutes != null && currentSlot?.minutes != null && p.minutes > currentSlot.minutes,
        );

        let elapsedMs = 0;
        if (currentSlot?.minutes != null) {
          const nowParts = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Kuwait",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).formatToParts(new Date());
          const h = Number(nowParts.find((p) => p.type === "hour")?.value || 0);
          const m = Number(nowParts.find((p) => p.type === "minute")?.value || 0);
          const s = Number(nowParts.find((p) => p.type === "second")?.value || 0);
          const nowMin = h * 60 + m;
          elapsedMs = ((nowMin - currentSlot.minutes) * 60 + s) * 1000;
        }

        if (status === "pending" && elapsedMs > LATE_MS) {
          const id = `late-${key}-${data.date.gregorian}`;
          if (!notifiedRef.current.has(id)) {
            setReminder({
              type: "late",
              message: `تأخّرت عن ${current.name} — أسرع إلى الصلاة`,
              prayerKey: key,
            });
            notifiedRef.current.add(id);
          }
          return;
        }

        if (status === "missed") {
          setReminder({
            type: "missed",
            message: `فاتتك ${current.name} — توب إلى الله ولا تفوّت القادمة`,
            prayerKey: key,
          });
          return;
        }

        if (status === "pending" && nextObligatory) {
          const windowMs =
            nextObligatory.minutes != null && currentSlot?.minutes != null
              ? (nextObligatory.minutes - currentSlot.minutes) * 60_000
              : 0;
          const remainingWindow = Math.max(0, windowMs - elapsedMs);
          const mins = Math.floor(remainingWindow / 60_000);
          setReminder({
            type: "info",
            message: `وقت ${current.name} — متبقٍ ${mins} دقيقة حتى ${nextObligatory.name}`,
            prayerKey: key,
          });
          return;
        }
      }

      setReminder(null);
    };

    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [data, countdown, todayDone]);

  const requestNotificationPermission = () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  };

  return { reminder, requestNotificationPermission };
}

export type PrayerWindowInfo = {
  sinceEntry: string;
  untilExit: string;
  untilIqama: string | null;
  remainingToNext: string;
};

export function computePrayerWindowInfo(
  data: PrayerTimesPayload | null,
  countdown: PrayerCountdown | null,
): PrayerWindowInfo | null {
  if (!data || !countdown?.current) return null;

  const current = countdown.current;
  const next = data.prayers.find(
    (p) => p.obligatory && p.minutes != null && current.minutes != null && p.minutes > current.minutes,
  );

  const nowParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuwait",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(nowParts.find((p) => p.type === "hour")?.value || 0);
  const m = Number(nowParts.find((p) => p.type === "minute")?.value || 0);
  const s = Number(nowParts.find((p) => p.type === "second")?.value || 0);
  const nowMin = h * 60 + m;

  const fmt = (totalSec: number) => {
    const safe = Math.max(0, totalSec);
    const hh = Math.floor(safe / 3600);
    const mm = Math.floor((safe % 3600) / 60);
    const ss = safe % 60;
    if (hh > 0) return `${hh} س ${mm} د`;
    return `${mm} د ${ss} ث`;
  };

  let sinceSec = 0;
  let untilSec = 0;
  if (current.minutes != null) {
    sinceSec = (nowMin - current.minutes) * 60 + s;
    if (next?.minutes != null) {
      untilSec = (next.minutes - nowMin) * 60 - s;
    }
  }

  // Approximate iqama: 20 min after adhan for congregational prayers (except Maghrib ~5 min)
  let iqamaSec: number | null = null;
  if (current.minutes != null) {
    const iqamaOffset = current.key === "Maghrib" ? 5 : 20;
    const iqamaMin = current.minutes + iqamaOffset;
    if (nowMin < iqamaMin) {
      iqamaSec = (iqamaMin - nowMin) * 60 - s;
    }
  }

  return {
    sinceEntry: fmt(sinceSec),
    untilExit: next ? fmt(untilSec) : "—",
    untilIqama: iqamaSec != null ? fmt(iqamaSec) : null,
    remainingToNext: countdown.remainingHms,
  };
}
