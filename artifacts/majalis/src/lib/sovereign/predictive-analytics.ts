/**
 * تحليلات تنبؤية محلية — ملخصات مجمّعة بلا بيانات شخصية خام.
 * ساعات القراءة، السور المتكررة، القارئ المفضّل، بصمة منطقة زمنية تقريبية.
 */
import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";

export type UsageHabitSnapshot = {
  /** عدد جلسات قراءة لكل ساعة (0–23) */
  hourBuckets: number[];
  /** surah → عدد الزيارات */
  surahHits: Record<string, number>;
  /** reciterId → عدد التشغيلات */
  reciterHits: Record<string, number>;
  /** آخر منطقة زمنية للجهاز (للتعديل الصامت للمواقيت) */
  deviceTimeZone: string;
  updatedAt: string;
};

const KEY = "majalis-sovereign-habits-v1";
const MAX_SURAH_KEYS = 48;

function emptySnapshot(): UsageHabitSnapshot {
  return {
    hourBuckets: Array.from({ length: 24 }, () => 0),
    surahHits: {},
    reciterHits: {},
    deviceTimeZone: resolveDeviceTimeZone(),
    updatedAt: new Date().toISOString(),
  };
}

function isSnapshot(v: unknown): v is UsageHabitSnapshot {
  return (
    isPlainObject(v) &&
    Array.isArray(v.hourBuckets) &&
    v.hourBuckets.length === 24 &&
    isPlainObject(v.surahHits) &&
    isPlainObject(v.reciterHits)
  );
}

export function resolveDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait";
  } catch {
    return "Asia/Kuwait";
  }
}

function loadSnapshot(): UsageHabitSnapshot {
  return readLocalJson(KEY, emptySnapshot(), isSnapshot);
}

function saveSnapshot(snap: UsageHabitSnapshot): void {
  writeLocalJson(KEY, { ...snap, updatedAt: new Date().toISOString() });
}

function trimSurahHits(hits: Record<string, number>): Record<string, number> {
  const entries = Object.entries(hits).sort((a, b) => b[1] - a[1]);
  if (entries.length <= MAX_SURAH_KEYS) return hits;
  return Object.fromEntries(entries.slice(0, MAX_SURAH_KEYS));
}

/** تسجيل نشاط قراءة في الساعة الحالية — بلا مسارات ولا إحداثيات. */
export function recordReadingActivity(opts?: { surah?: number; ayah?: number; reciterId?: string }): void {
  const snap = loadSnapshot();
  const hour = new Date().getHours();
  snap.hourBuckets[hour] = (snap.hourBuckets[hour] ?? 0) + 1;
  if (opts?.surah != null && Number.isFinite(opts.surah)) {
    const k = String(Math.min(114, Math.max(1, Math.floor(opts.surah))));
    snap.surahHits[k] = (snap.surahHits[k] ?? 0) + 1;
    snap.surahHits = trimSurahHits(snap.surahHits);
  }
  if (opts?.reciterId) {
    snap.reciterHits[opts.reciterId] = (snap.reciterHits[opts.reciterId] ?? 0) + 1;
  }
  snap.deviceTimeZone = resolveDeviceTimeZone();
  saveSnapshot(snap);
}

export function getPeakReadingHours(limit = 3): number[] {
  const snap = loadSnapshot();
  return snap.hourBuckets
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ hour }) => hour);
}

export function getTopSurahs(limit = 5): number[] {
  const snap = loadSnapshot();
  return Object.entries(snap.surahHits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => Number.parseInt(k, 10))
    .filter((n) => Number.isFinite(n));
}

export function getPreferredReciterId(): string | null {
  const snap = loadSnapshot();
  const top = Object.entries(snap.reciterHits).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? null;
}

export function getUsageHabitSnapshot(): UsageHabitSnapshot {
  return loadSnapshot();
}

export function resetUsageHabitsForTests(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}
