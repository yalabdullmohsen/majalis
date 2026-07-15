/**
 * KnowledgeGraphPage، صفحة استكشاف الرسم البياني المعرفي الإسلامي
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
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

// ── Types ──────────────────────────────────────────────────────────────────

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

const OLD_TYPE_COLOR: Record<KnowledgeSourceType, string> = {
  scholar:  "#176B57",
  lesson:   "#0369a1",
  book:     "#176B57",
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

type DataSource = "new" | "old";
type Tab = "graph" | "explore";

export default function KnowledgeGraphPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("graph");

  useEffect(() => {
    applyPageSeo({
      path: "/knowledge-graph",
      title: "الرسم البياني المعرفي | المجلس العلمي",
      description: "استكشف العلاقات بين المفاهيم الإسلامية، رسم بياني تفاعلي يربط العلماء والكتب والمسائل الفقهية.",
      keywords: ["رسم بياني معرفي", "علاقات إسلامية", "استكشاف المعرفة", "خريطة علمية", "علم الشبكات"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "الرسم البياني المعرفي الإسلامي", url: "https://majlisilm.com/knowledge-graph", about: { "@type": "Thing", name: "شبكة المعرفة الإسلامية التفاعلية" } }],
    });
  }, []);
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

  const loadNew = useCallback(async () => {
    setLoading(true);
    const nodes = await fetchKnNodes(undefined, 120);
    if (nodes.length === 0) { setSource("old"); return; }
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
  }, [gEdges]);

  const handleTagSearch = useCallback(async () => {
    if (!searchTag.trim()) return;
    setTagLoading(true);
    const res = await fetchKnNodesByTag(searchTag.trim(), 30);
    setTagResults(res?.nodes ?? []);
    setTagLoading(false);
  }, [searchTag]);

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
    <div dir="rtl" className="kng-page">

      {/* Header */}
      <div className="kng-header">
        <h1 className="kng-title">الرسم البياني المعرفي الإسلامي</h1>
        <p className="kng-subtitle">
          شبكة دلالية تربط الآيات والأحاديث والفتاوى والعلماء والكتب والدروس.
          {nodeCount > 0 && ` ${nodeCount} عقدة · ${edgeCount} علاقة`}
        </p>
      </div>

      {/* Tabs */}
      <div className="kng-tabs" role="tablist" aria-label="أوضاع عرض الرسم البياني">
        {(["graph", "explore"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            role="tab"
            className={`kng-tab${tab === t ? " is-active" : ""}`}
            aria-selected={tab === t}
            id={`kng-tab-${t}`}
            aria-controls={`kng-panel-${t}`}
          >
            {t === "graph" ? "شبكة العلاقات" : "استكشاف الموضوعات"}
          </button>
        ))}

        <div className="kng-source-group">
          <span className="kng-source-label">المصدر:</span>
          {(["new", "old"] as DataSource[]).map((s) => (
            <button key={s} type="button" onClick={() => setSource(s)}
              className={`kng-source-btn${source === s ? " is-active" : ""}`}
            >
              {s === "new" ? "الجديد (kn_nodes)" : "القديم (relations)"}
            </button>
          ))}
        </div>
      </div>

      {/* ══ Graph Tab ══ */}
      {tab === "graph" && (
        <div role="tabpanel" id="kng-panel-graph" aria-labelledby="kng-tab-graph">
          {/* Filter chips */}
          <div className="kng-filter-chips">
            {(["all", ...allTypes]).map((t) => (
              <button key={t} type="button" onClick={() => setFilterType(t)}
                className={`kng-filter-chip${t !== "all" ? " kng-filter-chip--typed" : ""}${filterType === t ? " is-active" : ""} kng-nt--${t}`}
              >
                {t === "all" ? "الكل" : getTypeLabel(t)}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="kng-legend">
            {allTypes.map((t) => (
              <div key={t} className="kng-legend-item">
                <span className={`kng-legend-dot kng-nt--${t}`} />
                {getTypeLabel(t)}
              </div>
            ))}
          </div>

          {/* SVG Graph */}
          {loading ? (
            <div className="kng-loading">جارٍ تحميل الرسم البياني...</div>
          ) : gNodes.length === 0 ? (
            <div className="kng-empty">
              <p className="kng-empty__title">لا توجد بيانات بعد</p>
              <p className="kng-empty__desc">
                شغّل <code>knowledge_graph_islamic_v1.sql</code> و<code>knowledge_graph_islamic_seed_v1.sql</code> في Supabase، ثم أعد التحميل.
              </p>
            </div>
          ) : (
            <div className="kng-svg-wrap">
              <svg ref={svgRef} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="kng-svg" aria-label="الرسم البياني المعرفي الإسلامي">
                <defs>
                  <marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="var(--majalis-ink-soft, #4A4A4A)" opacity="0.5" />
                  </marker>
                  <filter id="kg-shadow">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodOpacity="0.15" />
                  </filter>
                </defs>

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
                        stroke="var(--majalis-line, rgba(0,0,0,0.1))" strokeWidth={Math.max(1, e.strength * 2.5)}
                        markerEnd="url(#arr)" opacity={0.7}
                      />
                      <text x={mx} y={my - 5} textAnchor="middle"
                        fontSize="9" fill="var(--majalis-ink-soft, #4A4A4A)" fontFamily="inherit" className="kng-svg-label">
                        {e.label.length > 10 ? e.label.slice(0, 8) + "…" : e.label}
                      </text>
                    </g>
                  );
                })}

                {visNodes.map((node) => {
                  const isSel    = selected?.id === node.id;
                  const color    = getColor(node.nodeType);
                  const isCenter = node.id === centerNodeId;
                  const r = isSel ? NODE_RADIUS + 5 : isCenter ? NODE_RADIUS + 3 : NODE_RADIUS;
                  return (
                    <g
                      key={node.id}
                      className="kng-svg-node"
                      tabIndex={0}
                      role="button"
                      aria-label={`${node.label} — ${getTypeLabel(node.nodeType)}`}
                      aria-pressed={isSel}
                      onClick={() => setSelected(isSel ? null : node)}
                      onKeyDown={(e) => e.key === "Enter" && setSelected(isSel ? null : node)}
                    >
                      <circle
                        cx={node.x} cy={node.y} r={r}
                        fill={isSel ? color : `${color}28`}
                        stroke={color}
                        strokeWidth={isSel ? 2.5 : isCenter ? 2 : 1.5}
                        filter={isSel ? "url(#kg-shadow)" : undefined}
                      />
                      {/* Specular highlight */}
                      {isSel && (
                        <ellipse
                          cx={node.x - r * 0.2} cy={node.y - r * 0.3}
                          rx={r * 0.4} ry={r * 0.22}
                          fill="rgba(255,255,255,0.18)"
                          style={{ pointerEvents: "none" }}
                        />
                      )}
                      <text
                        x={node.x} y={node.y + 4}
                        textAnchor="middle" fontSize={isSel ? "10" : "9"}
                        fill={isSel ? "#fff" : color}
                        fontFamily="inherit" fontWeight={isSel ? 700 : 500}
                        className="kng-svg-label"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Selected node panel */}
          {selected && (
            <div className={`kng-panel kng-nt--${selected.nodeType}`}>
              <div className="kng-panel__head">
                <div className="kng-panel__info">
                  <span className="kng-type-badge">
                    {getTypeLabel(selected.nodeType)}
                  </span>
                  <h3 className="kng-panel__title">{selected.label}</h3>
                </div>
                <div className="kng-panel__actions">
                  {source === "new" && (
                    <>
                      <select value={expandDepth} onChange={(e) => setExpandDepth(Number(e.target.value))} className="kng-expand-select" aria-label="عمق التوسيع">
                        <option value={1}>عمق 1</option>
                        <option value={2}>عمق 2</option>
                        <option value={3}>عمق 3</option>
                      </select>
                      <button type="button" onClick={() => expandFromNode(selected.id, expandDepth)} className="kng-expand-btn">
                        توسيع
                      </button>
                    </>
                  )}
                  {selected.href && (
                    <Link href={selected.href} className="kng-view-link">عرض المحتوى</Link>
                  )}
                  <button type="button" onClick={() => setSelected(null)} className="kng-close-btn" aria-label="إغلاق">×</button>
                </div>
              </div>

              <div className="kng-panel__rels">
                <strong className="kng-panel__rels-title">
                  علاقاته ({visEdges.filter(e => e.source === selected.id || e.target === selected.id).length}):
                </strong>
                <ul className="kng-panel__rel-list">
                  {visEdges
                    .filter((e) => e.source === selected.id || e.target === selected.id)
                    .slice(0, 8)
                    .map((e, i) => {
                      const otherId = e.source === selected.id ? e.target : e.source;
                      const other = nodeMap.get(otherId);
                      return (
                        <li key={i} className="kng-panel__rel-item">
                          {e.source === selected.id ? "←" : "→"}{" "}
                          <span className="kng-panel__rel-label">{e.label}</span>
                          {other ? ` · ${getTypeLabel(other.nodeType)}: ${other.label}` : ""}
                        </li>
                      );
                    })}
                  {visEdges.filter(e => e.source === selected.id || e.target === selected.id).length === 0 && (
                    <li className="kng-panel__rel-empty">لا توجد علاقات مرئية</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <p className="kng-note">
            جميع العلاقات المعروضة موثقة بمصدر معتمد. يمكن إضافة علاقات من لوحة الإدارة.
          </p>
        </div>
      )}

      {/* ══ Explore Tab ══ */}
      {tab === "explore" && (
        <div role="tabpanel" id="kng-panel-explore" aria-labelledby="kng-tab-explore" className="kng-explore">
          <div className="kng-explore__search-section">
            <h2 className="kng-explore__title">استكشاف الموضوعات</h2>
            <p className="kng-explore__desc">ابحث بوسم موضوعي (عقيدة، فقه، سيرة...) لاستكشاف العقد المرتبطة.</p>

            <div className="kng-search-bar">
              <input
                type="text"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTagSearch()}
                aria-label="مثال: عقيدة، صلاة، زكاة، السيرة" placeholder="مثال: عقيدة، صلاة، زكاة، السيرة..."
                className="kng-search-input"
              />
              <button type="button" onClick={handleTagSearch} disabled={tagLoading} className="kng-search-btn">
                {tagLoading ? "..." : "بحث"}
              </button>
            </div>
          </div>

          <div className="kng-suggest-tags">
            <p className="kng-suggest-tags__label">وسوم مقترحة:</p>
            <div className="kng-suggest-tags__chips">
              {["العقيدة", "الصلاة", "الزكاة", "الصوم", "الحج", "السيرة", "الأخلاق", "القرآن"].map((tag) => (
                <button key={tag} type="button" onClick={() => setSearchTag(tag)}
                  className={`kng-suggest-chip${searchTag === tag ? " is-active" : ""}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {tagResults.length > 0 && (
            <div className="kng-tag-results">
              <h3 className="kng-tag-results__title">
                {tagResults.length} عقدة مرتبطة بـ "{searchTag}"
              </h3>
              <div className="kng-tag-results__grid">
                {tagResults.map((node) => {
                  return (
                    <Link key={node.id} href={getNodeHref(node)} className={`kng-result-link kng-nt--${node.node_type}`}>
                      <div className="kng-result-card">
                        <span className="kng-result-badge">
                          {NODE_TYPE_LABEL[node.node_type as KnNodeType] ?? node.node_type}
                        </span>
                        <div className="kng-result-title">{node.title}</div>
                        {node.summary && (
                          <div className="kng-result-summary">{node.summary}</div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {tagResults.length === 0 && searchTag && !tagLoading && (
            <p className="kng-no-results">لا توجد نتائج للوسم "{searchTag}". جرّب وسماً آخر.</p>
          )}

          {!searchTag && (
            <div className="kng-type-browse">
              <h3 className="kng-type-browse__title">استعراض حسب النوع</h3>
              <div className="kng-type-browse__chips">
                {(Object.keys(NODE_TYPE_LABEL) as KnNodeType[]).map((t) => (
                  <button key={t} type="button"
                    onClick={() => navigate(`/knowledge-graph?type=${t}`)}
                    className={`kng-type-chip kng-nt--${t}`}
                  >
                    {NODE_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="twh-share">
        <ShareButtons title="الرسم البياني المعرفي الإسلامي — المجلس العلمي" url="https://majlisilm.com/knowledge-graph" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["aqeeda", "tarikh", "fiqh"]} title="اختبر معلوماتك في المعرفة الإسلامية" count={4} />
      </div>
    </div>
  );
}
