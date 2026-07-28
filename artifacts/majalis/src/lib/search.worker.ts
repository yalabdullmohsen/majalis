/**
 * Browser Web Worker for Arabic normalize + corpus field matching.
 * Keep self-contained imports so the worker bundle stays small.
 */

import { normalizeArabic } from "@/shared/arabic-normalize";
import { arabicIncludes, arabicMatchAny } from "@/lib/arabic-search";

export type SearchWorkerRequest =
  | { id: number; type: "normalize"; text: string }
  | { id: number; type: "normalizeMany"; texts: string[] }
  | {
      id: number;
      type: "filterDocs";
      query: string;
      docs: Array<{ id: string; fields: Array<string | null | undefined> }>;
      limit?: number;
    }
  | {
      id: number;
      type: "matchFields";
      query: string;
      fields: Array<string | null | undefined>;
    };

export type SearchWorkerResponse =
  | { id: number; type: "normalize"; value: string }
  | { id: number; type: "normalizeMany"; values: string[] }
  | { id: number; type: "filterDocs"; ids: string[] }
  | { id: number; type: "matchFields"; matched: boolean }
  | { id: number; type: "error"; error: string };

function handle(msg: SearchWorkerRequest): SearchWorkerResponse {
  try {
    switch (msg.type) {
      case "normalize":
        return { id: msg.id, type: "normalize", value: normalizeArabic(msg.text) };
      case "normalizeMany":
        return {
          id: msg.id,
          type: "normalizeMany",
          values: msg.texts.map((t) => normalizeArabic(t)),
        };
      case "filterDocs": {
        const q = msg.query.trim();
        if (!q) return { id: msg.id, type: "filterDocs", ids: [] };
        const limit = msg.limit ?? 40;
        const ids: string[] = [];
        for (const doc of msg.docs) {
          if (arabicMatchAny(doc.fields, q)) {
            ids.push(doc.id);
            if (ids.length >= limit) break;
          }
        }
        return { id: msg.id, type: "filterDocs", ids };
      }
      case "matchFields":
        return {
          id: msg.id,
          type: "matchFields",
          matched: arabicIncludes(msg.fields.join(" "), msg.query) || arabicMatchAny(msg.fields, msg.query),
        };
      default:
        return { id: (msg as { id: number }).id, type: "error", error: "unknown_type" };
    }
  } catch (err) {
    return {
      id: msg.id,
      type: "error",
      error: String((err as Error)?.message || err),
    };
  }
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;
ctx.onmessage = (ev: MessageEvent<SearchWorkerRequest>) => {
  const res = handle(ev.data);
  ctx.postMessage(res);
};
