import { normalizeArabic } from "@/shared/arabic-normalize";

export type UnifiedSearchDoc = {
  id: string;
  kind: string;
  titleAr: string;
  href: string;
  norm: string;
  meta?: string;
};

export type UnifiedSearchHit = {
  id: string;
  kind: string;
  titleAr: string;
  href: string;
  meta?: string;
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

/** بحث محلي مجمّع حسب النوع — بلا شبكة. */
export function searchUnifiedIndex(
  docs: UnifiedSearchDoc[],
  query: string,
  limit = 40,
): Record<string, UnifiedSearchHit[]> {
  const q = normalizeArabic(query);
  const out: Record<string, UnifiedSearchHit[]> = {};
  if (!q) return out;

  let total = 0;
  for (const d of docs) {
    if (!d.norm.includes(q)) continue;
    const bucket = (out[d.kind] ??= []);
    if (bucket.length >= 12) continue;
    bucket.push({
      id: d.id,
      kind: d.kind,
      titleAr: d.titleAr,
      href: d.href,
      meta: d.meta,
    });
    total += 1;
    if (total >= limit) break;
  }
  return out;
}
