/**
 * Sacred Time & Forbidden Hours Calculator.
 * Astronomical/prayer-derived marks: last third of the night, Ishraq,
 * midday Zawal, Friday Answer Hour. Exposes contextual Azkar recommendations.
 */

import type { PrayerSlot } from "@/lib/prayer-times";

export type SacredMarkId =
  | "last_third_night"
  | "ishraq"
  | "zawal"
  | "friday_answer_hour"
  | "duha";

export type SacredTimeWindow = {
  id: SacredMarkId;
  labelAr: string;
  /** Minutes from midnight (local prayer day) */
  startMinutes: number;
  endMinutes: number;
  /** True when nafl salah is generally discouraged */
  prayerRestricted: boolean;
};

export type SacredTimeState = {
  nowMinutes: number;
  isFriday: boolean;
  active: SacredTimeWindow[];
  upcoming: SacredTimeWindow | null;
  windows: SacredTimeWindow[];
  /** Contextual azkar recommendations */
  azkarRecommendations: SacredAzkarRecommendation[];
  updatedAt: string;
};

export type SacredAzkarRecommendation = {
  titleAr: string;
  href: string;
  reasonAr: string;
  markId: SacredMarkId | "general";
  priority: number;
};

function slotMinutes(prayers: PrayerSlot[], key: string): number | null {
  const s = prayers.find((p) => p.key === key);
  return s?.minutes ?? null;
}

function clampDay(m: number): number {
  const day = 24 * 60;
  let x = m % day;
  if (x < 0) x += day;
  return x;
}

function inWindow(now: number, start: number, end: number): boolean {
  const s = clampDay(start);
  const e = clampDay(end);
  if (s <= e) return now >= s && now < e;
  // wraps midnight
  return now >= s || now < e;
}

/**
 * Compute sacred windows from today's prayer slots.
 * Night span: Maghrib → next Fajr (or Fajr if before maghrib using previous night approx).
 */
export function computeSacredWindows(
  prayers: PrayerSlot[],
  opts?: { isFriday?: boolean; ishraqOffsetMin?: number; zawalBeforeDhuhrMin?: number },
): SacredTimeWindow[] {
  const fajr = slotMinutes(prayers, "Fajr");
  const sunrise = slotMinutes(prayers, "Sunrise");
  const dhuhr = slotMinutes(prayers, "Dhuhr");
  const maghrib = slotMinutes(prayers, "Maghrib");
  const ishraqOffset = opts?.ishraqOffsetMin ?? 15;
  const zawalBefore = opts?.zawalBeforeDhuhrMin ?? 8;
  const windows: SacredTimeWindow[] = [];

  if (maghrib != null && fajr != null) {
    // Night length from maghrib to fajr (crossing midnight)
    const nightLen = clampDay(fajr + 24 * 60 - maghrib);
    const third = nightLen / 3;
    const lastThirdStart = clampDay(maghrib + third * 2);
    windows.push({
      id: "last_third_night",
      labelAr: "الثلث الأخير من الليل",
      startMinutes: lastThirdStart,
      endMinutes: fajr,
      prayerRestricted: false,
    });
  }

  if (sunrise != null) {
    const ishraqStart = clampDay(sunrise + ishraqOffset);
    const ishraqEnd = dhuhr != null ? clampDay(dhuhr - 20) : clampDay(ishraqStart + 90);
    windows.push({
      id: "ishraq",
      labelAr: "وقت الإشراق",
      startMinutes: ishraqStart,
      endMinutes: Math.min(ishraqEnd, clampDay(ishraqStart + 45)),
      prayerRestricted: false,
    });
    windows.push({
      id: "duha",
      labelAr: "وقت الضحى",
      startMinutes: ishraqStart,
      endMinutes: dhuhr != null ? clampDay(dhuhr - zawalBefore) : ishraqEnd,
      prayerRestricted: false,
    });
  }

  if (dhuhr != null) {
    windows.push({
      id: "zawal",
      labelAr: "وقت الزوال",
      startMinutes: clampDay(dhuhr - zawalBefore),
      endMinutes: dhuhr,
      prayerRestricted: true,
    });
  }

  if (opts?.isFriday && maghrib != null) {
    windows.push({
      id: "friday_answer_hour",
      labelAr: "ساعة الإجابة يوم الجمعة",
      startMinutes: clampDay(maghrib - 60),
      endMinutes: maghrib,
      prayerRestricted: false,
    });
  }

  return windows;
}

