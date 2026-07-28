/**
 * Network status store — single source of truth with atomic selectors.
 * useSyncExternalStore prevents cascade re-renders from unrelated updates.
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { isOnline } from "@/lib/offline-db";
import { addSafeWindowListener } from "@/lib/safe-listeners";
import { flushMutationQueue, ensureQueueBinding } from "@/lib/offline-mutation-queue";

export type NetworkStatus = {
  online: boolean;
  since: number;
  /** Monotonic reconnect generation — bumps on each online transition */
  reconnectGen: number;
};

let status: NetworkStatus = {
  online: typeof navigator === "undefined" ? true : navigator.onLine !== false,
  since: Date.now(),
  reconnectGen: 0,
};

const listeners = new Set<() => void>();
let bound = false;

function emit(): void {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

function setOnline(next: boolean): void {
  if (status.online === next) return;
  status = {
    online: next,
    since: Date.now(),
    reconnectGen: next ? status.reconnectGen + 1 : status.reconnectGen,
  };
  emit();
  if (next) {
    ensureQueueBinding();
    void flushMutationQueue();
  }
}

function ensureBound(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;
  addSafeWindowListener("online", () => setOnline(true));
  addSafeWindowListener("offline", () => setOnline(false));
  status = { ...status, online: isOnline(), since: Date.now() };
}

function subscribe(cb: () => void): () => void {
  ensureBound();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): NetworkStatus {
  return status;
}

function getServerSnapshot(): NetworkStatus {
  return { online: true, since: 0, reconnectGen: 0 };
}

/** Full status object — re-renders on any network field change. */
export function useNetworkStatus(): NetworkStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Atomic: boolean online only. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => status.online,
    () => true,
  );
}

/** Atomic: reconnect generation (for effects that should re-run on reconnect). */
export function useReconnectGeneration(): number {
  return useSyncExternalStore(
    subscribe,
    () => status.reconnectGen,
    () => 0,
  );
}

/** Imperative read (no subscription). */
export function getNetworkStatus(): NetworkStatus {
  ensureBound();
  return status;
}

/** Run callback on each online transition (reconnect). */
export function useOnReconnect(effect: () => void): void {
  const gen = useReconnectGeneration();
  const effectRef = useRef(effect);
  effectRef.current = effect;
  const prev = useRef(gen);
  useEffect(() => {
    if (gen === 0 || gen === prev.current) {
      prev.current = gen;
      return;
    }
    prev.current = gen;
    effectRef.current();
  }, [gen]);
}

export function useFlushQueueOnReconnect(): void {
  useOnReconnect(() => {
    void flushMutationQueue();
  });
}
