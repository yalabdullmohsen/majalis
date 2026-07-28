/**
 * Search-index Web Worker — off-main-thread Arabic filter/includes over candidate lists.
 * Supervised via worker-supervisor (auto-restart on crash).
 */

/// <reference lib="webworker" />

import { normalizeArabic, normalizedIncludes } from "../shared/arabic-normalize";

self.onmessage = (ev: MessageEvent) => {
  const msg = ev.data as { id: number; type: string; payload: unknown } | null;
  if (!msg || typeof msg.id !== "number") return;
  try {
    let result: unknown;
    switch (msg.type) {
      case "normalize":
        result = normalizeArabic(String(msg.payload ?? ""));
        break;
      case "filterIncludes": {
        const p = msg.payload as { haystacks?: string[]; needle?: string };
        const needle = String(p?.needle ?? "");
        const haystacks = Array.isArray(p?.haystacks) ? p.haystacks : [];
        result = haystacks
          .map((h, i) => (normalizedIncludes(String(h ?? ""), needle) ? i : -1))
          .filter((i) => i >= 0);
        break;
      }
      default:
        throw new Error(`unknown task: ${msg.type}`);
    }
    (self as DedicatedWorkerGlobalScope).postMessage({ id: msg.id, ok: true, result });
  } catch (err) {
    (self as DedicatedWorkerGlobalScope).postMessage({
      id: msg.id,
      ok: false,
      error: String((err as Error)?.message || err),
    });
  }
};

export {};
