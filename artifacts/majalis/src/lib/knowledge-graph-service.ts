/**
 * Islamic Knowledge Graph — client service
 * يتصل بـ /api/knowledge-graph/* ويوفر بيانات للمكونات.
 */

import { requestFetch } from "@/lib/request-manager";
import { hrefKnowledgeNode } from "@/lib/content-href";

// ── Types ─────────────────────────────────────────────────────────────────

export type KnNodeType =
  | "quran_ayah"
  | "hadith"
  | "fatwa"
  | "scholar"
  | "book"
  | "lesson"
  | "benefit"
  | "prophet_story"
  | "term";

export type KnRelType =
  | "explains"
  | "references"
  | "authored_by"
  | "related_topic"
  | "contradicts_view"
  | "prerequisite";

export type KnNode = {
  id: string;
  node_type: KnNodeType;
  title: string;
  summary?: string | null;
  reference_id?: string | null;
  depth?: number;
};

export type KnEdge = {
  id: string;
  source_id?: string;
  target_id?: string;
  source?: KnNode;
  target?: KnNode;
  relationship_type: KnRelType;
  strength: number;
  verified_by: string;
  direction?: "outgoing" | "incoming";
  created_at?: string;
};

export type KnTag = {
  id: string;
  tag_name_ar: string;
  category: string;
};

export type KnNodeDetail = KnNode & {
  edges: KnEdge[];
  tags: KnTag[];
  created_at?: string;
  updated_at?: string;
};

export type KnSubgraph = {
  center_node_id: string;
  depth: number;
  nodes: KnNode[];
  edges: KnEdge[];
};

// ── Labels عربية ─────────────────────────────────────────────────────────

export const NODE_TYPE_LABEL: Record<KnNodeType, string> = {
  quran_ayah:    "آية قرآنية",
  hadith:        "حديث",
  fatwa:         "فتوى",
  scholar:       "عالم",
  book:          "كتاب",
  lesson:        "درس",
  benefit:       "فائدة",
  prophet_story: "قصة نبي",
  term:          "مصطلح",
};

export const NODE_TYPE_COLOR: Record<KnNodeType, string> = {
  quran_ayah:    "var(--mj-brand)", // أخضر داكن
  hadith:        "#1d4ed8", // أزرق
  fatwa:         "#7c3aed", // بنفسجي
  scholar:       "var(--mj-brand-deep)", // ذهبي
  book:          "var(--mj-brand-deep)", // بني
  lesson:        "#0369a1", // أزرق فاتح
  benefit:       "var(--mj-brand)", // أخضر
  prophet_story: "#dc2626", // أحمر
  term:          "#6b7280", // رمادي
};

export const REL_TYPE_LABEL: Record<KnRelType, string> = {
  explains:         "يشرح",
  references:       "يستشهد بـ",
  authored_by:      "من تأليف",
  related_topic:    "نفس الموضوع",
  contradicts_view: "خلاف فقهي",
  prerequisite:     "مقدمة لفهم",
};

/** رابط التنقل لكل نوع عقدة — من المصدر الموحّد content-href. */
export function getNodeHref(node: KnNode): string {
  return hrefKnowledgeNode(node.node_type, node.reference_id, node.title);
}

// ── API calls ─────────────────────────────────────────────────────────────

async function kgFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await requestFetch(`/api/knowledge-graph${path}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.ok ? json : null;
  } catch {
    return null;
  }
}

export async function fetchKnNode(nodeId: string): Promise<KnNodeDetail | null> {
  const json = await kgFetch<{ node: KnNodeDetail }>(`/node/${nodeId}`);
  return json?.node ?? null;
}

export async function fetchKnSubgraph(
  nodeId: string,
  depth = 1,
): Promise<KnSubgraph | null> {
  const json = await kgFetch<KnSubgraph>(`/node/${nodeId}/expand?depth=${depth}`);
  return json ?? null;
}

export async function fetchKnNodesByTag(
  tag: string,
  limit = 20,
): Promise<{ tags_found: KnTag[]; nodes: KnNode[] } | null> {
  const json = await kgFetch<{ tags_found: KnTag[]; nodes: KnNode[] }>(
    `/search?tag=${encodeURIComponent(tag)}&limit=${limit}`,
  );
  return json ?? null;
}

export async function fetchKnNodes(
  type?: KnNodeType,
  limit = 50,
): Promise<KnNode[]> {
  const params = type ? `?type=${type}&limit=${limit}` : `?limit=${limit}`;
  const json = await kgFetch<{ nodes: KnNode[] }>(`/nodes${params}`);
  return json?.nodes ?? [];
}

const KIND_TO_NODE_TYPE: Record<string, KnNodeType> = {
  scholar: "scholar",
  book: "book",
  hadith: "hadith",
  ruling: "fatwa",
  term: "term",
  surah: "quran_ayah",
  dua: "benefit",
  prophet: "prophet_story",
  lesson: "lesson",
};

/**
 * احتياطي محلي من public/data/graph/links.json عند فراغ واجهة API.
 * لا يعتمد على Supabase؛ يكفي لعرض هيكل علمي أولي.
 */
export async function fetchStaticKnGraphFallback(): Promise<{
  nodes: KnNode[];
  edges: KnEdge[];
} | null> {
  try {
    const base = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
    const res = await requestFetch(`${base}data/graph/links.json`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      nodes?: { kind?: string; slug?: string; titleAr?: string }[];
      links?: {
        from?: { slug?: string };
        to?: { slug?: string };
        rel?: string;
        source?: string;
        target?: string;
      }[];
    };
    const nodes: KnNode[] = (data.nodes || [])
      .filter((n) => n.slug && n.titleAr)
      .map((n) => ({
        id: String(n.slug),
        node_type: KIND_TO_NODE_TYPE[String(n.kind || "term")] || "term",
        title: String(n.titleAr),
        reference_id: String(n.slug),
      }));
    const idSet = new Set(nodes.map((n) => n.id));
    const relMap: Record<string, KnRelType> = {
      authored: "authored_by",
      authored_by: "authored_by",
      explains: "explains",
      references: "references",
      related: "related_topic",
      related_topic: "related_topic",
      prerequisite: "prerequisite",
    };
    const edges: KnEdge[] = (data.links || [])
      .map((l, i) => {
        const sourceId = String(l.from?.slug || l.source || "");
        const targetId = String(l.to?.slug || l.target || "");
        return {
          id: `static-e-${i}`,
          source_id: sourceId,
          target_id: targetId,
          relationship_type: relMap[String(l.rel || "")] || "related_topic",
          strength: 0.6,
          verified_by: "static-fallback",
        } satisfies KnEdge;
      })
      .filter((e) => e.source_id && e.target_id && idSet.has(e.source_id) && idSet.has(e.target_id));
    if (nodes.length === 0) return null;
    return { nodes, edges };
  } catch {
    return null;
  }
}

export async function createKnRelationship(
  payload: {
    source_node_id: string;
    target_node_id: string;
    relationship_type: KnRelType;
    strength?: number;
    verified_by: string;
  },
  authToken: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch("/api/knowledge-graph/relationship", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
