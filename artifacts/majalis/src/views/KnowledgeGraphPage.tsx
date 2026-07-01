import { useEffect, useRef, useState } from "react";
import {
  getAllKnowledgeRelationshipsAdmin,
  type KnowledgeRelationship,
  type KnowledgeSourceType,
} from "@/lib/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────

type GraphNode = {
  id: string;
  type: KnowledgeSourceType;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type GraphEdge = {
  source: string;
  target: string;
  label: string;
};

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<KnowledgeSourceType, string> = {
  scholar:  "#065f46",
  lesson:   "#1d4ed8",
  book:     "#92400e",
  fatwa:    "#7c3aed",
  fawaid:   "#0369a1",
  question: "#b45309",
};

const TYPE_LABEL_AR: Record<KnowledgeSourceType, string> = {
  scholar:  "عالم",
  lesson:   "درس",
  book:     "كتاب",
  fatwa:    "فتوى",
  fawaid:   "فائدة",
  question: "سؤال",
};

const NODE_RADIUS = 24;
const REPULSION  = 4000;
const ATTRACTION = 0.03;
const DAMPING    = 0.85;
const CENTER_PULL= 0.01;

// ─── Force layout (simple spring) ───────────────────────────────────────────

function runForce(nodes: GraphNode[], edges: GraphEdge[], W: number, H: number) {
  const cx = W / 2;
  const cy = H / 2;

  for (const n of nodes) {
    n.vx = 0;
    n.vy = 0;
  }

  // Repulsion between all node pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x || 0.01;
      const dy = b.y - a.y || 0.01;
      const dist2 = dx * dx + dy * dy || 1;
      const force = REPULSION / dist2;
      const fx = force * (dx / Math.sqrt(dist2));
      const fy = force * (dy / Math.sqrt(dist2));
      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;
    }
  }

  // Attraction along edges
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const a = nodeMap.get(edge.source);
    const b = nodeMap.get(edge.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    a.vx += dx * ATTRACTION;
    a.vy += dy * ATTRACTION;
    b.vx -= dx * ATTRACTION;
    b.vy -= dy * ATTRACTION;
  }

  // Pull toward center
  for (const n of nodes) {
    n.vx += (cx - n.x) * CENTER_PULL;
    n.vy += (cy - n.y) * CENTER_PULL;
    n.vx *= DAMPING;
    n.vy *= DAMPING;
    n.x += n.vx;
    n.y += n.vy;
    n.x = Math.max(NODE_RADIUS + 4, Math.min(W - NODE_RADIUS - 4, n.x));
    n.y = Math.max(NODE_RADIUS + 4, Math.min(H - NODE_RADIUS - 4, n.y));
  }
}

// ─── Build graph data ────────────────────────────────────────────────────────

