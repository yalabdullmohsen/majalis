/**
 * Low-bandwidth adaptive sync (Module 5).
 */

import { isOnline, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import {
  getCachedAdhkarPack,
  getCachedQuranSurah,
  getCachedQuranSurahList,
} from "@/lib/offline-content-store";

export type NetworkEffectiveType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";
export type BandwidthMode = "full" | "text_only" | "offline";

export type NetworkBandwidthState = {
  online: boolean;
  effectiveType: NetworkEffectiveType;
  downlinkMbps: number | null;
  saveData: boolean;
  mode: BandwidthMode;
  fetchTimeoutMs: number;
  suppressErrorOverlays: boolean;
  updatedAt: string;
};

type Conn = {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
  addEventListener?: (t: string, l: () => void) => void;
  removeEventListener?: (t: string, l: () => void) => void;
};

const LS_STATE = "majalis-low-bandwidth-state-v1";

function getConnection(): Conn | null {
  try {
    if (typeof navigator === "undefined") return null;
    const nav = navigator as Navigator & { connection?: Conn; mozConnection?: Conn; webkitConnection?: Conn };
    return nav.connection || nav.mozConnection || nav.webkitConnection || null;
  } catch {
    return null;
  }
}

export function readEffectiveType(conn?: Conn | null): NetworkEffectiveType {
  const t = (conn ?? getConnection())?.effectiveType;
  if (t === "slow-2g" || t === "2g" || t === "3g" || t === "4g") return t;
  return "unknown";
}

export function resolveBandwidthMode(opts?: {
  online?: boolean;
  effectiveType?: NetworkEffectiveType;
  saveData?: boolean;
  downlinkMbps?: number | null;
}): BandwidthMode {
  const online = opts?.online ?? isOnline();
  if (!online) return "offline";
  const et = opts?.effectiveType ?? readEffectiveType();
  const saveData = opts?.saveData ?? Boolean(getConnection()?.saveData);
  const downlink = opts?.downlinkMbps ?? getConnection()?.downlink ?? null;
  if (saveData || et === "slow-2g" || et === "2g" || et === "3g") return "text_only";
  if (downlink != null && downlink > 0 && downlink < 1.2) return "text_only";
  return "full";
}

export function fetchTimeoutForMode(mode: BandwidthMode): number {
  if (mode === "offline") return 0;
  if (mode === "text_only") return 4_000;
  return 12_000;
}

export function detectNetworkBandwidthState(): NetworkBandwidthState {
  const conn = getConnection();
  const online = isOnline();
  const effectiveType = readEffectiveType(conn);
  const downlinkMbps = conn?.downlink ?? null;
  const saveData = Boolean(conn?.saveData);
  const mode = resolveBandwidthMode({ online, effectiveType, saveData, downlinkMbps });
  const state: NetworkBandwidthState = {
    online,
    effectiveType,
    downlinkMbps,
    saveData,
    mode,
    fetchTimeoutMs: fetchTimeoutForMode(mode),
    suppressErrorOverlays: mode !== "full",
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LS_STATE, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, "low-bandwidth-state-v1", state).catch(() => undefined);
  return state;
}

export async function fetchTextOnlyContent<T>(options: {
  fetchOnline: (signal: AbortSignal) => Promise<T>;
  readCache: () => Promise<T | null>;
  writeCache?: (value: T) => Promise<void>;
  mode?: BandwidthMode;
}): Promise<{ data: T | null; fromCache: boolean; mode: BandwidthMode }> {
  const mode = options.mode ?? detectNetworkBandwidthState().mode;
  if (mode === "text_only" || mode === "offline") {
    try {
      const cached = await options.readCache();
      if (cached != null) return { data: cached, fromCache: true, mode };
    } catch {
      /* continue */
    }
  }
  if (mode === "offline") return { data: null, fromCache: true, mode };

  const timeoutMs = fetchTimeoutForMode(mode);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const data = await options.fetchOnline(ctrl.signal);
    if (options.writeCache) {
      try {
        await options.writeCache(data);
      } catch {
        /* ignore */
      }
    }
    return { data, fromCache: false, mode };
  } catch {
    try {
      const cached = await options.readCache();
      return { data: cached, fromCache: true, mode };
    } catch {
      return { data: null, fromCache: true, mode };
    }
  } finally {
    clearTimeout(timer);
  }
}

export function shouldSuppressNetworkErrorOverlay(state?: NetworkBandwidthState): boolean {
  return (state ?? detectNetworkBandwidthState()).suppressErrorOverlays;
}

export function subscribeBandwidthChanges(listener: (s: NetworkBandwidthState) => void): () => void {
  const emit = () => listener(detectNetworkBandwidthState());
  const conn = getConnection();
  if (typeof window !== "undefined") {
    window.addEventListener("online", emit);
    window.addEventListener("offline", emit);
  }
  conn?.addEventListener?.("change", emit);
  emit();
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", emit);
      window.removeEventListener("offline", emit);
    }
    conn?.removeEventListener?.("change", emit);
  };
}

export async function fetchSurahAdaptive(
  surahNumber: number,
  fetchOnline: (signal: AbortSignal) => Promise<unknown>,
) {
  return fetchTextOnlyContent({
    fetchOnline,
    readCache: () => getCachedQuranSurah(surahNumber),
  });
}

export { getCachedQuranSurahList, getCachedAdhkarPack };
