/**
 * عامل بحث آيات — يحتفظ بقاعدة textNorm بعد init، ثم يصفي بالاستعلام فقط.
 */
export type VerseSearchInitMessage = {
  type: "init";
  items: Array<{ text: string; textNorm: string }>;
};

export type VerseSearchQueryMessage = {
  type: "search";
  id: number;
  query: string;
  queryNorm: string;
  limit: number;
};

export type VerseSearchWorkerResponse = {
  id: number;
  ok: boolean;
  indices?: number[];
  error?: string;
};

let cache: Array<{ text: string; textNorm: string }> | null = null;

addEventListener(
  "message",
  (event: MessageEvent<VerseSearchInitMessage | VerseSearchQueryMessage>) => {
    const msg = event.data;
    try {
      if (msg?.type === "init") {
        cache = Array.isArray(msg.items) ? msg.items : [];
        postMessage({ id: 0, ok: true, indices: [] } satisfies VerseSearchWorkerResponse);
        return;
      }
      if (msg?.type !== "search" || !cache) {
        postMessage({
          id: (msg as VerseSearchQueryMessage)?.id ?? 0,
          ok: false,
          error: "not ready",
        } satisfies VerseSearchWorkerResponse);
        return;
      }
      const raw = msg.query.trim();
      const needle = msg.queryNorm;
      const indices: number[] = [];
      const limit = Math.max(1, msg.limit || 48);
      for (let i = 0; i < cache.length; i++) {
        const item = cache[i]!;
        if (item.text.includes(raw) || item.textNorm.includes(needle)) {
          indices.push(i);
          if (indices.length >= limit) break;
        }
      }
      postMessage({ id: msg.id, ok: true, indices } satisfies VerseSearchWorkerResponse);
    } catch (err) {
      postMessage({
        id: (msg as VerseSearchQueryMessage)?.id ?? 0,
        ok: false,
        error: err instanceof Error ? err.message : "verse search worker failed",
      } satisfies VerseSearchWorkerResponse);
    }
  },
);
