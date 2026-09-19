/**
 * Offline-first React Query provider:
 * - Persists cache via MMKV (or AsyncStorage fallback)
 * - Tracks online/offline for banner (`useOfflineStatus`)
 * - Flushes mutation queue when connectivity returns
 *
 * Wire once in app/_layout — do not rewrite screens.
 */
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform } from "react-native";

import {
  dequeueMutation,
  enqueueMutation,
  offlineQueryPersister,
  readMutationQueue,
  type OfflineMutationJob,
} from "@/lib/offline/persister";

type OfflineStatus = {
  isOffline: boolean;
  pendingMutations: number;
  enqueueOfflineMutation: (
    type: string,
    payload: Record<string, unknown>,
  ) => OfflineMutationJob;
  /** Register a flusher for a mutation type (Supabase write) */
  registerMutationHandler: (
    type: string,
    handler: (payload: Record<string, unknown>) => Promise<void>,
  ) => () => void;
};

const OfflineStatusContext = createContext<OfflineStatus | null>(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: 1,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

async function probeOnline(): Promise<boolean> {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    return navigator.onLine;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4_000);
    await fetch("https://www.ssunnah.com/healthz", {
      method: "HEAD",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return true;
  } catch {
    return false;
  }
}

const handlers = new Map<
  string,
  (payload: Record<string, unknown>) => Promise<void>
>();

async function flushMutationQueue(): Promise<void> {
  const jobs = readMutationQueue();
  for (const job of jobs) {
    const run = handlers.get(job.type);
    if (!run) continue;
    try {
      await run(job.payload);
      dequeueMutation(job.id);
    } catch {
      // keep job for next reconnect
      break;
    }
  }
}

export function OfflineQueryProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingMutations, setPendingMutations] = useState(
    () => readMutationQueue().length,
  );

  const refreshPending = useCallback(() => {
    setPendingMutations(readMutationQueue().length);
  }, []);

  const enqueueOfflineMutation = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      const job = enqueueMutation(type, payload);
      refreshPending();
      return job;
    },
    [refreshPending],
  );

  const registerMutationHandler = useCallback(
    (
      type: string,
      handler: (payload: Record<string, unknown>) => Promise<void>,
    ) => {
      handlers.set(type, handler);
      return () => {
        handlers.delete(type);
      };
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const apply = (online: boolean) => {
      if (cancelled) return;
      onlineManager.setOnline(online);
      setIsOffline(!online);
      if (online) {
        void flushMutationQueue().then(refreshPending);
      }
    };

    void probeOnline().then(apply);

    onlineManager.setEventListener((setOnline) => {
      const tick = () => {
        void probeOnline().then((ok) => {
          setOnline(ok);
          apply(ok);
        });
      };
      const interval = setInterval(tick, 12_000);
      const sub = AppState.addEventListener("change", (s) => {
        if (s === "active") tick();
      });
      return () => {
        clearInterval(interval);
        sub.remove();
      };
    });

    return () => {
      cancelled = true;
    };
  }, [refreshPending]);

  const value = useMemo<OfflineStatus>(
    () => ({
      isOffline,
      pendingMutations,
      enqueueOfflineMutation,
      registerMutationHandler,
    }),
    [
      isOffline,
      pendingMutations,
      enqueueOfflineMutation,
      registerMutationHandler,
    ],
  );

  return (
    <OfflineStatusContext.Provider value={value}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: offlineQueryPersister,
          maxAge: 1000 * 60 * 60 * 24 * 14,
          buster: "ssunnah-mobile-v1",
        }}
        onSuccess={() => {
          if (!isOffline) void flushMutationQueue().then(refreshPending);
        }}
      >
        {children}
      </PersistQueryClientProvider>
    </OfflineStatusContext.Provider>
  );
}

export function useOfflineStatus(): OfflineStatus {
  const ctx = useContext(OfflineStatusContext);
  if (!ctx) {
    throw new Error("useOfflineStatus must be used within OfflineQueryProvider");
  }
  return ctx;
}

export { queryClient };
