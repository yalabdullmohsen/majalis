import { normalizeArabic } from "@/shared/arabic-normalize";
import {
  compareTolerantMatches,
  scoreTolerantMatch,
  type TolerantMatch,
} from "@/features/search/tolerant-match";

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

export async function loadUnifiedSearchIndex(): Promise<IndexPayload> {
  if (cache) return cache;
  const res = await fetch("/data/search/index.json", { credentials: "omit" });
  if (!res.ok) throw new Error(`search index HTTP ${res.status}`);
  cache = (await res.json()) as IndexPayload;
  return cache;
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
    await new Promise<void>((r) => setTimeout(r, 0));
  }

  scored.sort((a, b) => compareTolerantMatches(a._m, b._m));
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
