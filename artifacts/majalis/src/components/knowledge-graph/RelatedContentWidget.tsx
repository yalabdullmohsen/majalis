/**
 * RelatedContentWidget — ويدجت "محتوى ذو صلة"
 *
 * نسخة بطاقات مبسطة (غير رسومية) تُعرض أسفل صفحات المحتوى.
 * مثال الاستخدام:
 *   <RelatedContentWidget nodeId="uuid-of-this-page-node" />
 *   أو
 *   <RelatedContentWidget referenceId="hadith-001" nodeType="hadith" />
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  fetchKnNode,
  fetchKnNodes,
  getNodeHref,
  NODE_TYPE_COLOR,
  NODE_TYPE_LABEL,
  REL_TYPE_LABEL,
  type KnEdge,
  type KnNode,
} from "@/lib/knowledge-graph-service";
import { C } from "@/lib/theme";

type Props = {
  /** معرّف العقدة في kn_nodes */
  nodeId?: string;
  /** البديل: reference_id + node_type للبحث عن العقدة */
  referenceId?: string;
  nodeType?: string;
  title?: string;
  limit?: number;
};

type RelatedItem = {
  node: KnNode;
  edge: KnEdge;
};

export function RelatedContentWidget({
  nodeId,
  referenceId,
  nodeType,
  title = "مواد ذات صلة من الرسم البياني المعرفي",
  limit = 6,
}: Props) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        let id = nodeId;

        // إذا لم يُعطَ nodeId، ابحث عبر referenceId
        if (!id && referenceId && nodeType) {
          const all = await fetchKnNodes(nodeType as import("@/lib/knowledge-graph-service").KnNodeType, 200);
          const found = all.find((n) => n.reference_id === referenceId);
          id = found?.id;
        }

        if (!id) {
          if (!cancelled) { setItems([]); setLoading(false); }
          return;
        }

        const detail = await fetchKnNode(id);
        if (!detail || !detail.edges?.length) {
          if (!cancelled) { setItems([]); setLoading(false); }
          return;
        }

        const related: RelatedItem[] = detail.edges
          .slice(0, limit)
          .map((edge) => ({
            node: edge.direction === "outgoing" ? (edge.target as KnNode) : (edge.source as KnNode),
            edge,
          }))
          .filter((r) => r.node?.id);

        if (!cancelled) {
          setItems(related);
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setItems([]); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [nodeId, referenceId, nodeType, limit]);

  if (loading || items.length === 0) return null;

  return (
    <aside
      dir="rtl"
      style={{
        marginTop: "2rem",
        padding: "1.25rem",
        borderRadius: "0.75rem",
        border: `1px solid ${C.line}`,
        background: C.panel,
      }}
    >
      <h2
        style={{
          fontSize: "0.9375rem",
          fontWeight: 700,
          color: C.emeraldDeep,
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>🕸️</span>
        {title}
      </h2>

      <div style={{ display: "grid", gap: "0.5rem" }}>
        {items.map(({ node, edge }) => {
          const color = NODE_TYPE_COLOR[node.node_type] ?? C.emeraldDeep;
          const href = getNodeHref(node);

          return (
            <Link key={edge.id} href={href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  border: `1px solid ${C.line}`,
                  background: "#fff",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = color;
                  (e.currentTarget as HTMLElement).style.background = `${color}08`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.line;
                  (e.currentTarget as HTMLElement).style.background = "#fff";
                }}
              >
                {/* نوع العقدة */}
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background: `${color}18`,
                    color,
                    borderRadius: "4px",
                    padding: "2px 8px",
                    marginTop: "2px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {NODE_TYPE_LABEL[node.node_type] ?? node.node_type}
                </span>

                {/* العنوان والعلاقة */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: C.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {node.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.125rem" }}>
                    {REL_TYPE_LABEL[edge.relationship_type] ?? edge.relationship_type}
                    {edge.verified_by ? ` · ${edge.verified_by}` : ""}
                  </div>
                  {node.summary && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: C.inkSoft,
                        marginTop: "0.25rem",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {node.summary}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
        <Link
          href="/knowledge-graph"
          style={{
            fontSize: "0.8125rem",
            color: C.emeraldDeep,
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          استكشف الرسم البياني المعرفي كاملاً ←
        </Link>
      </div>
    </aside>
  );
}
