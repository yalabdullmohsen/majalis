/**
 * Tajweed timing analysis worker — CPU-bound word duration checks off main thread.
 */
/// <reference lib="webworker" />

import type {
  TajweedWorkerNote,
  TajweedWorkerRequest,
  TajweedWorkerResponse,
} from "./protocol";

const MADD_BASE = new Set(["ا", "و", "ي", "ى", "ٱ"]);
const MADD_SUPERSCRIPT_ALIF = "\u0670";
const MADD_MIN_SEC = 0.18;
const MADD_MAX_SEC = 0.95;

function hasMaddLetter(raw: string): boolean {
  for (const ch of raw) {
    if (MADD_BASE.has(ch) || ch === MADD_SUPERSCRIPT_ALIF) return true;
  }
  return false;
}

self.onmessage = (ev: MessageEvent<TajweedWorkerRequest>) => {
  const msg = ev.data;
  if (!msg || msg.type !== "analyze-timings") return;
  try {
    const notes: TajweedWorkerNote[] = [];
    for (const pair of msg.pairs ?? []) {
      const raw = pair.ref?.raw ?? "";
      const heard = pair.heard?.word ?? "";
      if (!hasMaddLetter(raw) && !hasMaddLetter(heard)) continue;
      const start = pair.heard?.startSec;
      const end = pair.heard?.endSec;
      if (start == null || end == null) continue;
      const dur = end - start;
      if (!(dur > 0)) continue;
      if (dur < MADD_MIN_SEC) {
        notes.push({
          refIndex: pair.ref.index,
          rule: "madd_tabeei_short",
          confidencePct: 62,
          message:
            "قد يكون المدّ أقصر من المتوقع في هذه الكلمة — أعد سماعها من قارئ معتمد.",
        });
      } else if (dur > MADD_MAX_SEC) {
        notes.push({
          refIndex: pair.ref.index,
          rule: "madd_tabeei_long",
          confidencePct: 58,
          message:
            "قد يكون المدّ أطول من المعتاد هنا — راجع حكم المد مع معلّم إن أمكن.",
        });
      }
    }
    const res: TajweedWorkerResponse = {
      id: msg.id,
      type: "analyze-timings-result",
      notes,
    };
    self.postMessage(res);
  } catch (err) {
    const res: TajweedWorkerResponse = {
      id: msg.id,
      type: "analyze-timings-result",
      notes: [],
      error: err instanceof Error ? err.message : "tajweed-failed",
    };
    self.postMessage(res);
  }
};

export {};
