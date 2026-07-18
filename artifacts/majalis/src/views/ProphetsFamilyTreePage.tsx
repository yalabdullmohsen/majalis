import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { PROPHETS_LINEAGE, type LineageNode } from "@/lib/prophets-lineage";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// ── ثوابت التخطيط ──────────────────────────────────────────────────────────
const NODE_W  = 110;
const NODE_H  = 52;
const H_GAP   = 50;   // الفجوة الأفقية بين الأعمدة
const V_GAP   = 28;   // الفجوة الرأسية بين الإخوة
const EMERALD = "#28584D";
const ANCESTOR_CLR = "#68716D";

// ── حساب تخطيط الشجرة ─────────────────────────────────────────────────────

interface PlacedNode {
  node: LineageNode;
  x: number;
  y: number;
  parentId: string | null;
}

function layoutTree(
  node: LineageNode,
  depth: number,
  yStart: number,
  placed: PlacedNode[],
  parentId: string | null
): number {
  const children = node.children ?? [];
  let totalH = 0;

  if (children.length === 0) {
    const y = yStart;
    placed.push({ node, x: depth * (NODE_W + H_GAP), y, parentId });
    return NODE_H;
  }

  let childY = yStart;
  for (const child of children) {
    const used = layoutTree(child, depth + 1, childY, placed, node.id);
    totalH += used + V_GAP;
    childY += used + V_GAP;
  }
  totalH -= V_GAP;

  const firstChild = placed.find(p => p.parentId === node.id && p.node.id === children[0].id);
  const lastChild  = placed.find(p => p.parentId === node.id && p.node.id === children[children.length - 1].id);
  const midY = firstChild && lastChild
    ? (firstChild.y + lastChild.y) / 2
    : yStart;

  placed.push({ node, x: depth * (NODE_W + H_GAP), y: midY, parentId });
  return totalH;
}

// ── مكوّن العقدة ────────────────────────────────────────────────────────────

function NodeBox({ placed, onClick }: {
  placed: PlacedNode;
  onClick: (id: string) => void;
}) {
  const { node, x, y } = placed;
  const isAnc   = node.isAncestor;
  const isUlul  = node.isUlulAzm;
  const isLast  = node.id === "muhammad";
  const fill    = isLast ? EMERALD : isAnc ? ANCESTOR_CLR : "#FFFFFF";
  const stroke  = isUlul ? "#D97706" : isAnc ? "#929995" : EMERALD;
  const textClr = (isLast || isAnc) ? "#FFFFFF" : "#1F2937";
  const sw      = isUlul ? 2.5 : 1.5;
  const rx      = isLast ? 12 : 8;

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: node.slug ? "pointer" : "default" }}
      onClick={() => node.slug && onClick(node.id)}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && node.slug) onClick(node.id); }}
      role="button"
      tabIndex={node.slug ? 0 : -1}
      aria-label={node.name}
    >
      <rect
        width={NODE_W} height={NODE_H} rx={rx}
        fill={fill} stroke={stroke} strokeWidth={sw}
        filter={isUlul ? "url(#glow)" : undefined}
      />
      {isUlul && (
        <rect
          x={2} y={2} width={NODE_W - 4} height={NODE_H - 4}
          rx={rx - 2} fill="none" stroke="#F59E0B" strokeWidth={0.8} opacity={0.5}
        />
      )}
      <text
        x={NODE_W / 2} y={NODE_H / 2 - 6}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={isAnc ? 10 : 13} fontWeight={700}
        fontFamily="IBM Plex Sans Arabic, Noto Sans Arabic, sans-serif"
        fill={textClr}
      >
        {node.name}
      </text>
      {node.era && !isAnc && (
        <text
          x={NODE_W / 2} y={NODE_H / 2 + 11}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={8.5} fontFamily="IBM Plex Sans Arabic, Noto Sans Arabic, sans-serif"
          fill={isLast ? "rgba(255,255,255,0.8)" : "#929995"}
        >
          {node.era.slice(0, 20)}{node.era.length > 20 ? "…" : ""}
        </text>
      )}
      {isAnc && (
        <text
          x={NODE_W / 2} y={NODE_H / 2 + 10}
          textAnchor="middle" fontSize={8}
          fill="rgba(255,255,255,0.6)" fontFamily="IBM Plex Sans Arabic, Noto Sans Arabic, sans-serif"
        >
          ···
        </text>
      )}
    </g>
  );
}

