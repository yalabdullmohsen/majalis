/**
 * KnowledgeGraphPage — صفحة استكشاف الرسم البياني المعرفي الإسلامي
 *
 * يدعم مصدرين:
 *   1. النظام الجديد (kn_nodes / kn_edges) عبر /api/knowledge-graph/*
 *   2. النظام القديم (knowledge_relationships) عبر Supabase client
 *
 * طريقة العرض:
 *   - شبكة SVG تفاعلية بمحاكاة قوة (force-directed)
 *   - عند اختيار عقدة → توسيع الرسم منها بعمق إضافي
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  fetchKnNodes,
  fetchKnSubgraph,
  fetchKnNodesByTag,
  NODE_TYPE_COLOR,
  NODE_TYPE_LABEL,
  REL_TYPE_LABEL,
  getNodeHref,
  type KnNode,
  type KnEdge,
  type KnNodeType,
} from "@/lib/knowledge-graph-service";
import {
  getAllKnowledgeRelationshipsAdmin,
  type KnowledgeRelationship,
  type KnowledgeSourceType,
} from "@/lib/supabase";
import { C } from "@/lib/theme";

// ── Types للرسم ───────────────────────────────────────────────────────────

type GraphNode = {
  id: string;
  label: string;
  nodeType: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  href?: string;
  referenceId?: string | null;
};

type GraphEdge = {
  source: string;
  target: string;
  label: string;
  strength: number;
};

// ── Constants ─────────────────────────────────────────────────────────────

const NODE_RADIUS = 26;
const REPULSION   = 5000;
const ATTRACTION  = 0.025;
const DAMPING     = 0.82;
const CENTER_PULL = 0.008;
const MAX_STEPS   = 180;
const SVG_W       = 960;
const SVG_H       = 580;

// الألوان للنظام القديم
const OLD_TYPE_COLOR: Record<KnowledgeSourceType, string> = {
  scholar:  "#b45309",
  lesson:   "#0369a1",
  book:     "#92400e",
  fatwa:    "#7c3aed",
  fawaid:   "#047857",
  question: "#6b7280",
};

const OLD_TYPE_LABEL: Record<KnowledgeSourceType, string> = {
  scholar:  "عالم",
  lesson:   "درس",
  book:     "كتاب",
  fatwa:    "فتوى",
  fawaid:   "فائدة",
  question: "سؤال",
};

// ── Force simulation ──────────────────────────────────────────────────────

function runForce(nodes: GraphNode[], edges: GraphEdge[]) {
  const cx = SVG_W / 2;
  const cy = SVG_H / 2;

  for (const n of nodes) { n.vx = 0; n.vy = 0; }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x || 0.01;
      const dy = b.y - a.y || 0.01;
      const d2 = dx * dx + dy * dy || 1;
      const dist = Math.sqrt(d2);
      const force = REPULSION / d2;
      const fx = force * dx / dist;
      const fy = force * dy / dist;
      a.vx -= fx; a.vy -= fy;
      b.vx += fx; b.vy += fy;
    }
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) {
    const a = nodeMap.get(e.source);
    const b = nodeMap.get(e.target);
    if (!a || !b) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const pull = ATTRACTION * (e.strength ?? 0.7);
    a.vx += dx * pull; a.vy += dy * pull;
    b.vx -= dx * pull; b.vy -= dy * pull;
  }

  for (const n of nodes) {
    n.vx += (cx - n.x) * CENTER_PULL;
    n.vy += (cy - n.y) * CENTER_PULL;
    n.vx *= DAMPING; n.vy *= DAMPING;
    n.x += n.vx; n.y += n.vy;
    n.x = Math.max(NODE_RADIUS + 8, Math.min(SVG_W - NODE_RADIUS - 8, n.x));
    n.y = Math.max(NODE_RADIUS + 8, Math.min(SVG_H - NODE_RADIUS - 8, n.y));
  }
}

// ── بناء الرسم من المصدر الجديد ──────────────────────────────────────────

function buildNewGraph(nodes: KnNode[], edges: KnEdge[]): { gNodes: GraphNode[]; gEdges: GraphEdge[] } {
  const gNodes: GraphNode[] = nodes.map((n) => ({
    id: n.id,
    label: n.title.length > 18 ? n.title.slice(0, 16) + "…" : n.title,
    nodeType: n.node_type,
    x: SVG_W / 2 + (Math.random() - 0.5) * SVG_W * 0.5,
    y: SVG_H / 2 + (Math.random() - 0.5) * SVG_H * 0.5,
    vx: 0, vy: 0,
    href: getNodeHref(n),
    referenceId: n.reference_id,
  }));

  const gEdges: GraphEdge[] = edges.map((e) => ({
    source: e.source_id ?? e.source?.id ?? "",
    target: e.target_id ?? e.target?.id ?? "",
    label: REL_TYPE_LABEL[e.relationship_type] ?? e.relationship_type,
    strength: e.strength ?? 0.7,
  })).filter((e) => e.source && e.target);

  return { gNodes, gEdges };
}

// ── بناء الرسم من المصدر القديم ─────────────────────────────────────────

function buildOldGraph(rels: KnowledgeRelationship[]): { gNodes: GraphNode[]; gEdges: GraphEdge[] } {
  const nodeSet = new Map<string, GraphNode>();

  function ensure(id: string, type: string) {
    if (!nodeSet.has(id)) {
      nodeSet.set(id, {
        id, label: id.length > 18 ? id.slice(0, 16) + "…" : id,
        nodeType: type,
        x: SVG_W / 2 + (Math.random() - 0.5) * SVG_W * 0.5,
        y: SVG_H / 2 + (Math.random() - 0.5) * SVG_H * 0.5,
        vx: 0, vy: 0,
      });
    }
  }

  const gEdges: GraphEdge[] = [];
  for (const r of rels) {
    ensure(r.source_id, r.source_type);
    ensure(r.target_id, r.target_type);
    gEdges.push({ source: r.source_id, target: r.target_id, label: r.label ?? r.relationship_type, strength: 0.7 });
  }

  return { gNodes: Array.from(nodeSet.values()), gEdges };
}

// ── الصفحة الرئيسية ───────────────────────────────────────────────────────

type DataSource = "new" | "old";
type Tab = "graph" | "explore";

export default function KnowledgeGraphPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("graph");
  const [source, setSource] = useState<DataSource>("new");
  const [loading, setLoading] = useState(true);
  const [gNodes, setGNodes] = useState<GraphNode[]>([]);
  const [gEdges, setGEdges] = useState<GraphEdge[]>([]);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTag, setSearchTag] = useState("");
  const [tagResults, setTagResults] = useState<KnNode[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [expandDepth, setExpandDepth] = useState(1);
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  const nodesRef = useRef<GraphNode[]>([]);
  const animRef  = useRef<number>(0);
  const svgRef   = useRef<SVGSVGElement>(null);

  // ── تحميل البيانات ─────────────────────────────────────────────────────

  const loadNew = useCallback(async () => {
    setLoading(true);
    const nodes = await fetchKnNodes(undefined, 120);
    if (nodes.length === 0) {
      // fallback إلى النظام القديم
      setSource("old");
      return;
    }
    // نحتاج edges — نأخذ العقدة الأولى كمركز
    if (nodes.length > 0 && !centerNodeId) {
      const sub = await fetchKnSubgraph(nodes[0].id, 2);
      if (sub) {
        const { gNodes: gn, gEdges: ge } = buildNewGraph(sub.nodes, sub.edges);
        setGNodes(gn); setGEdges(ge);
        setNodeCount(gn.length); setEdgeCount(ge.length);
        nodesRef.current = gn;
        setLoading(false);
        return;
      }
    }
    const { gNodes: gn, gEdges: ge } = buildNewGraph(nodes, []);
    setGNodes(gn); setGEdges(ge);
    setNodeCount(gn.length); setEdgeCount(0);
    nodesRef.current = gn;
    setLoading(false);
  }, [centerNodeId]);

  const loadOld = useCallback(async () => {
    setLoading(true);
    const rels = await getAllKnowledgeRelationshipsAdmin(400);
    const verified = rels.filter((r) => r.is_verified);
    const { gNodes: gn, gEdges: ge } = buildOldGraph(verified);
    setGNodes(gn); setGEdges(ge);
    setNodeCount(gn.length); setEdgeCount(ge.length);
    nodesRef.current = gn;
    setLoading(false);
  }, []);

  useEffect(() => {
    if (source === "new") loadNew();
    else loadOld();
  }, [source, loadNew, loadOld]);

  // توسيع من عقدة محددة
  const expandFromNode = useCallback(async (nodeId: string, depth: number) => {
    if (source !== "new") return;
    setLoading(true);
    const sub = await fetchKnSubgraph(nodeId, depth);
    if (sub) {
      const { gNodes: gn, gEdges: ge } = buildNewGraph(sub.nodes, sub.edges);
      setGNodes(gn); setGEdges(ge);
      setNodeCount(gn.length); setEdgeCount(ge.length);
      nodesRef.current = gn;
      setCenterNodeId(nodeId);
    }
    setLoading(false);
  }, [source]);

  // ── محاكاة القوة ──────────────────────────────────────────────────────

  useEffect(() => {
    if (gNodes.length === 0) return;
    nodesRef.current = [...gNodes];
    let step = 0;
    cancelAnimationFrame(animRef.current);

    function tick() {
      if (step >= MAX_STEPS) return;
      step++;
      runForce(nodesRef.current, gEdges);
      setGNodes([...nodesRef.current]);
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [gEdges]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── البحث بالوسم ─────────────────────────────────────────────────────

  const handleTagSearch = useCallback(async () => {
    if (!searchTag.trim()) return;
    setTagLoading(true);
    const res = await fetchKnNodesByTag(searchTag.trim(), 30);
    setTagResults(res?.nodes ?? []);
    setTagLoading(false);
  }, [searchTag]);

  // ── الرسم المرئي ─────────────────────────────────────────────────────

  const nodeMap  = new Map(gNodes.map((n) => [n.id, n]));
  const allTypes = Array.from(new Set(gNodes.map((n) => n.nodeType)));
  const visNodes = filterType === "all" ? gNodes : gNodes.filter((n) => n.nodeType === filterType);
  const visIds   = new Set(visNodes.map((n) => n.id));
  const visEdges = gEdges.filter((e) => visIds.has(e.source) && visIds.has(e.target));

  function getColor(nodeType: string): string {
    if (source === "new") return NODE_TYPE_COLOR[nodeType as KnNodeType] ?? "#6b7280";
    return OLD_TYPE_COLOR[nodeType as KnowledgeSourceType] ?? "#6b7280";
  }

  function getTypeLabel(nodeType: string): string {
    if (source === "new") return NODE_TYPE_LABEL[nodeType as KnNodeType] ?? nodeType;
    return OLD_TYPE_LABEL[nodeType as KnowledgeSourceType] ?? nodeType;
  }

  return (
    <div dir="rtl" style={{ padding: "1.25rem", maxWidth: "1000px", margin: "0 auto" }}>

      {/* ─ Header ─ */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "0.25rem" }}>
          الرسم البياني المعرفي الإسلامي
        </h1>
        <p style={{ fontSize: "0.875rem", color: C.inkSoft }}>
          شبكة دلالية تربط الآيات والأحاديث والفتاوى والعلماء والكتب والدروس.
          {nodeCount > 0 && ` ${nodeCount} عقدة · ${edgeCount} علاقة`}
        </p>
      </div>

      {/* ─ Tabs ─ */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: `1px solid ${C.line}` }}>
        {(["graph", "explore"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{
              padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontFamily: "inherit",
              border: "none", cursor: "pointer",
              borderBottom: tab === t ? `2px solid ${C.emeraldDeep}` : "2px solid transparent",
              background: "transparent", fontWeight: tab === t ? 700 : 400,
              color: tab === t ? C.emeraldDeep : C.inkSoft,
            }}
          >
            {t === "graph" ? "شبكة العلاقات" : "استكشاف الموضوعات"}
          </button>
        ))}

        {/* مصدر البيانات */}
        <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: C.inkSoft }}>المصدر:</span>
          {(["new", "old"] as DataSource[]).map((s) => (
            <button key={s} type="button" onClick={() => setSource(s)}
              style={{
                padding: "0.25rem 0.75rem", fontSize: "0.78rem", borderRadius: "999px",
                border: `1px solid ${C.line}`, cursor: "pointer", fontFamily: "inherit",
                background: source === s ? C.emeraldDeep : "transparent",
                color: source === s ? "#fff" : C.inkSoft,
              }}
            >
              {s === "new" ? "الجديد (kn_nodes)" : "القديم (relations)"}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ تبويب: الشبكة ══════════════════════════════════════════ */}
      {tab === "graph" && (
        <>
          {/* فلاتر */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" }}>
            {(["all", ...allTypes]).map((t) => (
              <button key={t} type="button" onClick={() => setFilterType(t)}
                style={{
                  padding: "0.3rem 0.875rem", borderRadius: "999px", fontSize: "0.8rem",
                  border: `1px solid ${C.line}`, cursor: "pointer", fontFamily: "inherit",
                  background: filterType === t ? (t === "all" ? C.emeraldDeep : getColor(t)) : "transparent",
                  color: filterType === t ? "#fff" : C.inkSoft,
                }}
              >
                {t === "all" ? "الكل" : getTypeLabel(t)}
              </button>
            ))}
          </div>

          {/* legend */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            {allTypes.map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: getColor(t), display: "inline-block" }} />
                {getTypeLabel(t)}
              </div>
            ))}
          </div>

          {/* SVG */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem", color: C.inkSoft }}>جارٍ تحميل الرسم البياني...</div>
          ) : gNodes.length === 0 ? (
            <div style={{
              border: `1px dashed ${C.line}`, borderRadius: "0.75rem",
              padding: "3rem", textAlign: "center", color: C.inkSoft,
            }}>
              <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>لا توجد بيانات بعد</p>
              <p style={{ fontSize: "0.85rem" }}>
                شغّل <code>knowledge_graph_islamic_v1.sql</code> و<code>knowledge_graph_islamic_seed_v1.sql</code> في Supabase، ثم أعد التحميل.
              </p>
            </div>
          ) : (
            <div style={{ border: `1px solid ${C.line}`, borderRadius: "0.75rem", overflow: "hidden", background: "#f9fafb" }}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                style={{ width: "100%", maxHeight: "580px", display: "block" }}
              >
                <defs>
                  <marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
                  </marker>
                </defs>

                {/* الحواف */}
                {visEdges.map((e, i) => {
                  const src = nodeMap.get(e.source);
                  const tgt = nodeMap.get(e.target);
                  if (!src || !tgt) return null;
                  const mx = (src.x + tgt.x) / 2;
                  const my = (src.y + tgt.y) / 2;
                  return (
                    <g key={i}>
                      <line
                        x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                        stroke="#d1d5db" strokeWidth={Math.max(1, e.strength * 2.5)}
                        markerEnd="url(#arr)" opacity={0.7}
                      />
                      <text x={mx} y={my - 5} textAnchor="middle"
                        fontSize="9" fill="#9ca3af" fontFamily="inherit" style={{ pointerEvents: "none" }}>
                        {e.label.length > 10 ? e.label.slice(0, 8) + "…" : e.label}
                      </text>
                    </g>
                  );
                })}

                {/* العقد */}
                {visNodes.map((node) => {
                  const isSel  = selected?.id === node.id;
                  const color  = getColor(node.nodeType);
                  const isCenter = node.id === centerNodeId;
                  return (
                    <g key={node.id} style={{ cursor: "pointer" }}
                      onClick={() => setSelected(isSel ? null : node)}>
                      <circle
                        cx={node.x} cy={node.y}
                        r={isSel ? NODE_RADIUS + 4 : (isCenter ? NODE_RADIUS + 2 : NODE_RADIUS)}
                        fill={isSel ? color : `${color}22`}
                        stroke={color}
                        strokeWidth={isSel ? 3 : (isCenter ? 2.5 : 1.5)}
                      />
                      <text
                        x={node.x} y={node.y + 4}
                        textAnchor="middle" fontSize={isSel ? "10" : "9"}
                        fill={isSel ? "#fff" : color}
                        fontFamily="inherit" fontWeight={isSel ? 700 : 500}
                        style={{ pointerEvents: "none" }}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* لوحة التفاصيل */}
          {selected && (
            <div style={{
              marginTop: "1rem", padding: "1rem 1.25rem",
              border: `2px solid ${getColor(selected.nodeType)}`,
              borderRadius: "0.75rem", background: "#fff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: "0.7rem", background: `${getColor(selected.nodeType)}18`,
                    color: getColor(selected.nodeType), borderRadius: "4px", padding: "2px 8px", fontWeight: 700,
                  }}>
                    {getTypeLabel(selected.nodeType)}
                  </span>
                  <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>
                    {selected.label}
                  </h3>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                  {/* توسيع الرسم من هذه العقدة */}
                  {source === "new" && (
                    <>
                      <select
                        value={expandDepth}
                        onChange={(e) => setExpandDepth(Number(e.target.value))}
                        style={{
                          fontSize: "0.8rem", padding: "0.25rem 0.5rem",
                          border: `1px solid ${C.line}`, borderRadius: "4px",
                          fontFamily: "inherit",
                        }}
                      >
                        <option value={1}>عمق 1</option>
                        <option value={2}>عمق 2</option>
                        <option value={3}>عمق 3</option>
                      </select>
                      <button type="button"
                        onClick={() => expandFromNode(selected.id, expandDepth)}
                        style={{
                          padding: "0.35rem 0.75rem", fontSize: "0.8rem",
                          background: C.emeraldDeep, color: "#fff",
                          border: "none", borderRadius: "4px", cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        توسيع
                      </button>
                    </>
                  )}
                  {selected.href && (
                    <Link href={selected.href}
                      style={{
                        padding: "0.35rem 0.75rem", fontSize: "0.8rem",
                        background: "#f3f4f6", color: C.ink,
                        borderRadius: "4px", textDecoration: "none",
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      عرض المحتوى
                    </Link>
                  )}
                  <button type="button" onClick={() => setSelected(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: C.inkSoft }}>
                    ×
                  </button>
                </div>
              </div>

              {/* العلاقات */}
              <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem" }}>
                <strong style={{ color: C.ink }}>علاقاته ({visEdges.filter(e => e.source === selected.id || e.target === selected.id).length}):</strong>
                <ul style={{ margin: "0.5rem 0 0", paddingInlineStart: "1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {visEdges
                    .filter((e) => e.source === selected.id || e.target === selected.id)
                    .slice(0, 8)
                    .map((e, i) => {
                      const otherId = e.source === selected.id ? e.target : e.source;
                      const other = nodeMap.get(otherId);
                      return (
                        <li key={i} style={{ color: C.ink }}>
                          {e.source === selected.id ? "←" : "→"}{" "}
                          <span style={{ fontWeight: 600 }}>{e.label}</span>
                          {other ? ` · ${getTypeLabel(other.nodeType)}: ${other.label}` : ""}
                        </li>
                      );
                    })}
                  {visEdges.filter(e => e.source === selected.id || e.target === selected.id).length === 0 && (
                    <li style={{ color: C.inkSoft }}>لا توجد علاقات مرئية</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: C.inkSoft }}>
            جميع العلاقات المعروضة موثقة بمصدر معتمد. يمكن إضافة علاقات من لوحة الإدارة.
          </p>
        </>
      )}

      {/* ═══════ تبويب: الاستكشاف ══════════════════════════════════════ */}
      {tab === "explore" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.ink, marginBottom: "0.5rem" }}>
              استكشاف الموضوعات
            </h2>
            <p style={{ fontSize: "0.875rem", color: C.inkSoft, marginBottom: "1rem" }}>
              ابحث بوسم موضوعي (عقيدة، فقه، سيرة...) لاستكشاف العقد المرتبطة.
            </p>

            {/* شريط البحث */}
            <div style={{ display: "flex", gap: "0.5rem", maxWidth: "500px" }}>
              <input
                type="text"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTagSearch()}
                placeholder="مثال: عقيدة، صلاة، زكاة، السيرة..."
                style={{
                  flex: 1, padding: "0.6rem 1rem", fontSize: "0.9rem",
                  border: `1px solid ${C.line}`, borderRadius: "0.5rem",
                  fontFamily: "inherit", direction: "rtl",
                  outline: "none",
                }}
              />
              <button type="button" onClick={handleTagSearch}
                disabled={tagLoading}
                style={{
                  padding: "0.6rem 1.25rem", fontSize: "0.9rem",
                  background: C.emeraldDeep, color: "#fff",
                  border: "none", borderRadius: "0.5rem",
                  cursor: tagLoading ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {tagLoading ? "..." : "بحث"}
              </button>
            </div>
          </div>

          {/* وسوم مقترحة */}
          <div style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontSize: "0.8rem", color: C.inkSoft, marginBottom: "0.5rem" }}>وسوم مقترحة:</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["العقيدة", "الصلاة", "الزكاة", "الصوم", "الحج", "السيرة", "الأخلاق", "القرآن"].map((tag) => (
                <button key={tag} type="button"
                  onClick={() => { setSearchTag(tag); }}
                  style={{
                    padding: "0.3rem 0.875rem", borderRadius: "999px",
                    fontSize: "0.8rem", border: `1px solid ${C.line}`,
                    background: searchTag === tag ? C.emeraldDeep : "transparent",
                    color: searchTag === tag ? "#fff" : C.inkSoft,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* نتائج البحث */}
          {tagResults.length > 0 && (
            <div>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, marginBottom: "0.75rem" }}>
                {tagResults.length} عقدة مرتبطة بـ "{searchTag}"
              </h3>
              <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {tagResults.map((node) => {
                  const color = NODE_TYPE_COLOR[node.node_type as KnNodeType] ?? "#6b7280";
                  return (
                    <Link key={node.id} href={getNodeHref(node)} style={{ textDecoration: "none" }}>
                      <div style={{
                        padding: "0.875rem 1rem", borderRadius: "0.5rem",
                        border: `1px solid ${C.line}`, background: "#fff",
                        transition: "border-color 0.15s",
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}
                      >
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 700,
                          background: `${color}18`, color,
                          borderRadius: "4px", padding: "2px 6px",
                        }}>
                          {NODE_TYPE_LABEL[node.node_type as KnNodeType] ?? node.node_type}
                        </span>
                        <div style={{ marginTop: "0.4rem", fontWeight: 600, fontSize: "0.875rem", color: C.ink }}>
                          {node.title}
                        </div>
                        {node.summary && (
                          <div style={{
                            fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.25rem",
                            overflow: "hidden", display: "-webkit-box",
                            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          }}>
                            {node.summary}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {tagResults.length === 0 && searchTag && !tagLoading && (
            <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>
              لا توجد نتائج للوسم "{searchTag}". جرّب وسماً آخر.
            </p>
          )}

          {/* عرض العقد حسب النوع */}
          {!searchTag && (
            <div>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, marginBottom: "0.75rem" }}>
                استعراض حسب النوع
              </h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {(Object.keys(NODE_TYPE_LABEL) as KnNodeType[]).map((t) => (
                  <button key={t} type="button"
                    onClick={() => navigate(`/knowledge-graph?type=${t}`)}
                    style={{
                      padding: "0.5rem 1rem", borderRadius: "0.5rem",
                      border: `1px solid ${NODE_TYPE_COLOR[t]}`,
                      background: `${NODE_TYPE_COLOR[t]}10`,
                      color: NODE_TYPE_COLOR[t],
                      cursor: "pointer", fontFamily: "inherit",
                      fontSize: "0.875rem", fontWeight: 600,
                    }}
                  >
                    {NODE_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
