import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchActivationSnapshot,
  INITIAL_ACTIVATION,
  type ActivationSnapshot,
} from "./activation-state";

interface ActivationContextValue extends ActivationSnapshot {
  refresh: () => Promise<void>;
}

const ActivationContext = createContext<ActivationContextValue | null>(null);

export function ActivationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActivationSnapshot>(INITIAL_ACTIVATION);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const next = await fetchActivationSnapshot();
    setState(next);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...state,
      refresh,
    }),
    [state, refresh],
  );

  return <ActivationContext.Provider value={value}>{children}</ActivationContext.Provider>;
}

export function useActivationState(): ActivationContextValue {
  const ctx = useContext(ActivationContext);
  if (!ctx) {
    throw new Error("useActivationState must be used within ActivationProvider");
  }
  return ctx;
}
