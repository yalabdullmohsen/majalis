"use client";

import { useCallback } from "react";
import { useLocation } from "wouter";
import { MindMapEdge, MINDMAP_TOKENS } from "@/components/mindmap";

type TreeNode = {
  slug: string;
  label: string;
  x: number;
  y: number;
  color: string;
  radius?: number;
};

type TreeEdge = {
  x1: number; y1: number;
  x2: number; y2: number;
  dashed?: boolean;
};

const W = 900;
const H = 760;
const R = 32;

// Branch colors from Mind Map Design System
const C = {
  root:        MINDMAP_TOKENS.branch[0],   // آدم / نوح — deep green
  patriarch:   MINDMAP_TOKENS.branch[1],   // إبراهيم — mid green
  ishmael:     MINDMAP_TOKENS.branch[3],   // الفرع الإسماعيلي — warm brown
  muhammad:    MINDMAP_TOKENS.gold,        // محمد ﷺ — muted gold
  israel:      MINDMAP_TOKENS.branch[4],   // الفرع الإسرائيلي — deep blue
  independent: MINDMAP_TOKENS.branch[5],   // أنبياء مستقلون — deep violet
};

const NODES: TreeNode[] = [
  // ── الجذر ────────────────────────────────────────────────────────────────
  { slug: "adam",      label: "آدم",        x: 450, y:  44, color: C.root,        radius: 36 },
  { slug: "idris",     label: "إدريس",       x: 200, y: 110, color: C.independent },
  { slug: "nuh",       label: "نوح",         x: 450, y: 130, color: C.root,        radius: 34 },

  // ── أنبياء مستقلون عن الخط الإبراهيمي ────────────────────────────────────
  { slug: "hud",       label: "هود",         x:  90, y: 230, color: C.independent },
  { slug: "salih",     label: "صالح",        x: 200, y: 230, color: C.independent },
  { slug: "yunus",     label: "يونس",        x: 310, y: 230, color: C.independent },
  { slug: "ayyub",     label: "أيوب",        x: 730, y: 330, color: C.independent },
  { slug: "dhul-kifl", label: "ذو الكفل",    x: 820, y: 330, color: C.independent },
  { slug: "shuayb",    label: "شعيب",        x: 820, y: 420, color: C.independent },

  // ── إبراهيم ─────────────────────────────────────────────────────────────
  { slug: "ibrahim",   label: "إبراهيم",     x: 450, y: 230, color: C.patriarch,   radius: 34 },
  { slug: "lut",       label: "لوط",         x: 580, y: 230, color: C.independent },

  // ── الفرع الإسماعيلي ─────────────────────────────────────────────────────
  { slug: "ismail",    label: "إسماعيل",     x: 260, y: 340, color: C.ishmael },

  // ── الفرع الإسرائيلي (إسحاق → يعقوب → ...) ──────────────────────────────
  { slug: "is-haq",    label: "إسحاق",       x: 580, y: 340, color: C.israel },
  { slug: "yaqub",     label: "يعقوب",       x: 580, y: 430, color: C.israel },
  { slug: "yusuf",     label: "يوسف",        x: 450, y: 520, color: C.israel },
  { slug: "musa",      label: "موسى",        x: 580, y: 520, color: C.israel,       radius: 34 },
  { slug: "harun",     label: "هارون",       x: 700, y: 520, color: C.israel },
  { slug: "ilyas",     label: "إلياس",       x: 450, y: 610, color: C.israel },
  { slug: "al-yasa",   label: "اليَسَع",      x: 560, y: 610, color: C.israel },
  { slug: "dawud",     label: "داود",        x: 660, y: 610, color: C.israel },
  { slug: "sulayman",  label: "سليمان",      x: 760, y: 610, color: C.israel },
  { slug: "zakariyya", label: "زكريا",       x: 560, y: 700, color: C.israel },
  { slug: "yahya",     label: "يحيى",        x: 660, y: 700, color: C.israel },
  { slug: "isa",       label: "عيسى",        x: 760, y: 700, color: C.israel,       radius: 34 },

  // ── محمد ﷺ ───────────────────────────────────────────────────────────────
  { slug: "muhammad",  label: "محمد ﷺ",      x: 260, y: 460, color: C.muhammad,    radius: 38 },
];

const EDGE_DEFS: [string, string, boolean?][] = [
  ["adam",     "idris"],
  ["adam",     "nuh",       true],
  ["nuh",      "hud",       true],
  ["nuh",      "salih",     true],
  ["nuh",      "yunus",     true],
  ["nuh",      "ibrahim",   true],
  ["ibrahim",  "lut"],
  ["ibrahim",  "ismail"],
  ["ibrahim",  "is-haq"],
  ["ismail",   "muhammad",  true],
  ["is-haq",   "yaqub"],
  ["yaqub",    "yusuf"],
  ["yaqub",    "musa"],
  ["yaqub",    "harun"],
  ["musa",     "ilyas",     true],
  ["musa",     "al-yasa",   true],
  ["musa",     "dawud",     true],
  ["dawud",    "sulayman"],
  ["musa",     "zakariyya", true],
  ["zakariyya","yahya"],
  ["zakariyya","isa",       true],
  ["ibrahim",  "ayyub",     true],
  ["ibrahim",  "dhul-kifl", true],
  ["ibrahim",  "shuayb",    true],
];

