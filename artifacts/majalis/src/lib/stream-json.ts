/**
 * Progressive stream readers for JSON API payloads (Tafseer / search).
 * Consumes ReadableStream chunks and emits completed array items early.
 * Logic-only — no UI.
 */

import { yieldToMain } from "@/lib/yield-to-main";

export type StreamProgressHandlers<T> = {
  /** Called as complete objects are extracted from a growing JSON array. */
  onItem?: (item: T, index: number) => void;
  /** Called with raw text length as bytes arrive. */
  onBytes?: (totalChars: number) => void;
  signal?: AbortSignal;
};

/**
 * Read a Response body as text via ReadableStream when available.
 * Falls back to res.text() on older engines.
 */
export async function readResponseTextStreaming(
  res: Response,
  onChunk?: (chunk: string, total: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!res.body || typeof res.body.getReader !== "function") {
    const text = await res.text();
    onChunk?.(text, text);
    return text;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let total = "";
  try {
    while (true) {
      if (signal?.aborted) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        throw new DOMException("Aborted", "AbortError");
      }
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      total += chunk;
      onChunk?.(chunk, total);
    }
    total += decoder.decode();
    return total;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Extract complete top-level JSON objects from a growing text buffer that
 * contains `"ayahs":[ {...}, {...} ]` (AlQuran Cloud shape) or a bare array.
 * Uses brace depth — safe for streamed partial payloads.
 */
export function extractCompletedJsonObjects(buffer: string): { items: unknown[]; restHint: number } {
  const items: unknown[] = [];
  // Prefer ayahs array region
  const ayahsIdx = buffer.indexOf('"ayahs"');
  let startArr = -1;
  if (ayahsIdx >= 0) {
    startArr = buffer.indexOf("[", ayahsIdx);
  } else {
    startArr = buffer.indexOf("[");
  }
  if (startArr < 0) return { items, restHint: 0 };

  let i = startArr + 1;
  while (i < buffer.length) {
    while (i < buffer.length && (buffer[i] === "," || /\s/.test(buffer[i]!))) i += 1;
    if (i >= buffer.length || buffer[i] === "]") break;
    if (buffer[i] !== "{") {
      i += 1;
      continue;
    }
    const objStart = i;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (; i < buffer.length; i++) {
      const ch = buffer[i]!;
      if (inString) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          const slice = buffer.slice(objStart, i + 1);
          try {
            items.push(JSON.parse(slice));
          } catch {
            /* incomplete / invalid — stop */
            return { items, restHint: objStart };
          }
          i += 1;
          break;
        }
      }
    }
    if (depth !== 0) {
      // Incomplete object at end of buffer
      return { items, restHint: objStart };
    }
  }
  return { items, restHint: i };
}

export type ProgressiveAyah = { numberInSurah: number; text: string };

function asAyah(v: unknown): ProgressiveAyah | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { numberInSurah?: unknown; text?: unknown };
  const n = Number(o.numberInSurah);
  if (!Number.isFinite(n) || typeof o.text !== "string") return null;
  return { numberInSurah: n, text: o.text };
}

/**
 * Fetch JSON and progressively emit ayah-like objects from streamed body.
 * Always returns the full parsed list when the response completes.
 */
export async function fetchProgressiveAyahArray(
  url: string,
  init: RequestInit & { priority?: RequestInit extends never ? never : "high" | "low" | "auto" } = {},
  handlers: StreamProgressHandlers<ProgressiveAyah> = {},
): Promise<ProgressiveAyah[]> {
  const res = await fetch(url, init as RequestInit);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let emitted = 0;
  const seen = new Set<number>();
  const collected: ProgressiveAyah[] = [];

  const ingestBuffer = async (buf: string) => {
    handlers.onBytes?.(buf.length);
    const { items } = extractCompletedJsonObjects(buf);
    for (const raw of items) {
      const ayah = asAyah(raw);
      if (!ayah || seen.has(ayah.numberInSurah)) continue;
      seen.add(ayah.numberInSurah);
      collected.push(ayah);
      handlers.onItem?.(ayah, emitted);
      emitted += 1;
      if (emitted % 8 === 0) await yieldToMain();
    }
  };

  const text = await readResponseTextStreaming(
    res,
    (chunk, total) => {
      void ingestBuffer(total);
      void chunk;
    },
    handlers.signal,
  );

  // Final authoritative parse
  try {
    const json = JSON.parse(text) as {
      code?: number;
      data?: { ayahs?: Array<{ numberInSurah: number; text: string }>; matches?: unknown };
      ayahs?: Array<{ numberInSurah: number; text: string }>;
    };
    const ayahs = json.data?.ayahs ?? json.ayahs ?? [];
    if (Array.isArray(ayahs) && ayahs.length) {
      const finalList: ProgressiveAyah[] = [];
      for (const a of ayahs) {
        const ayah = asAyah(a);
        if (ayah) finalList.push(ayah);
      }
      return finalList;
    }
  } catch {
    /* use collected */
  }
  return collected;
}