// ── الصفحة الرئيسية ─────────────────────────────────────────────────────────

export default function ProphetsFamilyTreePage() {
  useEffect(() => {
    applyPageSeo({
      path: "/prophets/tree",
      title: "شجرة أنساب الأنبياء | المجلس العلمي",
      description: "رسم بياني تفاعلي لنسب الأنبياء الـ25 المذكورين في القرآن الكريم من آدم إلى محمد ﷺ",
      keywords: ["أنبياء", "شجرة نسب", "سيرة", "تاريخ إسلامي"],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "شجرة أنساب الأنبياء",
        description: "رسم بياني تفاعلي لنسب الأنبياء الـ25 المذكورين في القرآن الكريم.",
        url: "https://www.majlisilm.com/prophets/tree",
        inLanguage: "ar",
        publisher: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
      }],
    });
  }, []);

  // ── حساب المواقع ──────────────────────────────────────────────────────────
  const placed: PlacedNode[] = [];
  layoutTree(PROPHETS_LINEAGE, 0, 0, placed, null);

  const minX = Math.min(...placed.map(p => p.x));
  const maxX = Math.max(...placed.map(p => p.x)) + NODE_W;
  const minY = Math.min(...placed.map(p => p.y));
  const maxY = Math.max(...placed.map(p => p.y)) + NODE_H;
  const svgW = maxX - minX + 80;
  const svgH = maxY - minY + 80;

  // ── تحكم Zoom/Pan ──────────────────────────────────────────────────────────
  const [scale, setScale] = useState(0.75);
  const [pan, setPan]   = useState({ x: 40, y: 40 });
  const isDragging      = useRef(false);
  const dragStart       = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const [selected, setSelected] = useState<string | null>(null);

  const zoom = useCallback((dir: 1 | -1) => {
    setScale(s => Math.min(2, Math.max(0.3, s + dir * 0.15)));
  }, []);

  const reset = useCallback(() => { setScale(0.75); setPan({ x: 40, y: 40 }); }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current  = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  };
  const onMouseUp = () => { isDragging.current = false; };

  // لمس (Touch)
  const touchStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, px: pan.x, py: pan.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setPan({
      x: touchStart.current.px + (t.clientX - touchStart.current.x),
      y: touchStart.current.py + (t.clientY - touchStart.current.y),
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 1 : -1);
  };

  // العقدة المختارة
  const selectedNode = placed.find(p => p.node.id === selected)?.node;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F0F5F2", fontFamily: "IBM Plex Sans Arabic, Noto Sans Arabic, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg,#0c2318,#1a3d2b)",
        color: "#F7F4ED", padding: "1rem 1.25rem",
        display: "flex", alignItems: "center", gap: "1rem",
      }}>
        <Link href="/prophets" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.9rem" }}>
          ← الأنبياء
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>شجرة أنساب الأنبياء</h1>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
            ٢٥ نبياً من آدم إلى محمد ﷺ — اسحب للتنقل، اضغط على نبي للتفاصيل
          </p>
        </div>
        {/* أزرار التحكم */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {[
            { icon: <ZoomIn size={16}/>, fn: () => zoom(1),  title: "تكبير" },
            { icon: <ZoomOut size={16}/>, fn: () => zoom(-1), title: "تصغير" },
            { icon: <RotateCcw size={16}/>, fn: reset,         title: "إعادة تعيين" },
          ].map(({ icon, fn, title }) => (
            <button key={title} type="button" onClick={fn} aria-label={title} style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
              color: "#F7F4ED", borderRadius: "0.5rem", padding: "0.4rem 0.6rem",
              cursor: "pointer", display: "flex", alignItems: "center",
            }}>{icon}</button>
          ))}
        </div>
      </header>

      {/* أسطورة الألوان */}
      <div style={{
        display: "flex", gap: "1rem", flexWrap: "wrap",
        padding: "0.6rem 1.25rem", background: "#fff",
        borderBottom: "1px solid #E7E2D8", fontSize: "0.75rem",
      }}>
        {[
          { color: EMERALD,       label: "خاتم الأنبياء ﷺ" },
          { color: "#D97706",     label: "أولو العزم", border: true },
          { color: "#68716D",     label: "حلقة وصل" },
          { color: "#FFFFFF",     label: "سائر الأنبياء", border2: true },
        ].map(({ color, label, border, border2 }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{
              width: 14, height: 14, borderRadius: 4,
              background: color,
              border: border ? "2px solid #D97706" : border2 ? "1.5px solid #28584D" : "none",
            }}/>
            <span style={{ color: "#68716D" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Canvas. لوحة سحب/تحريك (pan) بالماوس واللمس فقط — نفس القيد المعماري
          الموثَّق سابقًا لـ MindMapCanvas: التحريك بالسحب مفهوم مرتبط بمؤشر/لمس
          جوهريًا، لا مكافئ مباشر له بلوحة المفاتيح. التكبير/التصغير (الوظيفة
          الأهم فعليًا) له بديل كامل بلوحة المفاتيح عبر زرّي "تكبير"/"تصغير"
          الظاهرين (button حقيقي)، فلا حظر فعلي للوصول للمحتوى. */}
      <div
        style={{
          overflow: "hidden", cursor: "grab", userSelect: "none",
          height: "calc(100vh - 130px)",
          position: "relative",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
        onWheel={onWheel}
      >
        <svg
          width={svgW * scale + 80}
          height={svgH * scale + 80}
          style={{ transform: `translate(${pan.x}px,${pan.y}px)`, display: "block" }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <g transform={`scale(${scale})`}>
            {/* خطوط التوصيل */}
            {placed.map((p) => {
              if (!p.parentId) return null;
              const parent = placed.find(pl => pl.node.id === p.parentId);
              if (!parent) return null;

              const x1 = parent.x + NODE_W;
              const y1 = parent.y + NODE_H / 2;
              const x2 = p.x;
              const y2 = p.y + NODE_H / 2;
              const mx = (x1 + x2) / 2;
              const isDash = p.node.generationsGap && p.node.generationsGap > 0;

              return (
                <path
                  key={`${p.parentId}-${p.node.id}`}
                  d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke={isDash ? "#9CA3AF" : "#28584D"}
                  strokeWidth={isDash ? 1 : 1.5}
                  strokeDasharray={isDash ? "5,4" : undefined}
                  opacity={0.6}
                />
              );
            })}

            {/* العقد */}
            {placed.map((p) => (
              <NodeBox
                key={p.node.id}
                placed={p}
                onClick={(id) => setSelected(s => s === id ? null : id)}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* بطاقة التفاصيل */}
      {selectedNode && !selectedNode.isAncestor && (
        <div style={{
          position: "fixed", bottom: "1rem", right: "1rem", left: "1rem",
          maxWidth: 420, margin: "0 auto",
          background: "#fff", borderRadius: "1rem",
          border: `2px solid ${EMERALD}`,
          padding: "1rem 1.25rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          zIndex: 100,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <h2 style={{ margin: 0, color: EMERALD, fontSize: "1.1rem", fontWeight: 800 }}>
              {selectedNode.name}
              {selectedNode.isUlulAzm && (
                <span style={{ fontSize: "0.7rem", marginRight: "0.5rem", background: "#FEF3C7", color: "#92400E", padding: "0.1rem 0.4rem", borderRadius: 4 }}>
                  أولو العزم
                </span>
              )}
            </h2>
            <button type="button" onClick={() => setSelected(null)} aria-label="إغلاق" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#929995" }}>×</button>
          </div>
          {selectedNode.era && (
            <p style={{ margin: "0.25rem 0", color: "#68716D", fontSize: "0.85rem" }}>
              <strong>الحقبة: </strong>{selectedNode.era}
            </p>
          )}
          {selectedNode.people && (
            <p style={{ margin: "0.25rem 0", color: "#68716D", fontSize: "0.85rem" }}>
              <strong>القوم أو المكان: </strong>{selectedNode.people}
            </p>
          )}
          {selectedNode.linkNote && (
            <p style={{ margin: "0.25rem 0", color: "#929995", fontSize: "0.8rem", fontStyle: "italic" }}>
              {selectedNode.linkNote}
            </p>
          )}
          {selectedNode.slug && selectedNode.id !== "muhammad" && (
            <Link
              href={`/prophets/${selectedNode.slug}`}
              style={{
                display: "inline-block", marginTop: "0.6rem",
                background: EMERALD, color: "#fff", textDecoration: "none",
                padding: "0.4rem 1rem", borderRadius: "0.5rem",
                fontSize: "0.82rem", fontWeight: 700,
              }}
            >
              تفاصيل {selectedNode.name}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
