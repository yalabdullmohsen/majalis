/**
 * منع التكرار — مفتاح ثابت + سجل حالات محلي.
 */

export type NotificationLifecycle =
  | "scheduled"
  | "sent"
  | "delivered"
  | "opened"
  | "dismissed"
  | "failed"
  | "cancelled";

export type DedupeRecord = {
  key: string;
  channel: string;
  status: NotificationLifecycle;
  createdAt: string;
  expiresAt: string;
  transport?: "local" | "push";
};

const DEDUPE_KEY = "sunnah.notifications.dedupe.v1";
const MAX_RECORDS = 400;

export function buildDedupeKey(parts: {
  userId?: string | null;
  channel: string;
  entityId: string;
  eventType: string;
  scheduledPeriod: string;
}): string {
  const user = (parts.userId || "anon").trim() || "anon";
  return [user, parts.channel, parts.entityId, parts.eventType, parts.scheduledPeriod]
    .map((p) => String(p).replace(/\|/g, "/").slice(0, 120))
    .join("|");
}

function readAll(): DedupeRecord[] {
  try {
    const raw = localStorage.getItem(DEDUPE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DedupeRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: DedupeRecord[]): void {
  try {
    localStorage.setItem(DEDUPE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch {
    /* quota */
  }
}

function prune(records: DedupeRecord[], now = Date.now()): DedupeRecord[] {
  return records.filter((r) => {
    const exp = Date.parse(r.expiresAt);
    return !Number.isFinite(exp) || exp > now;
  });
}

export function findDedupeRecord(key: string): DedupeRecord | null {
  return prune(readAll()).find((r) => r.key === key) ?? null;
}

export function hasActiveDedupe(
  key: string,
  blocking: NotificationLifecycle[] = ["scheduled", "sent", "delivered", "opened"],
): boolean {
  const hit = findDedupeRecord(key);
  return Boolean(hit && blocking.includes(hit.status));
}

export function upsertDedupeRecord(
  record: Omit<DedupeRecord, "createdAt"> & { createdAt?: string },
): DedupeRecord {
  const nowIso = new Date().toISOString();
  const next: DedupeRecord = { ...record, createdAt: record.createdAt ?? nowIso };
  const others = prune(readAll()).filter((r) => r.key !== next.key);
  writeAll([next, ...others]);
  return next;
}

export function markDedupeStatus(
  key: string,
  status: NotificationLifecycle,
): DedupeRecord | null {
  const cur = findDedupeRecord(key);
  if (!cur) return null;
  return upsertDedupeRecord({ ...cur, status });
}

export function localDayPeriod(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function localWeekPeriod(d = new Date()): string {
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  const day = (tmp.getDay() + 6) % 7;
  tmp.setDate(tmp.getDate() - day);
  return `w-${localDayPeriod(tmp)}`;
}
