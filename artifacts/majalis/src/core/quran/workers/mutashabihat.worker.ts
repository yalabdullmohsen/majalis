/**
 * Mutashabihat flatten worker — keeps large index transforms off the main thread.
 * Self-contained (no Dexie imports) so the worker bundle stays lean.
 */
/// <reference lib="webworker" />

import type {
  MutashabihatWorkerRequest,
  MutashabihatWorkerResponse,
} from "./protocol";

function ayahKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

function flatten(
  index: Record<string, Array<{ surah: number; ayah: number }>>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, matches] of Object.entries(index)) {
    out[key] = matches.map((m) => ayahKey(m.surah, m.ayah));
  }
  return out;
}

function merge(
  similarByAyah: Record<string, string[]>,
  themesByAyah: Record<string, string[]>,
): MutashabihatWorkerResponse["rows"] {
  const keys = new Set([...Object.keys(similarByAyah), ...Object.keys(themesByAyah)]);
  const rows: MutashabihatWorkerResponse["rows"] = [];
  for (const ayah_key of keys) {
    rows.push({
      ayah_key,
      similar_ayah_keys: similarByAyah[ayah_key] ?? [],
      theme_ids: themesByAyah[ayah_key] ?? [],
    });
  }
  return rows;
}

self.onmessage = (ev: MessageEvent<MutashabihatWorkerRequest>) => {
  const msg = ev.data;
  if (!msg || msg.type !== "flatten-index") return;
  try {
    const similar = flatten(msg.index ?? {});
    const rows = merge(similar, msg.themes ?? {});
    const res: MutashabihatWorkerResponse = {
      id: msg.id,
      type: "flatten-index-result",
      rows,
    };
    self.postMessage(res);
  } catch (err) {
    const res: MutashabihatWorkerResponse = {
      id: msg.id,
      type: "flatten-index-result",
      rows: [],
      error: err instanceof Error ? err.message : "flatten-failed",
    };
    self.postMessage(res);
  }
};

export {};