export function buildSacredAzkarRecommendations(
  active: SacredTimeWindow[],
  isFriday: boolean,
): SacredAzkarRecommendation[] {
  const recs: SacredAzkarRecommendation[] = [];
  for (const w of active) {
    switch (w.id) {
      case "last_third_night":
        recs.push({
          titleAr: "قيام ودعاء السحر",
          href: "/adhkar?cat=salah",
          reasonAr: "الثلث الأخير — وقت إجابة وقيام.",
          markId: w.id,
          priority: 95,
        });
        break;
      case "ishraq":
        recs.push({
          titleAr: "أذكار الصباح وصلاة الإشراق",
          href: "/adhkar?cat=morning",
          reasonAr: "بعد الشروق بقليل — أذكار الصباح والإشراق.",
          markId: w.id,
          priority: 88,
        });
        break;
      case "duha":
        recs.push({
          titleAr: "صلاة الضحى",
          href: "/adhkar?cat=salah",
          reasonAr: "وقت الضحى مستحب للنفل.",
          markId: w.id,
          priority: 70,
        });
        break;
      case "zawal":
        recs.push({
          titleAr: "استغفار وانتظار الظهر",
          href: "/adhkar?cat=istighfar",
          reasonAr: "الزوال — يُكره التنفل؛ ذِكر حتى الأذان.",
          markId: w.id,
          priority: 80,
        });
        break;
      case "friday_answer_hour":
        recs.push({
          titleAr: "دعاء ساعة الإجابة",
          href: "/adhkar?cat=istikharah",
          reasonAr: "آخر ساعة قبل مغرب الجمعة.",
          markId: w.id,
          priority: 98,
        });
        break;
    }
  }
  if (isFriday && !active.some((a) => a.id === "friday_answer_hour")) {
    recs.push({
      titleAr: "سورة الكهف",
      href: "/mushaf/18",
      reasonAr: "يوم الجمعة — يُستحب قراءة الكهف.",
      markId: "friday_answer_hour",
      priority: 60,
    });
  }
  if (recs.length === 0) {
    recs.push({
      titleAr: "أذكار مطلقة",
      href: "/adhkar",
      reasonAr: "لا نافذة خاصة الآن — داوم على الذكر.",
      markId: "general",
      priority: 10,
    });
  }
  return recs.sort((a, b) => b.priority - a.priority);
}

export function resolveSacredTimeState(
  prayers: PrayerSlot[],
  opts?: { nowMinutes?: number; isFriday?: boolean; now?: Date },
): SacredTimeState {
  const now = opts?.now ?? new Date();
  const nowMinutes =
    opts?.nowMinutes ??
    now.getHours() * 60 + now.getMinutes();
  const isFriday = opts?.isFriday ?? now.getDay() === 5;
  const windows = computeSacredWindows(prayers, { isFriday });
  const active = windows.filter((w) => inWindow(nowMinutes, w.startMinutes, w.endMinutes));
  const upcoming =
    windows
      .map((w) => ({
        w,
        delta: clampDay(w.startMinutes - nowMinutes),
      }))
      .filter((x) => !active.includes(x.w))
      .sort((a, b) => a.delta - b.delta)[0]?.w ?? null;

  return {
    nowMinutes,
    isFriday,
    active,
    upcoming,
    windows,
    azkarRecommendations: buildSacredAzkarRecommendations(active, isFriday),
    updatedAt: now.toISOString(),
  };
}

export function formatMinutesAsTime(minutes: number): string {
  const m = clampDay(minutes);
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** True if currently in a prayer-restricted sacred window (e.g. zawal). */
export function isInForbiddenPrayerWindow(state: SacredTimeState): boolean {
  return state.active.some((w) => w.prayerRestricted);
}
