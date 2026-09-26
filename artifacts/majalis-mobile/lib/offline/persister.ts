/**
 * High-performance persistence for React Query offline cache.
 * Prefers react-native-mmkv (sync); falls back to AsyncStorage if native module unavailable (web/Expo Go).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Persister } from "@tanstack/react-query-persist-client";
import { Platform } from "react-native";

export type OfflineKv = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  backend: "mmkv" | "async-storage";
};

const MEMORY = new Map<string, string>();
const ASYNC_PREFIX = "ssunnah.offline.kv.";

function createAsyncFallbackKv(): OfflineKv {
  // Hydrate memory map lazily (best-effort)
  void AsyncStorage.getAllKeys().then(async (keys) => {
    const ours = keys.filter((k) => k.startsWith(ASYNC_PREFIX));
    if (!ours.length) return;
    const pairs = await AsyncStorage.multiGet(ours);
    for (const [k, v] of pairs) {
      if (v != null) MEMORY.set(k.slice(ASYNC_PREFIX.length), v);
    }
  });

  return {
    backend: "async-storage",
    getString: (key) => MEMORY.get(key),
    set: (key, value) => {
      MEMORY.set(key, value);
      void AsyncStorage.setItem(ASYNC_PREFIX + key, value);
    },
    delete: (key) => {
      MEMORY.delete(key);
      void AsyncStorage.removeItem(ASYNC_PREFIX + key);
    },
  };
}

function createMmkvKv(): OfflineKv | null {
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
    const mmkv = new MMKV({ id: "ssunnah-offline" });
    return {
      backend: "mmkv",
      getString: (key) => mmkv.getString(key),
      set: (key, value) => mmkv.set(key, value),
      delete: (key) => mmkv.delete(key),
    };
  } catch {
    return null;
  }
}

export const offlineKv: OfflineKv = createMmkvKv() ?? createAsyncFallbackKv();

/** AsyncStorage-shaped bridge so TanStack async persister can talk to MMKV/fallback */
const queryCacheStorage = {
  getItem: async (key: string) => offlineKv.getString(key) ?? null,
  setItem: async (key: string, value: string) => {
    offlineKv.set(key, value);
  },
  removeItem: async (key: string) => {
    offlineKv.delete(key);
  },
};

export const offlineQueryPersister: Persister = createAsyncStoragePersister({
  storage: queryCacheStorage,
  key: "ssunnah.react-query.cache",
  throttleTime: 1_000,
});

/** Mutation queue persistence (offline actions → Supabase on reconnect) */
const QUEUE_KEY = "ssunnah.offline.mutation-queue";

export type OfflineMutationJob = {
  id: string;
  createdAt: number;
  /** Logical action name, e.g. registerLesson / savePreference */
  type: string;
  payload: Record<string, unknown>;
};

export function readMutationQueue(): OfflineMutationJob[] {
  try {
    const raw = offlineKv.getString(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineMutationJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMutationQueue(jobs: OfflineMutationJob[]): void {
  offlineKv.set(QUEUE_KEY, JSON.stringify(jobs));
}

export function enqueueMutation(
  type: string,
  payload: Record<string, unknown>,
): OfflineMutationJob {
  const job: OfflineMutationJob = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    type,
    payload,
  };
  const next = [...readMutationQueue(), job];
  writeMutationQueue(next);
  return job;
}

export function dequeueMutation(id: string): void {
  writeMutationQueue(readMutationQueue().filter((j) => j.id !== id));
}
