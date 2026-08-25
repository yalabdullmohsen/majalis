/**
 * WAL تفاؤلي + دمج CRDT (LWW) للفواصل والتقدّم المحلي.
 */
import { writeLocalJsonAtomic } from "@/lib/safe-json";
import { runOptimisticAction } from "@/lib/sovereign/optimistic-engine";

export type WalEntry<T> = {
  id: string;
  op: "set" | "delete";
  payload: T;
  /** ISO timestamp — LWW tie-breaker */
  at: string;
  store: string;
};

const WAL_KEY = "majalis-sovereign-wal-v1";
const MAX_WAL = 128;

function loadWal(): WalEntry<unknown>[] {
  try {
    const raw = localStorage.getItem(WAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WalEntry<unknown>[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWal(entries: WalEntry<unknown>[]): void {
  try {
    const trimmed = entries.slice(-MAX_WAL);
    writeLocalJsonAtomic(WAL_KEY, trimmed);
    localStorage.setItem(WAL_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function appendWalEntry<T>(entry: Omit<WalEntry<T>, "at"> & { at?: string }): void {
  const wal = loadWal();
  wal.push({
    ...entry,
    at: entry.at ?? new Date().toISOString(),
  } as WalEntry<unknown>);
  saveWal(wal);
}

/** دمج LWW — المفتاح id داخل payload. */
export function mergeLwwById<T extends { id: number | string }>(
  base: T[],
  incoming: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of base) map.set(String(item.id), item);
  for (const item of incoming) {
    const key = String(item.id);
    const prev = map.get(key);
    const prevAt = (prev as T & { at?: string })?.at;
    const nextAt = (item as T & { at?: string })?.at;
    if (!prev || !prevAt || !nextAt || nextAt >= prevAt) {
      map.set(key, item);
    }
  }
  return [...map.values()];
}

export async function runOptimisticWalPersist<T>(opts: {
  store: string;
  entryId: string;
  apply: () => T;
  persist: (snapshot: T) => Promise<void> | void;
  rollback?: (snapshot: T) => void;
  op?: "set" | "delete";
}): Promise<T> {
  const result = await runOptimisticAction({
    apply: opts.apply,
    persist: async (snapshot) => {
      appendWalEntry({
        id: opts.entryId,
        op: opts.op ?? "set",
        payload: snapshot,
        store: opts.store,
      });
      await opts.persist(snapshot);
    },
    rollback: opts.rollback,
  });
  return result.snapshot;
}

export function flushWalEntriesForStore(store: string): WalEntry<unknown>[] {
  const wal = loadWal();
  const kept = wal.filter((e) => e.store !== store);
  const flushed = wal.filter((e) => e.store === store);
  saveWal(kept);
  return flushed;
}

export function resetWalForTests(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(WAL_KEY);
}
