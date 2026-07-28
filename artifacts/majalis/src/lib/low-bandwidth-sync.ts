/**
 * Adaptive Low-Bandwidth Sync & Network Fallback.
 * Listens to navigator.connection; on 2G/3G (or save-data) switches to
 * text-only IndexedDB mode, shortens fetch timeouts, suppresses error overlays.
 */

import { isOnline, idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import {
  getCachedAdhkarPack,
  getCachedQuranSurah,
  getCachedQuranSurahList,
  withOfflineFallback,
} from "@/lib/offline-content-store";

export type NetworkEffectiveType = "slow-2g" | "2g" | "3g" | "4g" | "unknown";

export type BandwidthMode = "full" | "text_only" | "offline";

export type NetworkBandwidthState = {
  online: boolean;
  effectiveType: NetworkEffectiveType;
  downlinkMbps: number | null;
  rttMs: number | null;
  saveData: boolean;
  mode: BandwidthMode;
  /** Suggested fetch timeout (ms) */
  fetchTimeoutMs: number;
  /** Suppress network error overlays when true */
  suppressErrorOverlays: boolean;
  updatedAt: string;
};

export type LowBandwidthPrefs = {
  enabled: boolean;
  /** Force text-only even on fast networks */
  forceTextOnly: boolean;
};

type NetworkInformationLike = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

const LS_KEY = "majalis-low-bandwidth-prefs-v1";
const LS_STATE = "majalis-low-bandwidth-state-v1";
const IDB_STATE = "low-bandwidth-state-v1";

const DEFAULT_PREFS: LowBandwidthPrefs = {
  enabled: true,
  forceTextOnly: false,
};

export function loadLowBandwidthPrefs(): LowBandwidthPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<LowBandwidthPrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveLowBandwidthPrefs(prefs: LowBandwidthPrefs): LowBandwidthPrefs {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  return prefs;
}

function getConnection(): NetworkInformationLike | null {
  try {
    if (typeof navigator === "undefined") return null;
    const nav = navigator as Navigator & { connection?: NetworkInformationLike; mozConnection?: NetworkInformationLike; webkitConnection?: NetworkInformationLike };
    return nav.connection || nav.mozConnection || nav.webkitConnection || null;
  } catch {
    return null;
  }
}

export function readEffectiveType(conn?: NetworkInformationLike | null): NetworkEffectiveType {
  const t = (conn ?? getConnection())?.effectiveType;
  if (t === "slow-2g" || t === "2g" || t === "3g" || t === "4g") return t;
  return "unknown";
}

export function resolveBandwidthMode(
  opts?: {
    online?: boolean;
    effectiveType?: NetworkEffectiveType;
    saveData?: boolean;
    downlinkMbps?: number | null;
    prefs?: LowBandwidthPrefs;
  },
): BandwidthMode {
  const prefs = opts?.prefs ?? loadLowBandwidthPrefs();
  const online = opts?.online ?? isOnline();
  if (!online) return "offline";
  if (prefs.forceTextOnly) return "text_only";
  if (!prefs.enabled) return "full";
  const et = opts?.effectiveType ?? readEffectiveType();
  const saveData = opts?.saveData ?? Boolean(getConnection()?.saveData);
  const downlink = opts?.downlinkMbps ?? getConnection()?.downlink ?? null;
  if (saveData) return "text_only";
  if (et === "slow-2g" || et === "2g") return "text_only";
  if (et === "3g") return "text_only";
  if (downlink != null && downlink > 0 && downlink < 1.2) return "text_only";
  return "full";
}

export function fetchTimeoutForMode(mode: BandwidthMode): number {
  switch (mode) {
    case "offline":
      return 0;
    case "text_only":
      return 4_000;
    default:
      return 12_000;
  }
}

export function detectNetworkBandwidthState(
  prefs: LowBandwidthPrefs = loadLowBandwidthPrefs(),
): NetworkBandwidthState {
  const conn = getConnection();
  const online = isOnline();
  const effectiveType = readEffectiveType(conn);
  const downlinkMbps = conn?.downlink ?? null;
  const rttMs = conn?.rtt ?? null;
  const saveData = Boolean(conn?.saveData);
  const mode = resolveBandwidthMode({
    online,
    effectiveType,
    saveData,
    downlinkMbps,
    prefs,
  });
  const state: NetworkBandwidthState = {
    online,
    effectiveType,
    downlinkMbps,
    rttMs,
    saveData,
    mode,
    fetchTimeoutMs: fetchTimeoutForMode(mode),
    suppressErrorOverlays: mode === "text_only" || mode === "offline",
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LS_STATE, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_STATE, state).catch(() => undefined);
  return state;
}

export function loadCachedBandwidthState(): NetworkBandwidthState | null {
  try {
    const raw = localStorage.getItem(LS_STATE);
    return raw ? (JSON.parse(raw) as NetworkBandwidthState) : null;
  } catch {
    return null;
  }
}

/** Abortable fetch with adaptive timeout — never throws; returns null on failure. */
export async function fetchWithBandwidthBudget<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  opts?: { mode?: BandwidthMode; timeoutMs?: number },
): Promise<{ data: T | null; timedOut: boolean; aborted: boolean }> {
  const mode = opts?.mode ?? detectNetworkBandwidthState().mode;
  const timeoutMs = opts?.timeoutMs ?? fetchTimeoutForMode(mode);
  if (mode === "offline" || timeoutMs <= 0) {
    return { data: null, timedOut: false, aborted: false };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const data = await fetcher(ctrl.signal);
    return { data, timedOut: false, aborted: false };
  } catch (err) {
    const aborted = ctrl.signal.aborted;
    return { data: null, timedOut: aborted, aborted };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Text-only content fetch: prefer IndexedDB, optionally try short network.
 * Designed to eliminate timeout/error overlays on slow links.
 */
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

  if (mode === "offline") {
    return { data: null, fromCache: true, mode };
  }

  const { data, timedOut } = await fetchWithBandwidthBudget(options.fetchOnline, { mode });
  if (data != null) {
    if (options.writeCache) {
      try {
        await options.writeCache(data);
      } catch {
        /* ignore */
      }
    }
    return { data, fromCache: false, mode };
  }

  // Fallback to cache — never surface network error
  try {
    const cached = await options.readCache();
    return { data: cached, fromCache: true, mode: timedOut ? mode : mode };
  } catch {
    return { data: null, fromCache: true, mode };
  }
}

/** Convenience: Quran surah with bandwidth awareness. */
export async function fetchSurahAdaptive(
  surahNumber: number,
  fetchOnline: (signal: AbortSignal) => Promise<unknown>,
): Promise<{ data: unknown | null; fromCache: boolean; mode: BandwidthMode }> {
  return fetchTextOnlyContent({
    fetchOnline,
    readCache: () => getCachedQuranSurah(surahNumber),
  });
}

export async function fetchSurahListAdaptive(
  fetchOnline: (signal: AbortSignal) => Promise<unknown>,
): Promise<{ data: unknown | null; fromCache: boolean; mode: BandwidthMode }> {
  return fetchTextOnlyContent({
    fetchOnline,
    readCache: () => getCachedQuranSurahList(),
  });
}

export async function fetchAdhkarAdaptive(
  fetchOnline: (signal: AbortSignal) => Promise<unknown>,
): Promise<{ data: unknown | null; fromCache: boolean; mode: BandwidthMode }> {
  return fetchTextOnlyContent({
    fetchOnline,
    readCache: () => getCachedAdhkarPack(),
  });
}

/**
 * Should UI suppress network error overlays?
 * Pure helper for callers — does not render UI.
 */
export function shouldSuppressNetworkErrorOverlay(
  state?: NetworkBandwidthState | null,
): boolean {
  const s = state ?? loadCachedBandwidthState() ?? detectNetworkBandwidthState();
  return s.suppressErrorOverlays;
}

/** Subscribe to connection + online changes. Returns unsubscribe. */
export function subscribeBandwidthChanges(
  listener: (state: NetworkBandwidthState) => void,
): () => void {
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

/** Soft warm from IDB state. */
export async function warmBandwidthState(): Promise<NetworkBandwidthState> {
  try {
    const fromIdb = await idbGetValue<NetworkBandwidthState>(OFFLINE_STORES.meta, IDB_STATE);
    if (fromIdb) {
      try {
        localStorage.setItem(LS_STATE, JSON.stringify(fromIdb));
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  return detectNetworkBandwidthState();
}

/** Re-export for callers that already use withOfflineFallback. */
export { withOfflineFallback };
