import { TRACK_STORAGE_KEY } from "./constants";
import { emptyDay } from "./scoring";
import type { DayRecord, PrayerKey, PrayerSession, PrayerStore } from "./types";

function migrateV1(raw: unknown): PrayerStore {
  if (!raw || typeof raw !== "object") return {};
  const store: PrayerStore = {};
  for (const [date, dayVal] of Object.entries(raw as Record<string, unknown>)) {
    if (!dayVal || typeof dayVal !== "object") continue;
    const day = emptyDay(date);
    for (const key of Object.keys(day) as PrayerKey[]) {
      const old = (dayVal as Record<string, unknown>)[key];
      if (!old || typeof old !== "object") continue;
      const o = old as Record<string, unknown>;
      day[key] = {
        prayerDate: date,
        prayerKey: key,
        status: (o.status as PrayerSession["status"]) || "pending",
        place: o.place === "mosque" ? "mosque" : "home",
        congregation: !!o.congregation,
        isFirstTime: o.timing === "early" || !!o.isFirstTime,
        notes: String(o.notes || ""),
        pointsEarned: Number(o.pointsEarned) || 0,
        prayedAt: (o.prayedAt as string) || null,
        updatedAt: (o.updatedAt as string) || undefined,
      };
    }
    store[date] = day;
  }
  return store;
}

export function readPrayerStore(): PrayerStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TRACK_STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("majalis-prayer-tracker-v1");
      if (legacy) {
        const migrated = migrateV1(JSON.parse(legacy));
        writePrayerStore(migrated);
        return migrated;
      }
      return {};
    }
    return JSON.parse(raw) as PrayerStore;
  } catch {
    return {};
  }
}

export function writePrayerStore(store: PrayerStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify(store));
}

export function readEarnedAchievements(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${TRACK_STORAGE_KEY}:achievements`);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function writeEarnedAchievements(keys: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${TRACK_STORAGE_KEY}:achievements`, JSON.stringify([...keys]));
}

export function mergeStores(local: PrayerStore, remote: PrayerStore): PrayerStore {
  const merged: PrayerStore = { ...local };
  for (const [date, remoteDay] of Object.entries(remote)) {
    const localDay = merged[date];
    if (!localDay) {
      merged[date] = remoteDay;
      continue;
    }
    const nextDay = { ...localDay } as DayRecord;
    for (const key of Object.keys(remoteDay) as PrayerKey[]) {
      const r = remoteDay[key];
      const l = localDay[key];
      if (!r) continue;
      const rTime = r.updatedAt || r.prayedAt || "";
      const lTime = l?.updatedAt || l?.prayedAt || "";
      if (!l || rTime > lTime) nextDay[key] = r;
    }
    merged[date] = nextDay;
  }
  return merged;
}

export function storeToSessions(store: PrayerStore): PrayerSession[] {
  const sessions: PrayerSession[] = [];
  for (const day of Object.values(store)) {
    for (const key of Object.keys(day) as PrayerKey[]) {
      const s = day[key];
      if (s && s.status !== "pending") sessions.push(s);
    }
  }
  return sessions;
}

export function sessionsToStore(sessions: PrayerSession[]): PrayerStore {
  const store: PrayerStore = {};
  for (const s of sessions) {
    const date = s.prayerDate;
    if (!store[date]) store[date] = emptyDay(date);
    store[date][s.prayerKey] = s;
  }
  return store;
}
