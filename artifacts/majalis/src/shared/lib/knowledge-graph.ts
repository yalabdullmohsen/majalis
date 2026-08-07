/**
 * محمّل الرسم البياني الثابت (حزمة G).
 * المصدر: /data/graph/links.json
 */
export type GraphKind =
  | "scholar"
  | "book"
  | "hadith"
  | "ruling"
  | "term"
  | "lesson"
  | "surah"
  | "dua"
  | "prophet"
  | "story";

export type GraphNodeRef = {
  kind: GraphKind;
  slug: string;
  titleAr?: string;
};

export type GraphLink = {
  from: GraphNodeRef;
  to: GraphNodeRef;
  rel: string;
  labelAr?: string;
  autoReverse?: boolean;
};

export type KnowledgeGraphDoc = {
  version: number;
  nodes: GraphNodeRef[];
  links: GraphLink[];
};

let cache: KnowledgeGraphDoc | null = null;

export async function loadKnowledgeGraph(): Promise<KnowledgeGraphDoc> {
  if (cache) return cache;
  const res = await fetch("/data/graph/links.json", { credentials: "omit" });
  if (!res.ok) throw new Error(`knowledge graph HTTP ${res.status}`);
  cache = (await res.json()) as KnowledgeGraphDoc;
  return cache;
}

export function relatedFor(
  doc: KnowledgeGraphDoc,
  kind: GraphKind,
  slug: string,
  limit = 8,
): GraphLink[] {
  const key = `${kind}:${slug}`;
  return doc.links
    .filter((L) => `${L.from.kind}:${L.from.slug}` === key)
    .slice(0, limit);
}