function nodeBySlug(slug: string): TreeNode | undefined {
  return NODES.find((n) => n.slug === slug);
}

function buildEdges(): TreeEdge[] {
  return EDGE_DEFS.flatMap(([a, b, dashed]) => {
    const na = nodeBySlug(a);
    const nb = nodeBySlug(b);
    if (!na || !nb) return [];
    return [{ x1: na.x, y1: na.y, x2: nb.x, y2: nb.y, dashed }];
  });
}

const EDGES = buildEdges();

const LEGEND = [
  { color: C.root,        label: "أجداد البشرية (آدم / نوح)" },
  { color: C.patriarch,   label: "إبراهيم عليه السلام" },
  { color: C.ishmael,     label: "الفرع الإسماعيلي" },
  { color: C.muhammad,    label: "محمد ﷺ" },
  { color: C.israel,      label: "الفرع الإسرائيلي (بنو إسرائيل)" },
  { color: C.independent, label: "أنبياء مستقلون" },
];

export function ProphetGenealogyTree() {
  const [, navigate] = useLocation();

  const handleClick = useCallback((slug: string) => {
    navigate(`/prophets/${slug}`);
  }, [navigate]);

  return (
    <div className="prophet-tree-wrap" dir="rtl">
      {/* Legend */}
      <div className="prophet-tree-legend">
        {LEGEND.map((l) => (
          <span key={l.color} className="prophet-tree-legend__item">
            <span className="prophet-tree-legend__dot" style={{ background: l.color }} aria-hidden="true" />
            {l.label}
          </span>
        ))}
        <span className="prophet-tree-legend__item">
          <svg width="28" height="10" aria-hidden="true">
            <line x1="0" y1="5" x2="28" y2="5" stroke="var(--mindmap-edge-dashed, #b8cabb)" strokeWidth="1.5" strokeDasharray="4 3"/>
          </svg>
          سلسلة مختصرة
        </span>
      </div>

      {/* SVG tree */}
      <div className="prophet-tree-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          role="img"
          aria-label="خارطة نسب الأنبياء — شجرة الأنبياء من آدم إلى محمد ﷺ"
          className="prophet-tree-svg"
        >
          {/* دائرة زخرفية للمحور المركزي */}
          <defs>
            <radialGradient id="node-glow-gold" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor={MINDMAP_TOKENS.goldLight} stopOpacity="1" />
              <stop offset="100%" stopColor={MINDMAP_TOKENS.gold} stopOpacity="1" />
            </radialGradient>
            <radialGradient id="node-glow-green" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor={MINDMAP_TOKENS.primaryLight} stopOpacity="1" />
              <stop offset="100%" stopColor={MINDMAP_TOKENS.primary} stopOpacity="1" />
            </radialGradient>
            <filter id="node-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Edges — behind nodes */}
          {EDGES.map((e, i) => (
            <MindMapEdge
              key={i}
              x1={e.x1} y1={e.y1}
              x2={e.x2} y2={e.y2}
              dashed={e.dashed}
            />
          ))}

          {/* Nodes */}
          {NODES.map((n) => {
            const r = n.radius ?? R;
            const isMuhammad = n.slug === "muhammad";
            const isRoot = n.slug === "adam" || n.slug === "nuh" || n.slug === "ibrahim";
            const gradientId = isMuhammad ? "url(#node-glow-gold)" : isRoot ? "url(#node-glow-green)" : undefined;

            return (
              <g
                key={n.slug}
                onClick={() => handleClick(n.slug)}
                role="button"
                aria-label={`نبي الله ${n.label} — انقر لعرض التفاصيل`}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleClick(n.slug)}
                className="prophet-tree-node"
              >
                {/* Outer glow ring for key figures */}
                {(isMuhammad || isRoot) && (
                  <circle
                    cx={n.x} cy={n.y} r={r + 7}
                    fill="none"
                    stroke={isMuhammad ? MINDMAP_TOKENS.gold : MINDMAP_TOKENS.primaryLight}
                    strokeWidth={isMuhammad ? 2.2 : 1.5}
                    strokeDasharray={isMuhammad ? "6 3" : "5 4"}
                    opacity={0.65}
                    aria-hidden="true"
                  />
                )}

                {/* Main circle */}
                <circle
                  cx={n.x} cy={n.y} r={r}
                  fill={gradientId ?? n.color}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={isMuhammad ? 2.5 : isRoot ? 2 : 1.6}
                  filter="url(#node-shadow)"
                  aria-hidden="true"
                />

                {/* Specular highlight for 3D depth */}
                <ellipse
                  cx={n.x - r * 0.2} cy={n.y - r * 0.3}
                  rx={r * 0.38} ry={r * 0.22}
                  fill="rgba(255,255,255,0.15)"
                  aria-hidden="true"
                  style={{ pointerEvents: "none" }}
                />

                {/* Label */}
                <text
                  x={n.x} y={n.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize={isMuhammad ? 10.5 : n.label.length > 5 ? 10 : 12}
                  fontWeight={800}
                  fontFamily="'Noto Sans Arabic', 'Cairo', Arial, sans-serif"
                  aria-hidden="true"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="prophet-tree-note">
        ⚠️ الخارطة تعليمية مبسّطة — الخطوط المتقطعة تعني وجود أجيال بين النبيين دون تفصيل. للتعمق راجع كتب التفسير المعتمدة.
      </p>
    </div>
  );
}
