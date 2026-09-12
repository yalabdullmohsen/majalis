import type { SyncRecord } from "./types";

const SCHEMA_KEY = "majalis-sync-schema-v";
export const SYNC_SCHEMA_VERSION = 1;
const QUEUE_PREFIX = "majalis-sync-queue:";
const CLOCK_PREFIX = "majalis-sync-clock:";
const LAST_FLUSH_KEY = "majalis-sync-last-flush";

const mem = new Map<string, string>();

function canLs(): boolean {
  return typeof localStorage !== "undefined";
}

function getRaw(key: string): string | null {
  if (canLs()) {
    try {
      return localStorage.getItem(key);
    } catch {
      return mem.get(key) ?? null;
    }
  }
  return mem.get(key) ?? null;
}

function setRaw(key: string, value: string): void {
  mem.set(key, value);
  if (!canLs()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* memory only */
  }
}

function removeRaw(key: string): void {
  mem.delete(key);
  if (!canLs()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getSyncSchemaVersion(): number {
  const v = Number(getRaw(SCHEMA_KEY) || "0");
  return Number.isFinite(v) ? v : 0;
}

export function setSyncSchemaVersion(v: number): void {
  setRaw(SCHEMA_KEY, String(v));
}

export function loadQueue(scopeId: string): SyncRecord[] {
  const raw = getRaw(`${QUEUE_PREFIX}${scopeId}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SyncRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveQueue(scopeId: string, items: SyncRecord[]): void {
  setRaw(`${QUEUE_PREFIX}${scopeId}`, JSON.stringify(items.slice(-500)));
}

export function clearQueue(scopeId: string): void {
  removeRaw(`${QUEUE_PREFIX}${scopeId}`);
}

export function getClock(scopeId: string, kind: string, entityId: string): SyncRecord | null {
  const raw = getRaw(`${CLOCK_PREFIX}${scopeId}:${kind}:${entityId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SyncRecord;
  } catch {
    return null;
  }
}

export function setClock(record: SyncRecord): void {
  setRaw(
    `${CLOCK_PREFIX}${record.scopeId}:${record.kind}:${record.entityId}`,
    JSON.stringify(record),
  );
}

export function clearClocksForScope(scopeId: string): number {
  let removed = 0;
  const needle = `${CLOCK_PREFIX}${scopeId}:`;
  if (canLs()) {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k?.startsWith(needle)) keys.push(k);
    }
    for (const k of keys) {
      removeRaw(k);
      removed += 1;
    }
  }
  for (const k of [...mem.keys()]) {
    if (k.startsWith(needle)) {
      mem.delete(k);
      removed += 1;
    }
  }
  return removed;
}

export function getLastFlushAt(): string | null {
  return getRaw(LAST_FLUSH_KEY);
}

export function setLastFlushAt(iso: string): void {
  setRaw(LAST_FLUSH_KEY, iso);
}

export function __resetSyncLocalStoreForTests(): void {
  mem.clear();
  if (!canLs()) return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (
      k &&
      (k.startsWith(QUEUE_PREFIX) ||
        k.startsWith(CLOCK_PREFIX) ||
        k === SCHEMA_KEY ||
        k === LAST_FLUSH_KEY)
    ) {
      keys.push(k);
    }
  }
  for (const k of keys) localStorage.removeItem(k);
}
