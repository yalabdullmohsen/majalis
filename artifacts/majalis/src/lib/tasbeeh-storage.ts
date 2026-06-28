import { supabase } from "@/lib/supabase";

export type TasbeehPreset = 33 | 100 | 500 | 1000 | "custom" | "open";

export type TasbeehHistoryEntry = {
  phrase: string;
  count: number;
  target: number;
  completedAt: string;
};

export type TasbeehWird = {
  id: string;
  phrase: string;
  target: number;
  count: number;
  createdAt: string;
  updatedAt: string;
  /** date key (YYYY-MM-DD) -> count added that day */
  dailyHistory: Record<string, number>;
  /** cumulative taps for stats */
  lifetimeTotal: number;
};

export type TasbeehStats = {
  today: number;
  week: number;
  month: number;
  total: number;
};

const STORAGE_KEY = "majalis-tasbih-v3";
const META_KEY = "tasbeeh_state";
const HISTORY_KEY = "majalis-tasbih-history-v1";
const MAX_HISTORY = 50;

export const TASBEEH_PRESETS: Array<{ value: TasbeehPreset; label: string }> = [
  { value: "open", label: "مفتوح" },
  { value: 33, label: "33" },
  { value: 100, label: "100" },
  { value: 500, label: "500" },
  { value: 1000, label: "1000" },
  { value: "custom", label: "مخصص" },
];

export const DEFAULT_TASBEEH_AWRAD: TasbeehWird[] = [
  { id: "subhanallah", phrase: "سبحان الله", target: 100, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dailyHistory: {}, lifetimeTotal: 0 },
  { id: "alhamdulillah", phrase: "الحمد لله", target: 100, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dailyHistory: {}, lifetimeTotal: 0 },
  { id: "tahleel", phrase: "لا إله إلا الله", target: 100, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dailyHistory: {}, lifetimeTotal: 0 },
  { id: "takbir", phrase: "الله أكبر", target: 100, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dailyHistory: {}, lifetimeTotal: 0 },
  { id: "salawat", phrase: "الصلاة على النبي ﷺ", target: 100, count: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dailyHistory: {}, lifetimeTotal: 0 },
];

export function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());
}

function weekStartKey() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(d);
}

function monthStartKey() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(d);
}

export function computeTasbeehStats(wird: TasbeehWird): TasbeehStats {
  const today = todayKey();
  const weekStart = weekStartKey();
  const monthStart = monthStartKey();
  let week = 0;
  let month = 0;
  for (const [date, n] of Object.entries(wird.dailyHistory || {})) {
    if (date >= weekStart) week += n;
    if (date >= monthStart) month += n;
  }
  return {
    today: wird.dailyHistory?.[today] ?? 0,
    week,
    month,
    total: wird.lifetimeTotal ?? 0,
  };
}

export function readTasbeehAwrad(): TasbeehWird[] {
  if (typeof window === "undefined") return DEFAULT_TASBEEH_AWRAD;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TASBEEH_AWRAD;
    const parsed = JSON.parse(raw) as TasbeehWird[];
    return parsed.length ? parsed : DEFAULT_TASBEEH_AWRAD;
  } catch {
    return DEFAULT_TASBEEH_AWRAD;
  }
}

export function writeTasbeehAwrad(items: TasbeehWird[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function readEmbeddedCounter(storageId: string): { count: number; target: number } {
  if (typeof window === "undefined") return { count: 0, target: 0 };
  try {
    const raw = localStorage.getItem(`majalis-tasbeeh-item-${storageId}`);
    if (!raw) return { count: 0, target: 0 };
    return JSON.parse(raw) as { count: number; target: number };
  } catch {
    return { count: 0, target: 0 };
  }
}

export function writeEmbeddedCounter(storageId: string, state: { count: number; target: number }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`majalis-tasbeeh-item-${storageId}`, JSON.stringify(state));
}

export async function syncTasbeehToAccount(items: TasbeehWird[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not_logged_in" as const };
  const { error } = await supabase.auth.updateUser({
    data: { [META_KEY]: { awrad: items, syncedAt: new Date().toISOString() } },
  });
  return { ok: !error, error: error?.message };
}

export async function loadTasbeehFromAccount(): Promise<TasbeehWird[] | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const remote = user.user_metadata?.[META_KEY]?.awrad;
  if (!Array.isArray(remote) || !remote.length) return null;
  return remote as TasbeehWird[];
}

export function mergeTasbeehAwrad(local: TasbeehWird[], remote: TasbeehWird[] | null): TasbeehWird[] {
  if (!remote?.length) return local;
  const byId = new Map(local.map((w) => [w.id, w]));
  for (const r of remote) {
    const existing = byId.get(r.id);
    if (!existing || (r.lifetimeTotal ?? 0) > (existing.lifetimeTotal ?? 0)) {
      byId.set(r.id, r);
    }
  }
  return [...byId.values()];
}

export function readTasbeehHistory(): TasbeehHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as TasbeehHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendTasbeehHistory(entry: TasbeehHistoryEntry) {
  if (typeof window === "undefined") return;
  const existing = readTasbeehHistory();
  existing.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.slice(0, MAX_HISTORY)));
}

export function clearTasbeehHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}
