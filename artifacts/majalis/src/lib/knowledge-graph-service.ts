/**
 * Islamic Knowledge Graph — client service
 * يتصل بـ /api/knowledge-graph/* ويوفر بيانات للمكونات.
 */

import { requestFetch } from "@/lib/request-manager";

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
  quran_ayah:    "#065f46", // أخضر داكن
  hadith:        "#1d4ed8", // أزرق
  fatwa:         "#7c3aed", // بنفسجي
  scholar:       "#173D35", // ذهبي
  book:          "#173D35", // بني
  lesson:        "#0369a1", // أزرق فاتح
  benefit:       "#047857", // أخضر
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

/** رابط التنقل لكل نوع عقدة */
export function getNodeHref(node: KnNode): string {
  const ref = node.reference_id;
  switch (node.node_type) {
    case "quran_ayah":    return "/quran-hub";
    case "hadith":        return "/hadith";
    case "fatwa":         return "/rulings";
    case "scholar":       return "/lessons";
    case "book":          return ref ? `/library/${ref}` : "/library";
    case "lesson":        return ref ? `/lessons/${ref}` : "/lessons";
    case "benefit":       return "/fawaid";
    case "prophet_story": return "/prophets";
    case "term":          return `/search/${encodeURIComponent(node.title)}`;
    default:              return "/knowledge-graph";
  }
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
