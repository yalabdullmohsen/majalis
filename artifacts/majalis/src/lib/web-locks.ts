/**
 * Master polish — Web Locks API for single-tab heavy work.
 * Ensures IDB migrations / worker indexing run in exactly one tab.
 * Falls back to BroadcastChannel soft lock when navigator.locks missing.
 * Logic-only — no UI.
 */

import { getCrossTabId } from "@/lib/cross-tab-sync";

export type WebLockResult<T> = {
  ran: boolean;
  value: T | null;
  mode: "web-locks" | "broadcast-fallback" | "skipped";
};

const FALLBACK_CHANNEL = "majalis-web-locks-v1";

function hasWebLocks(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.locks?.request === "function";
}

/**
 * Run `fn` exclusively under `name`. If another tab holds the lock, skip (default)
 * or wait when `ifAvailable` is false.
 */
export async function withWebLock<T>(
  name: string,
  fn: () => Promise<T> | T,
  opts?: { ifAvailable?: boolean; signal?: AbortSignal },
): Promise<WebLockResult<T>> {
  const ifAvailable = opts?.ifAvailable !== false;

  if (hasWebLocks()) {
    try {
      let value: T | null = null;
      let ran = false;
      await navigator.locks!.request(
        name,
        { ifAvailable, signal: opts?.signal, mode: "exclusive" },
        async (lock) => {
          if (!lock) return;
          ran = true;
          value = await fn();
        },
      );
      return { ran, value, mode: "web-locks" };
    } catch {
      /* fall through */
    }
  }

  // Soft BroadcastChannel fallback — best-effort single winner
  return withBroadcastFallbackLock(name, fn);
}

async function withBroadcastFallbackLock<T>(
  name: string,
  fn: () => Promise<T> | T,
): Promise<WebLockResult<T>> {
  if (typeof BroadcastChannel === "undefined") {
    const value = await fn();
    return { ran: true, value, mode: "broadcast-fallback" };
  }

  const id = `${getCrossTabId()}:${Math.random().toString(36).slice(2, 8)}`;
  const channel = new BroadcastChannel(FALLBACK_CHANNEL);
  let winner = true;

  try {
    channel.postMessage({ type: "claim", name, id, at: Date.now() });
    await new Promise((r) => setTimeout(r, 30));
    const stampKey = `majalis-lock-${name}`;
    try {
      const prev = sessionStorage.getItem(stampKey);
      if (prev && prev !== id) {
        const prevAt = Number(prev.split("|")[1] || 0);
        if (Date.now() - prevAt < 8_000) winner = false;
      }
      if (winner) sessionStorage.setItem(stampKey, `${id}|${Date.now()}`);
    } catch {
      /* ignore */
    }

    if (!winner) {
      return { ran: false, value: null, mode: "skipped" };
    }
    const value = await fn();
    return { ran: true, value, mode: "broadcast-fallback" };
  } finally {
    try {
      channel.close();
    } catch {
      /* ignore */
    }
  }
}
