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

type Props = {
  nodeId?: string;
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
  const [items, setItems]   = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        let id = nodeId;

        if (!id && referenceId && nodeType) {
          const all   = await fetchKnNodes(nodeType as import("@/lib/knowledge-graph-service").KnNodeType, 200);
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

        if (!cancelled) { setItems(related); setLoading(false); }
      } catch {
        if (!cancelled) { setItems([]); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [nodeId, referenceId, nodeType, limit]);

  if (loading || items.length === 0) return null;

  return (
    <aside dir="rtl" className="rcw-aside">
      <h2 className="rcw-title">
        <span className="rcw-title__icon">🕸️</span>
        {title}
      </h2>

      <div className="rcw-grid">
        {items.map(({ node, edge }) => {
          const color = NODE_TYPE_COLOR[node.node_type] ?? "var(--majalis-emerald-deep)";
          const href  = getNodeHref(node);

          return (
            <Link key={edge.id} href={href} className="rcw-link">
              <div
                className="rcw-card"
                style={{ "--rcw-color": color } as React.CSSProperties}
              >
                <span
                  className="rcw-badge"
                  style={{
                    "--rcw-badge-bg":    `${color}18`,
                    "--rcw-badge-color": color,
                  } as React.CSSProperties}
                >
                  {NODE_TYPE_LABEL[node.node_type] ?? node.node_type}
                </span>

                <div className="rcw-body">
                  <div className="rcw-body__title">{node.title}</div>
                  <div className="rcw-body__meta">
                    {REL_TYPE_LABEL[edge.relationship_type] ?? edge.relationship_type}
                    {edge.verified_by ? ` · ${edge.verified_by}` : ""}
                  </div>
                  {node.summary && (
                    <div className="rcw-body__summary">{node.summary}</div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rcw-footer">
        <Link href="/knowledge-graph" className="rcw-footer__link">
          استكشف الرسم البياني المعرفي كاملاً ←
        </Link>
      </div>
    </aside>
  );
}
