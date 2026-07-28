/**
 * Text/normalize Web Worker — runs Arabic normalize + includes off the main thread.
 * Supervised via worker-supervisor (auto-restart on crash).
 */

/// <reference lib="webworker" />

import { normalizeArabic, normalizedIncludes } from "../shared/arabic-normalize";

export type TextParseRequest =
  | { type: "normalize"; payload: string }
  | { type: "includes"; payload: { haystack: string; needle: string } }
  | { type: "batchNormalize"; payload: string[] };

self.onmessage = (ev: MessageEvent) => {
  const msg = ev.data as { id: number; type: string; payload: unknown } | null;
  if (!msg || typeof msg.id !== "number") return;
  try {
    let result: unknown;
    switch (msg.type) {
      case "normalize":
        result = normalizeArabic(String(msg.payload ?? ""));
        break;
      case "includes": {
        const p = msg.payload as { haystack?: string; needle?: string };
        result = normalizedIncludes(p?.haystack ?? "", String(p?.needle ?? ""));
        break;
      }
      case "batchNormalize": {
        const arr = Array.isArray(msg.payload) ? (msg.payload as string[]) : [];
        result = arr.map((s) => normalizeArabic(String(s ?? "")));
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
