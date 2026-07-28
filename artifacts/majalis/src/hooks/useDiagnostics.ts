/**
 * React hook facade for the diagnostics ring buffer.
 * Logic-only — does not render UI.
 */
import { useCallback, useRef } from "react";
import {
  clearDiagnostics,
  getDiagnosticCounters,
  getRecentDiagnostics,
  logDiagnostic,
  type DiagnosticKind,
  type DiagnosticEvent,
} from "@/lib/diagnostics";

export function useDiagnostics() {
  const apiRef = useRef({
    log: logDiagnostic,
    counters: getDiagnosticCounters,
    recent: getRecentDiagnostics,
    clear: clearDiagnostics,
  });

  const log = useCallback((kind: DiagnosticKind, message: string, meta?: Record<string, unknown>) => {
    logDiagnostic(kind, message, meta);
  }, []);

  const snapshot = useCallback((): {
    counters: Record<string, number>;
    recent: DiagnosticEvent[];
  } => {
    return {
      counters: getDiagnosticCounters(),
      recent: getRecentDiagnostics(32),
    };
  }, []);

  return {
    log,
    snapshot,
    clear: clearDiagnostics,
    api: apiRef.current,
  };
}