function buildGraph(rels: KnowledgeRelationship[], W: number, H: number) {
  const nodeSet = new Map<string, GraphNode>();

  function ensureNode(id: string, type: KnowledgeSourceType) {
    if (!nodeSet.has(id)) {
      nodeSet.set(id, {
        id,
        type,
        label: id.length > 16 ? id.slice(0, 14) + "…" : id,
        x: W / 2 + (Math.random() - 0.5) * W * 0.6,
        y: H / 2 + (Math.random() - 0.5) * H * 0.6,
        vx: 0,
        vy: 0,
      });
    }
  }

  const edges: GraphEdge[] = [];
  for (const r of rels) {
    ensureNode(r.source_id, r.source_type);
    ensureNode(r.target_id, r.target_type);
    edges.push({
      source: r.source_id,
      target: r.target_id,
      label: r.label ?? r.relationship_type,
    });
  }

  return { nodes: Array.from(nodeSet.values()), edges };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function KnowledgeGraphPage() {
  const [rels, setRels]         = useState<KnowledgeRelationship[]>([]);
  const [loading, setLoading]   = useState(true);
  const [nodes, setNodes]       = useState<GraphNode[]>([]);
  const [edges, setEdges]       = useState<GraphEdge[]>([]);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<KnowledgeSourceType | "all">("all");
  const [showAll, setShowAll]   = useState(false);
  const svgRef     = useRef<SVGSVGElement>(null);
  const animRef    = useRef<number>(0);
  const nodesRef   = useRef<GraphNode[]>([]);
  const W = 900;
  const H = 600;

  useEffect(() => {
    getAllKnowledgeRelationshipsAdmin(500).then((data) => {
      const verified = showAll ? data : data.filter((r) => r.is_verified);
      setRels(verified);
      const g = buildGraph(verified, W, H);
      setNodes(g.nodes);
      setEdges(g.edges);
      nodesRef.current = g.nodes;
      setLoading(false);
    });
  }, [showAll]);

  // Force simulation
  useEffect(() => {
    if (nodes.length === 0) return;
    nodesRef.current = nodes;
    let step = 0;
    const MAX_STEPS = 200;

    function tick() {
      if (step >= MAX_STEPS) return;
      step++;
      runForce(nodesRef.current, edges, W, H);
      setNodes([...nodesRef.current]);
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [edges]);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const visibleNodes = filterType === "all" ? nodes : nodes.filter((n) => n.type === filterType);
  const visibleIds   = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));

  const types = Array.from(new Set(nodes.map((n) => n.type))) as KnowledgeSourceType[];

  return (
    <div style={{ direction: "rtl", padding: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#065f46", marginBottom: "0.5rem" }}>
        الرسم البياني المعرفي
      </h1>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.25rem" }}>
        شبكة العلاقات المعرفية بين العلماء والدروس والكتب والفتاوى والفوائد.
        {rels.length > 0 ? ` (${rels.length} علاقة / ${nodes.length} عقدة)` : ""}
      </p>

      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        {(["all", ...types] as (KnowledgeSourceType | "all")[]).map((t) => (
          <button key={t} type="button" onClick={() => setFilterType(t)}
            style={{
              padding: "0.35rem 0.875rem", borderRadius: "999px", fontSize: "0.8125rem",
              border: "1px solid #d1d5db", cursor: "pointer", fontFamily: "inherit",
              background: filterType === t ? (t === "all" ? "#065f46" : TYPE_COLOR[t as KnowledgeSourceType]) : "#fff",
              color: filterType === t ? "#fff" : "#374151",
            }}>
            {t === "all" ? "الكل" : TYPE_LABEL_AR[t as KnowledgeSourceType]}
          </button>
        ))}
        <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", cursor: "pointer" }}>
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          عرض غير المحققة
        </label>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {types.map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: TYPE_COLOR[t], display: "inline-block" }} />
            {TYPE_LABEL_AR[t]}
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#6b7280", padding: "3rem" }}>جارٍ التحميل...</p>
      ) : nodes.length === 0 ? (
        <div style={{ border: "1px dashed #d1d5db", borderRadius: "0.5rem", padding: "3rem", textAlign: "center", color: "#6b7280" }}>
          <p style={{ marginBottom: "0.5rem" }}>لا توجد علاقات محققة بعد.</p>
          <p style={{ fontSize: "0.8125rem" }}>
            أضف علاقات من لوحة الإدارة ← الرسم البياني المعرفي، ثم وثّقها.
          </p>
        </div>
      ) : (
        <>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden", background: "#f9fafb" }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              style={{ width: "100%", maxHeight: "600px", display: "block" }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7"
                  refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                </marker>
              </defs>

              {/* Edges */}
              {visibleEdges.map((edge, i) => {
                const src = nodeMap.get(edge.source);
                const tgt = nodeMap.get(edge.target);
                if (!src || !tgt) return null;
                const mx = (src.x + tgt.x) / 2;
                const my = (src.y + tgt.y) / 2;
                return (
                  <g key={i}>
                    <line
                      x1={src.x} y1={src.y}
                      x2={tgt.x} y2={tgt.y}
                      stroke="#d1d5db" strokeWidth={1.5}
                      markerEnd="url(#arrowhead)"
                    />
                    <text x={mx} y={my - 4} textAnchor="middle"
                      fontSize="10" fill="#9ca3af" fontFamily="inherit">
                      {edge.label.length > 12 ? edge.label.slice(0, 10) + "…" : edge.label}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {visibleNodes.map((node) => {
                const isSelected = selected?.id === node.id;
                const color = TYPE_COLOR[node.type];
                return (
                  <g key={node.id} style={{ cursor: "pointer" }}
                    onClick={() => setSelected(isSelected ? null : node)}>
                    <circle
                      cx={node.x} cy={node.y}
                      r={NODE_RADIUS}
                      fill={isSelected ? color : `${color}22`}
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    <text
                      x={node.x} y={node.y + 4}
                      textAnchor="middle" fontSize="9"
                      fill={isSelected ? "#fff" : color}
                      fontFamily="inherit" fontWeight={isSelected ? 700 : 400}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{
              marginTop: "1rem", padding: "1rem 1.25rem",
              border: `2px solid ${TYPE_COLOR[selected.type]}`,
              borderRadius: "0.5rem", background: "#fff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{
                    fontSize: "0.7rem", background: `${TYPE_COLOR[selected.type]}22`,
                    color: TYPE_COLOR[selected.type], borderRadius: "4px", padding: "2px 8px",
                    fontWeight: 600,
                  }}>
                    {TYPE_LABEL_AR[selected.type]}
                  </span>
                  <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>
                    {selected.label}
                  </h3>
                  <code style={{ fontSize: "0.75rem", color: "#6b7280" }}>{selected.id}</code>
                </div>
                <button type="button" onClick={() => setSelected(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#6b7280" }}>
                  ×
                </button>
              </div>
              <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "#374151" }}>
                <strong>علاقاته:</strong>
                <ul style={{ margin: "0.5rem 0 0", paddingInlineStart: "1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {edges
                    .filter((e) => e.source === selected.id || e.target === selected.id)
                    .map((e, i) => {
                      const otherId = e.source === selected.id ? e.target : e.source;
                      const other = nodeMap.get(otherId);
                      const dir = e.source === selected.id ? "←" : "→";
                      return (
                        <li key={i} style={{ color: "#374151" }}>
                          {dir} {e.label}{other ? ` (${TYPE_LABEL_AR[other.type]}: ${other.label})` : ` (${otherId})`}
                        </li>
                      );
                    })}
                  {edges.filter((e) => e.source === selected.id || e.target === selected.id).length === 0 && (
                    <li style={{ color: "#9ca3af" }}>لا توجد علاقات مرئية</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#9ca3af" }}>
        جميع العلاقات المعروضة مُعتمدة من المسؤول. يمكن إضافة علاقات جديدة من لوحة الإدارة.
      </p>
    </div>
  );
}
