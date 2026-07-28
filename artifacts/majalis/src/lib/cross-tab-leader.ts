/**
 * Cross-tab mutex & leader election via Web Locks API + BroadcastChannel fallback.
 * Ensures heavy background work (SW update checks, audio downloads/prefetch)
 * runs in only one active tab. Logic-only — no UI.
 */

import { getCrossTabId, publishCrossTabEvent, subscribeCrossTab } from "@/lib/cross-tab-sync";

export type LeaderLockName =
  | "majalis:sw-update"
  | "majalis:audio-download"
  | "majalis:audio-prefetch"
  | "majalis:idb-migrate"
  | "majalis:heavy-bg";

type LeaderState = {
  tabId: string;
  lock: LeaderLockName;
  ts: number;
};

const LEADER_CHANNEL_TYPE = "custom" as const;
const leaders = new Map<LeaderLockName, string>();
const heldAbort = new Map<LeaderLockName, AbortController>();

function locksSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.locks?.request;
}

/**
 * Run `fn` exclusively across tabs for `name`.
 * Prefer navigator.locks; fall back to BroadcastChannel soft-leader.
 */
export async function withTabLock<T>(
  name: LeaderLockName,
  fn: () => Promise<T> | T,
  opts?: { mode?: "exclusive" | "shared"; signal?: AbortSignal; ifAvailable?: boolean },
): Promise<T | undefined> {
  const mode = opts?.mode ?? "exclusive";
  if (locksSupported()) {
    try {
      return await navigator.locks!.request(
        name,
        {
          mode,
          signal: opts?.signal,
          ifAvailable: opts?.ifAvailable,
        },
        async (lock) => {
          if (!lock && opts?.ifAvailable) return undefined;
          return await fn();
        },
      );
    } catch (err) {
      if (opts?.signal?.aborted) return undefined;
      // Fall through to soft leader
      void err;
    }
  }
  return withSoftLeader(name, fn, opts?.ifAvailable === true);
}

/**
 * Soft leader via BroadcastChannel: first claimant wins for ~TTL ms.
 * Best-effort only — not as strong as Web Locks.
 */
async function withSoftLeader<T>(
  name: LeaderLockName,
  fn: () => Promise<T> | T,
  ifAvailable: boolean,
): Promise<T | undefined> {
  const me = getCrossTabId();
  const existing = leaders.get(name);
  if (existing && existing !== me) {
    if (ifAvailable) return undefined;
    // Wait briefly then retry once
    await new Promise((r) => setTimeout(r, 50));
    if (leaders.get(name) && leaders.get(name) !== me) return undefined;
  }
  leaders.set(name, me);
  publishCrossTabEvent(LEADER_CHANNEL_TYPE, {
    kind: "leader-claim",
    lock: name,
    tabId: me,
  } satisfies LeaderState & { kind: string });
  try {
    return await fn();
  } finally {
    if (leaders.get(name) === me) leaders.delete(name);
    publishCrossTabEvent(LEADER_CHANNEL_TYPE, {
      kind: "leader-release",
      lock: name,
      tabId: me,
    });
  }
}

/** Subscribe once to soft-leader claims (idempotent). */
let softLeaderBound = false;
export function ensureSoftLeaderListener(): void {
  if (softLeaderBound || typeof window === "undefined") return;
  softLeaderBound = true;
  subscribeCrossTab((msg) => {
    const p = msg.payload as { kind?: string; lock?: LeaderLockName; tabId?: string } | null;
    if (!p?.kind || !p.lock || !p.tabId) return;
    if (p.kind === "leader-claim") leaders.set(p.lock, p.tabId);
    if (p.kind === "leader-release" && leaders.get(p.lock) === p.tabId) leaders.delete(p.lock);
  });
}

/**
 * Elect a sticky leader for a long-lived background loop.
 * Returns a release function. Only the leader should run the loop body.
 */
export function electStickyLeader(
  name: LeaderLockName,
  onBecameLeader: () => void,
  onLostLeadership?: () => void,
): () => void {
  ensureSoftLeaderListener();
  let released = false;
  let abort: AbortController | null = null;

  const tryAcquire = () => {
    if (released) return;
    if (locksSupported()) {
      abort?.abort();
      abort = new AbortController();
      heldAbort.set(name, abort);
      void navigator.locks!
        .request(name, { mode: "exclusive", signal: abort.signal }, async () => {
          if (released) return;
          leaders.set(name, getCrossTabId());
          onBecameLeader();
          // Hold until aborted / tab unload
          await new Promise<void>((resolve) => {
            abort!.signal.addEventListener("abort", () => resolve(), { once: true });
          });
          onLostLeadership?.();
          if (leaders.get(name) === getCrossTabId()) leaders.delete(name);
        })
        .catch(() => {
          /* lock aborted or unavailable */
        });
      return;
    }
    // Soft: claim if free
    if (!leaders.has(name) || leaders.get(name) === getCrossTabId()) {
      leaders.set(name, getCrossTabId());
      publishCrossTabEvent(LEADER_CHANNEL_TYPE, {
        kind: "leader-claim",
        lock: name,
        tabId: getCrossTabId(),
      });
      onBecameLeader();
    }
  };

  tryAcquire();

  const onVis = () => {
    if (document.visibilityState === "visible" && !released) tryAcquire();
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVis);
  }

  return () => {
    released = true;
    abort?.abort();
    heldAbort.delete(name);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVis);
    }
    if (leaders.get(name) === getCrossTabId()) {
      leaders.delete(name);
      publishCrossTabEvent(LEADER_CHANNEL_TYPE, {
        kind: "leader-release",
        lock: name,
        tabId: getCrossTabId(),
      });
      onLostLeadership?.();
    }
  };
}

export function isCurrentTabLeader(name: LeaderLockName): boolean {
  return leaders.get(name) === getCrossTabId();
}

/** Test helpers */
export function resetCrossTabLeaderForTests(): void {
  leaders.clear();
  for (const a of heldAbort.values()) a.abort();
  heldAbort.clear();
  softLeaderBound = false;
}
