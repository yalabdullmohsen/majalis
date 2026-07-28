import { useCallback, useEffect, useState } from "react";
import {
  detectNetworkBandwidthState,
  fetchTextOnlyContent,
  loadLowBandwidthPrefs,
  saveLowBandwidthPrefs,
  shouldSuppressNetworkErrorOverlay,
  subscribeBandwidthChanges,
  warmBandwidthState,
  type BandwidthMode,
  type LowBandwidthPrefs,
  type NetworkBandwidthState,
} from "@/lib/low-bandwidth-sync";

/** Adaptive low-bandwidth sync — logic only. */
export function useLowBandwidthSync(opts?: { autoSubscribe?: boolean }) {
  const [state, setState] = useState<NetworkBandwidthState>(() => detectNetworkBandwidthState());
  const [prefs, setPrefs] = useState<LowBandwidthPrefs>(() => loadLowBandwidthPrefs());

  useEffect(() => {
    void warmBandwidthState().then(setState);
  }, []);

  useEffect(() => {
    if (opts?.autoSubscribe === false) return;
    return subscribeBandwidthChanges(setState);
  }, [opts?.autoSubscribe]);

  const updatePrefs = useCallback((patch: Partial<LowBandwidthPrefs>) => {
    const next = saveLowBandwidthPrefs({ ...loadLowBandwidthPrefs(), ...patch });
    setPrefs(next);
    setState(detectNetworkBandwidthState(next));
    return next;
  }, []);

  const fetchAdaptive = useCallback(
    async <T,>(options: {
      fetchOnline: (signal: AbortSignal) => Promise<T>;
      readCache: () => Promise<T | null>;
      writeCache?: (value: T) => Promise<void>;
    }) => {
      return fetchTextOnlyContent<T>({ ...options, mode: state.mode });
    },
    [state.mode],
  );

  const suppressErrors = shouldSuppressNetworkErrorOverlay(state);
  const mode: BandwidthMode = state.mode;

  return { state, prefs, mode, suppressErrors, updatePrefs, fetchAdaptive, refresh: () => setState(detectNetworkBandwidthState()) };
}
