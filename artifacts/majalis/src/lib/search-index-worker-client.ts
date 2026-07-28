/**
 * Supervised search-index worker client with main-thread fallback.
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
        new Worker(new URL("../workers/search-index.worker.ts", import.meta.url), {
          type: "module",
          name: "majalis-search-index",
        }),
      { name: "search-index", maxRestarts: 5 },
    );
    return supervised;
  } catch {
    return null;
  }
}

export async function workerFilterIncludes(
  haystacks: string[],
  needle: string,
): Promise<number[]> {
  const w = getWorker();
  if (!w) {
    return haystacks
      .map((h, i) => (normalizedIncludes(h, needle) ? i : -1))
      .filter((i) => i >= 0);
  }
  try {
    return await w.request<number[]>("filterIncludes", { haystacks, needle }, 12_000);
  } catch {
    return haystacks
      .map((h, i) => (normalizedIncludes(h, needle) ? i : -1))
      .filter((i) => i >= 0);
  }
}

export async function workerSearchNormalize(text: string): Promise<string> {
  const w = getWorker();
  if (!w) return normalizeArabic(text);
  try {
    return await w.request<string>("normalize", text, 8_000);
  } catch {
    return normalizeArabic(text);
  }
}

export function terminateSearchIndexWorker(): void {
  supervised?.terminate();
  supervised = null;
}
