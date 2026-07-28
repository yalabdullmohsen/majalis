/**
 * Client facade for the supervised text-parse worker.
 * Falls back to main-thread normalize if Workers unavailable.
 * Logic-only — no UI.
 */

import { normalizeArabic, normalizedIncludes } from "@/shared/arabic-normalize";
import { SupervisedWorker } from "@/lib/worker-supervisor";

let supervised: SupervisedWorker | null = null;

function getWorker(): SupervisedWorker | null {
  if (typeof Worker === "undefined") return null;
  if (supervised) return supervised;
  try {
    supervised = new SupervisedWorker(
      () =>
        new Worker(new URL("../workers/text-parse.worker.ts", import.meta.url), {
          type: "module",
          name: "majalis-text-parse",
        }),
      { name: "text-parse", maxRestarts: 5 },
    );
    return supervised;
  } catch {
    return null;
  }
}

/** Normalize Arabic off the main thread when possible. */
export async function workerNormalizeArabic(text: string): Promise<string> {
  const w = getWorker();
  if (!w) return normalizeArabic(text);
  try {
    return await w.request<string>("normalize", text, 8_000);
  } catch {
    return normalizeArabic(text);
  }
}

export async function workerNormalizedIncludes(
  haystack: string,
  needle: string,
): Promise<boolean> {
  const w = getWorker();
  if (!w) return normalizedIncludes(haystack, needle);
  try {
    return await w.request<boolean>("includes", { haystack, needle }, 8_000);
  } catch {
    return normalizedIncludes(haystack, needle);
  }
}

export async function workerBatchNormalize(texts: string[]): Promise<string[]> {
  const w = getWorker();
  if (!w) return texts.map((t) => normalizeArabic(t));
  try {
    return await w.request<string[]>("batchNormalize", texts, 15_000);
  } catch {
    return texts.map((t) => normalizeArabic(t));
  }
}

/** Test / teardown. */
export function terminateTextParseWorker(): void {
  supervised?.terminate();
  supervised = null;
}
