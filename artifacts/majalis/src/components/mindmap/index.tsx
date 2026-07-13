/**
 * Mind Map Design System — Shared React Components
 * Islamic visual identity: deep green + muted gold on ivory parchment
 * RTL-first, WCAG 2.2 AA, mobile-first
 */

import { type ReactNode, forwardRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────

export interface MindMapNodeData {
  id: string;
  title: string;
  description?: string;
  type?: string;
  order?: number;
  level?: number;
  children?: MindMapNodeData[];
  metadata?: Record<string, unknown>;
  color?: string;
  href?: string;
}

export interface MindMapLegendItem {
  color: string;
  label: string;
  shape?: "circle" | "diamond" | "square";
}

// ── Design Tokens (JS mirror) ─────────────────────────────────────────────

export const MINDMAP_TOKENS = {
  primary:       "#1A3D2B",
  primaryMid:    "#1e5c3e",
  primaryLight:  "#2d7a55",
  gold:          "#B08934",
  goldLight:     "#c9a04e",
  surface:       "#faf8f2",
  surfaceAlt:    "#f3ede0",
  ink:           "#1c1810",
  inkSoft:       "#5a5040",
  inkMuted:      "#8a7d6a",
  line:          "#d6cdb8",
  edgeSolid:     "#8a9e8f",
  edgeDashed:    "#b8cabb",
  branch: [
    "#1A3D2B",  // 0 — root
    "#2E6B44",  // 1 — primary
    "#B08934",  // 2 — gold
    "#7C4A00",  // 3 — brown
    "#1A4A6B",  // 4 — blue
    "#5A2D82",  // 5 — violet
  ] as string[],
} as const;

// ── Root wrapper ──────────────────────────────────────────────────────────

interface MindMapRootProps {
  children: ReactNode;
  className?: string;
  dir?: "rtl" | "ltr";
  "aria-label"?: string;
}

export function MindMapRoot({ children, className = "", dir = "rtl", "aria-label": ariaLabel }: MindMapRootProps) {
  return (
    <div
      className={`mindmap-root ${className}`}
      dir={dir}
      role="region"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

// ── Controls bar ──────────────────────────────────────────────────────────

interface MindMapControlsProps {
  children: ReactNode;
  className?: string;
}

export function MindMapControls({ children, className = "" }: MindMapControlsProps) {
  return (
    <div className={`mindmap-controls ${className}`} role="toolbar" aria-label="أدوات الخريطة">
      {children}
    </div>
  );
}

interface MindMapControlBtnProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  title?: string;
  disabled?: boolean;
}

export function MindMapControlBtn({ active, onClick, children, title, disabled }: MindMapControlBtnProps) {
  return (
    <button
      type="button"
      className={`mindmap-controls__btn${active ? " is-active" : ""}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

// ── SVG connector primitives ──────────────────────────────────────────────

interface MindMapEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
  color?: string;
  width?: number;
  curved?: boolean;
}

export function MindMapEdge({ x1, y1, x2, y2, dashed, color, width = 1.8, curved }: MindMapEdgeProps) {
  const stroke = color ?? (dashed ? "var(--mindmap-edge-dashed)" : "var(--mindmap-edge-solid)");

  if (curved) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 20;
    return (
      <path
        d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
        fill="none"
        stroke={stroke}
        strokeWidth={dashed ? width * 0.75 : width}
        strokeDasharray={dashed ? "5 4" : undefined}
        strokeLinecap="round"
      />
    );
  }

  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={stroke}
      strokeWidth={dashed ? width * 0.75 : width}
      strokeDasharray={dashed ? "5 4" : undefined}
      strokeLinecap="round"
    />
  );
}

// ── SVG node ─────────────────────────────────────────────────────────────

interface MindMapSvgNodeProps {
  x: number;
  y: number;
  r?: number;
  fill?: string;
  label: string;
  fontSize?: number;
  isRoot?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  ariaLabel?: string;
  tabIndex?: number;
  className?: string;
}

export const MindMapSvgNode = forwardRef<SVGGElement, MindMapSvgNodeProps>(function MindMapSvgNode(
  { x, y, r = 32, fill = MINDMAP_TOKENS.primary, label, fontSize, isRoot, isHighlighted, onClick, onKeyDown, ariaLabel, tabIndex = 0, className = "" },
  ref
) {
  const textSize = fontSize ?? (label.length > 6 ? 10 : 12);

  return (
    <g
      ref={ref}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role="button"
      aria-label={ariaLabel ?? label}
      tabIndex={tabIndex}
      className={`prophet-tree-node ${className}`}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Glow ring for highlighted/root nodes */}
      {(isRoot || isHighlighted) && (
        <circle
          cx={x} cy={y} r={r + 7}
          fill="none"
          stroke={MINDMAP_TOKENS.gold}
          strokeWidth={isRoot ? 2.5 : 1.5}
          strokeDasharray={isRoot ? "6 3" : "4 3"}
          opacity={0.7}
        />
      )}
      {/* Main circle with subtle gradient-like depth */}
      <circle
        cx={x} cy={y} r={r}
        fill={fill}
        stroke="#fff"
        strokeWidth={isRoot ? 2.5 : isHighlighted ? 2 : 1.8}
        style={{ filter: isHighlighted ? `drop-shadow(0 2px 6px ${fill}88)` : undefined }}
      />
      {/* Inner highlight for depth */}
      <ellipse
        cx={x - r * 0.2} cy={y - r * 0.3}
        rx={r * 0.4} ry={r * 0.25}
        fill="rgba(255,255,255,0.12)"
        style={{ pointerEvents: "none" }}
      />
      <text
        x={x} y={y + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={textSize}
        fontWeight={800}
        fontFamily={MINDMAP_TOKENS.branch[0] === fill ? "inherit" : "var(--mindmap-font, 'Noto Sans Arabic', Arial)"}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {label}
      </text>
    </g>
  );
});

// ── SVG Legend ────────────────────────────────────────────────────────────

interface MindMapSvgLegendProps {
  items: MindMapLegendItem[];
  x?: number;
  y?: number;
}

export function MindMapSvgLegend({ items, x = 10, y = 10 }: MindMapSvgLegendProps) {
  return (
    <g transform={`translate(${x}, ${y})`} role="list" aria-label="مفتاح الألوان">
      {items.map((item, i) => (
        <g key={item.color} transform={`translate(0, ${i * 20})`} role="listitem">
          <circle cx={6} cy={6} r={5} fill={item.color} />
          <text x={16} y={10} fontSize={10} fill="var(--mindmap-ink-soft)" fontFamily="var(--mindmap-font)">
            {item.label}
          </text>
        </g>
      ))}
    </g>
  );
}

// ── HTML Legend ───────────────────────────────────────────────────────────

interface MindMapLegendProps {
  items: MindMapLegendItem[];
  className?: string;
}

export function MindMapLegend({ items, className = "" }: MindMapLegendProps) {
  return (
    <div className={`mindmap-legend ${className}`} role="list" aria-label="مفتاح الألوان">
      {items.map((item) => (
        <span key={item.label} className="mindmap-legend__item" role="listitem">
          <span className="mindmap-legend__dot" style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// ── Scrollable SVG wrapper ────────────────────────────────────────────────

interface MindMapScrollContainerProps {
  children: ReactNode;
  className?: string;
  minWidth?: number;
}

export function MindMapScrollContainer({ children, className = "", minWidth }: MindMapScrollContainerProps) {
  return (
    <div className={`prophet-tree-scroll ${className}`} role="img" aria-label="خريطة ذهنية تفاعلية">
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}
