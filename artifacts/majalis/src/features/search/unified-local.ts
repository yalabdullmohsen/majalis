import { normalizeArabic } from "@/shared/arabic-normalize";
import {
  compareTolerantMatches,
  scoreTolerantMatch,
  type TolerantMatch,
} from "@/features/search/tolerant-match";
import { kindPriority } from "@/features/search/kind-priority";
import { yieldToMain } from "@/lib/yield-to-main";

export type UnifiedSearchDoc = {
  id: string;
  kind: string;
  titleAr: string;
  href: string;
  /** نص مطبّع مسبقًا عند توليد الفهرس — لا تُعاد تطبيعه في كل ضغطة */
  norm: string;
  meta?: string;
};

export type UnifiedSearchHit = {
  id: string;
  kind: string;
  titleAr: string;
  href: string;
  meta?: string;
  match?: TolerantMatch;
};

type IndexPayload = {
  version: number;
  docs: UnifiedSearchDoc[];
};

let cache: IndexPayload | null = null;

/** للاختبارات أو الحقن المسبق دون شبكة. */
export function primeUnifiedSearchIndex(payload: IndexPayload): void {
  cache = payload;
}

export function clearUnifiedSearchIndexCache(): void {
  cache = null;
}

export async function loadUnifiedSearchIndex(): Promise<IndexPayload> {
  if (cache) return cache;
  const empty: IndexPayload = { version: 0, docs: [] };
  const url = "/data/search/index.json";
  const fromWorker = await loadIndexViaWorker(url);
  if (fromWorker) {
    cache = fromWorker;
    return cache;
  }
  const { fetchStaticJsonCached } = await import("@/lib/static-json-cache");
  const json = await fetchStaticJsonCached<IndexPayload>(url, empty, { timeoutMs: 8_000 });
  if (!Array.isArray(json.docs) || json.docs.length === 0) {
    throw new Error("search index unavailable");
  }
  cache = json;
  return cache;
}

function loadIndexViaWorker(url: string): Promise<IndexPayload | null> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: IndexPayload | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      const worker = new Worker(new URL("./search-index.worker.ts", import.meta.url), {
        type: "module",
      });
      const timer = window.setTimeout(() => {
        worker.terminate();
        finish(null);
      }, 8_000);
      worker.onmessage = (event: MessageEvent<{ ok?: boolean; json?: IndexPayload }>) => {
        window.clearTimeout(timer);
        worker.terminate();
        const payload = event.data?.json;
        if (event.data?.ok && payload && Array.isArray(payload.docs) && payload.docs.length > 0) {
          finish(payload);
          return;
        }
        finish(null);
      };
      worker.onerror = () => {
        window.clearTimeout(timer);
        worker.terminate();
        finish(null);
      };
      worker.postMessage({ url });
    } catch {
      finish(null);
    }
  });
}

const SYNC_SCAN_BUDGET = 2_500;

/** بحث محلي مجمّع حسب النوع — بلا شبكة، مع ترتيب التسامح. */
export function searchUnifiedIndex(
  docs: UnifiedSearchDoc[],
  query: string,
  limit = 40,
): Record<string, UnifiedSearchHit[]> {
  const q = normalizeArabic(query);
  const out: Record<string, UnifiedSearchHit[]> = {};
  if (!q) return out;

  type Scored = UnifiedSearchHit & { _m: TolerantMatch };
  const scored: Scored[] = [];

  const scan = (from: number, to: number) => {
    for (let i = from; i < to; i++) {
      const d = docs[i]!;
      const m = scoreTolerantMatch(d.titleAr, query, d.norm);
      if (!m) continue;
      scored.push({
        id: d.id,
        kind: d.kind,
        titleAr: d.titleAr,
        href: d.href,
        meta: d.meta,
        match: m,
        _m: m,
      });
    }
  };

  if (docs.length <= SYNC_SCAN_BUDGET) {
    scan(0, docs.length);
  } else {
    // فهرس كبير: امسح على دفعات متزامنة قصيرة (واجهة الاختبار/العقدة);
    // في المتصفح يُفضّل استدعاء searchUnifiedIndexAsync.
    scan(0, docs.length);
  }

  scored.sort((a, b) => {
    const c = compareTolerantMatches(a._m, b._m);
    if (c !== 0) return c;
    const pk = kindPriority(a.kind) - kindPriority(b.kind);
    if (pk !== 0) return pk;
    return a.titleAr.localeCompare(b.titleAr, "ar");
  });

  // حدّ ضوضاء الاستعلام القصير
  const maxTotal = q.replace(/\s+/g, "").length <= 2 ? 12 : limit;
  let total = 0;
  for (const s of scored) {
    const bucket = (out[s.kind] ??= []);
    if (bucket.length >= 12) continue;
    bucket.push({
      id: s.id,
      kind: s.kind,
      titleAr: s.titleAr,
      href: s.href,
      meta: s.meta,
      match: s._m,
    });
    total += 1;
    if (total >= maxTotal) break;
  }
  return out;
}

/** بحث في الخلفية عند كبر الفهرس — يُلغي عبر AbortSignal. */
export async function searchUnifiedIndexAsync(
  docs: UnifiedSearchDoc[],
  query: string,
  limit = 40,
  signal?: AbortSignal,
): Promise<Record<string, UnifiedSearchHit[]>> {
  const q = normalizeArabic(query);
  if (!q) return {};
  if (docs.length <= SYNC_SCAN_BUDGET) {
    return searchUnifiedIndex(docs, query, limit);
  }

  type Scored = UnifiedSearchHit & { _m: TolerantMatch };
  const scored: Scored[] = [];
  const chunk = 400;
  for (let i = 0; i < docs.length; i += chunk) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const end = Math.min(docs.length, i + chunk);
    for (let j = i; j < end; j++) {
      const d = docs[j]!;
      const m = scoreTolerantMatch(d.titleAr, query, d.norm);
      if (!m) continue;
      scored.push({
        id: d.id,
        kind: d.kind,
        titleAr: d.titleAr,
        href: d.href,
        meta: d.meta,
        match: m,
        _m: m,
      });
    }
    await yieldToMain();
  }

  scored.sort((a, b) => {
    const c = compareTolerantMatches(a._m, b._m);
    if (c !== 0) return c;
    const pk = kindPriority(a.kind) - kindPriority(b.kind);
    if (pk !== 0) return pk;
    return a.titleAr.localeCompare(b.titleAr, "ar");
  });
  const out: Record<string, UnifiedSearchHit[]> = {};
  const maxTotal = q.replace(/\s+/g, "").length <= 2 ? 12 : limit;
  let total = 0;
  for (const s of scored) {
    const bucket = (out[s.kind] ??= []);
    if (bucket.length >= 12) continue;
    bucket.push({
      id: s.id,
      kind: s.kind,
      titleAr: s.titleAr,
      href: s.href,
      meta: s.meta,
      match: s._m,
    });
    total += 1;
    if (total >= maxTotal) break;
  }
  return out;
}
