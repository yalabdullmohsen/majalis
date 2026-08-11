/// <reference lib="webworker" />
/**
 * Background Arabic normalization for batch search indexing.
 * Keep logic in sync with src/shared/arabic-normalize.ts core rules.
 */

function toWesternDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function normalizeArabic(text: string): string {
  if (!text) return "";
  let s = toWesternDigits(
    text
      .replace(/[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g, "")
      .replace(/\u00A0/g, " "),
  );
  s = s
    .replace(/[ً-ٟ]/g, "")
    .replace(/ٰ/g, "")
    .replace(/[ٓ-ٕ]/g, "")
    .replace(/[ؖ-ؚ]/g, "")
    .replace(/[ۖ-ۜ۟-ۤۧ-ۭ]/g, "")
    .replace(/[ؐ-ؚ]/g, "")
    .replace(/[ۥ-ۦ]/g, "");
  s = s.replace(/[ﻵﻷﻹﻻ]/g, "لا");
  s = s.replace(/[أإآٱٲٳ]/g, "ا");
  s = s.replace(/ؤ/g, "و");
  s = s.replace(/[ىئی]/g, "ي");
  s = s.replace(/ة/g, "ه");
  s = s.replace(/ک/g, "ك");
  s = s.replace(/ء/g, "");
  s = s.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF0-9a-zA-Z\s]/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

type InMsg = { id: number; texts: string[] };

self.onmessage = (ev: MessageEvent<InMsg>) => {
  const { id, texts } = ev.data || { id: 0, texts: [] };
  const out = Array.isArray(texts) ? texts.map((t) => normalizeArabic(String(t ?? ""))) : [];
  (self as DedicatedWorkerGlobalScope).postMessage({ id, results: out });
};

export {};
