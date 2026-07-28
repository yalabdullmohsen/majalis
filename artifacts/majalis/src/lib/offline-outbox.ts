/**
 * Offline mutation outbox with cryptographic UUID idempotency keys.
 * Retries / duplicate packets never double-apply on server or IDB.
 * Logic-only — no UI.
 */

import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";

export type OutboxOpType =
  | "bookmark_upsert"
  | "bookmark_delete"
  | "flashcard_review"
  | "khatmah_log"
  | "custom";

export type OutboxEntry = {
  /** Cryptographic idempotency key — stable across retries */
  idempotencyKey: string;
  type: OutboxOpType;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastAttemptAt: number | null;
  status: "pending" | "inflight" | "done" | "failed";
};

const LS_KEY = "majalis-offline-outbox-v1";
const MAX_ENTRIES = 500;
const appliedKeys = new Set<string>();

function isEntry(v: unknown): v is OutboxEntry {
  return (
    isPlainObject(v) &&
    typeof v.idempotencyKey === "string" &&
    typeof v.type === "string" &&
    isPlainObject(v.payload) &&
    typeof v.createdAt === "number"
  );
}

function isEntryList(v: unknown): v is OutboxEntry[] {
  return Array.isArray(v) && v.every(isEntry);
}

/** UUID v4 — prefer crypto.randomUUID. */
export function createIdempotencyKey(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  // RFC4122-ish fallback
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = (Math.random() * 256) | 0;
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readQueue(): OutboxEntry[] {
  return readLocalJson<OutboxEntry[]>(LS_KEY, [], isEntryList);
}

function writeQueue(entries: OutboxEntry[]): void {
  writeLocalJson(LS_KEY, entries.slice(-MAX_ENTRIES));
}

/** Enqueue a mutation with a fresh idempotency key (or caller-supplied). */
export function enqueueOutbox(
  type: OutboxOpType,
  payload: Record<string, unknown>,
  opts?: { idempotencyKey?: string },
): OutboxEntry {
  const entry: OutboxEntry = {
    idempotencyKey: opts?.idempotencyKey ?? createIdempotencyKey(),
    type,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    lastAttemptAt: null,
    status: "pending",
  };
  const q = readQueue().filter((e) => e.status !== "done");
  // Dedup by idempotency key
  if (q.some((e) => e.idempotencyKey === entry.idempotencyKey)) {
    return entry;
  }
  q.push(entry);
  writeQueue(q);
  return entry;
}

export function listPendingOutbox(): OutboxEntry[] {
  return readQueue().filter((e) => e.status === "pending" || e.status === "failed");
}

/**
 * Mark key as applied (in-memory + queue). Returns false if already applied —
 * callers must skip duplicate side effects.
 */
export function claimIdempotencyKey(key: string): boolean {
  if (appliedKeys.has(key)) return false;
  appliedKeys.add(key);
  const q = readQueue();
  const idx = q.findIndex((e) => e.idempotencyKey === key);
  if (idx >= 0) {
    if (q[idx]!.status === "done") return false;
    q[idx] = {
      ...q[idx]!,
      status: "inflight",
      attempts: q[idx]!.attempts + 1,
      lastAttemptAt: Date.now(),
    };
    writeQueue(q);
  }
  return true;
}

export function completeOutboxEntry(key: string, ok: boolean): void {
  const q = readQueue();
  const idx = q.findIndex((e) => e.idempotencyKey === key);
  if (idx < 0) return;
  q[idx] = {
    ...q[idx]!,
    status: ok ? "done" : "failed",
    lastAttemptAt: Date.now(),
  };
  writeQueue(q);
  if (ok) appliedKeys.add(key);
}

/**
 * Drain pending entries with an applicator. Skips keys already claimed.
 */
export async function flushOutbox(
  apply: (entry: OutboxEntry) => Promise<boolean>,
): Promise<{ flushed: number; skipped: number; failed: number }> {
  const pending = listPendingOutbox();
  let flushed = 0;
  let skipped = 0;
  let failed = 0;
  for (const entry of pending) {
    if (!claimIdempotencyKey(entry.idempotencyKey)) {
      skipped += 1;
      continue;
    }
    try {
      const ok = await apply(entry);
      completeOutboxEntry(entry.idempotencyKey, ok);
      if (ok) flushed += 1;
      else failed += 1;
    } catch {
      completeOutboxEntry(entry.idempotencyKey, false);
      failed += 1;
    }
  }
  // Prune done entries older than keep window
  const q = readQueue().filter((e) => e.status !== "done" || Date.now() - e.createdAt < 86_400_000);
  writeQueue(q);
  return { flushed, skipped, failed };
}

export function resetOutboxForTests(): void {
  appliedKeys.clear();
  writeLocalJson(LS_KEY, []);
}
