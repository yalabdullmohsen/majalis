/**
 * Sequential offline action queue — bookmarks, streak, progress.
 * Persists to localStorage + mirrors to Dexie meta; flushes on reconnect.
 */

import {
  OFFLINE_STORES,
  engineGetValue,
  enginePut,
  isOnline,
} from "@/lib/offline-engine";
import { sleepWithBackoff } from "@/utils/backoff";
import { broadcastIdbWrite } from "@/lib/cross-tab-sync";

const LS_KEY = "majalis-offline-action-queue-v1";
const IDB_KEY = "offline-action-queue-v1";
const MAX_QUEUE = 200;
const MAX_ATTEMPTS = 5;

export type OfflineActionType =
  | "bookmark_toggle"
  | "streak_record"
  | "progress_set"
  | "custom";

export type OfflineAction = {
  id: string;
  type: OfflineActionType;
  payload: unknown;
  createdAt: number;
  attempts: number;
};

export type OfflineActionHandler = (action: OfflineAction) => Promise<void> | void;

const handlers = new Map<OfflineActionType, OfflineActionHandler>();
let flushing: Promise<number> | null = null;
let listenersBound = false;

function readLocal(): OfflineAction[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    return Array.isArray(raw) ? (raw as OfflineAction[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(queue: OfflineAction[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(queue.slice(0, MAX_QUEUE)));
  } catch {
    /* quota — drop oldest half */
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(queue.slice(0, Math.floor(MAX_QUEUE / 2))));
    } catch {
      /* ignore */
    }
  }
}

async function mirrorIdb(queue: OfflineAction[]): Promise<void> {
  try {
    await enginePut(OFFLINE_STORES.meta, IDB_KEY, queue);
    broadcastIdbWrite(OFFLINE_STORES.meta, IDB_KEY);
  } catch {
    /* ignore */
  }
}

async function hydrateFromIdb(): Promise<OfflineAction[]> {
  try {
    const fromIdb = await engineGetValue<OfflineAction[]>(OFFLINE_STORES.meta, IDB_KEY);
    if (Array.isArray(fromIdb) && fromIdb.length) {
      const local = readLocal();
      const byId = new Map<string, OfflineAction>();
      for (const a of [...fromIdb, ...local]) byId.set(a.id, a);
      const merged = [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
      writeLocal(merged);
      return merged;
    }
  } catch {
    /* ignore */
  }
  return readLocal();
}

/** Register a handler for a queue action type (idempotent overwrite). */
export function registerOfflineActionHandler(
  type: OfflineActionType,
  handler: OfflineActionHandler,
): void {
  handlers.set(type, handler);
}

/** Enqueue an action; if online, schedule immediate flush. */
export function enqueueOfflineAction(
  type: OfflineActionType,
  payload: unknown,
): OfflineAction {
  const action: OfflineAction = {
    id: `oa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  };
  const next = [...readLocal(), action].slice(-MAX_QUEUE);
  writeLocal(next);
  void mirrorIdb(next);
  if (isOnline()) void flushOfflineActionQueue();
  return action;
}

export function peekOfflineActionQueue(): OfflineAction[] {
  return readLocal();
}

/** Flush sequentially with exponential backoff between failures. */
export async function flushOfflineActionQueue(): Promise<number> {
  if (flushing) return flushing;
  if (!isOnline()) return 0;

  flushing = (async () => {
    let queue = await hydrateFromIdb();
    let processed = 0;

    while (queue.length > 0 && isOnline()) {
      const [head, ...rest] = queue;
      const handler = handlers.get(head.type);
      if (!handler) {
        // No handler — drop to avoid infinite stall
        queue = rest;
        writeLocal(queue);
        continue;
      }
      try {
        await handler(head);
        queue = rest;
        writeLocal(queue);
        processed += 1;
      } catch {
        const attempts = head.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          queue = rest;
          writeLocal(queue);
        } else {
          queue = [{ ...head, attempts }, ...rest];
          writeLocal(queue);
          await sleepWithBackoff({ attempt: attempts, baseMs: 300, maxMs: 10_000 }).catch(() => {});
          break; // resume later
        }
      }
    }

    await mirrorIdb(queue);
    return processed;
  })().finally(() => {
    flushing = null;
  });

  return flushing;
}

/** Bind online / visibility listeners once (called from offline sync bootstrap). */
export function startOfflineActionQueue(): void {
  if (typeof window === "undefined" || listenersBound) return;
  listenersBound = true;
  window.addEventListener("online", () => {
    void flushOfflineActionQueue();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isOnline()) {
      void flushOfflineActionQueue();
    }
  });
  // Soft kick after idle
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => {
      void flushOfflineActionQueue();
    });
  } else {
    globalThis.setTimeout(() => {
      void flushOfflineActionQueue();
    }, 3_000);
  }
}
