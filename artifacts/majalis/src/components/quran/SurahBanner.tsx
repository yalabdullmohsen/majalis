/**
 * شارة سورة فاخرة هادئة (مرجع wing-refined):
 * إطار ذهبي مزدوج · جناحان بميدالية بتلات + لوالب · لوحة عاجية وسطى.
 */
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { MUSHAF_TYPESCALE } from "@/features/mushaf/typescale";

type Props = {
  label: string;
  className?: string;
  titleRef?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
};

const PANEL_MARGIN_PX = 6;
const PANEL_FRAC = 0.34;
const STROKE = 1.15;
const PANEL_STROKE = 1.35;
const OUTER_STROKE = 1.75;
const INNER_STROKE = 0.9;
const FRAME_GAP = 3.5;
const FRAME_RADIUS = 4;
const ORNAMENT_LINE =
  "color-mix(in srgb, var(--color-mushaf-ornament-line, #FFFFFF) 78%, var(--color-mushaf-gold-soft, #C9B07A))";
const GOLD_QUIET =
  "color-mix(in srgb, var(--color-mushaf-gold-strong, #A67C3D) 78%, #7a6240)";
const GOLD_SOFT = "var(--color-mushaf-gold-soft, #C9B07A)";

function PetalMedallion({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const petals = 12;
  const outer: string[] = [];
  for (let i = 0; i < petals; i++) {
    const a0 = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 0.5) / petals) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / petals) * Math.PI * 2 - Math.PI / 2;
    const tip = r;
    const valley = r * 0.76;
    const x0 = cx + Math.cos(a0) * valley;
    const y0 = cy + Math.sin(a0) * valley;
    const xt = cx + Math.cos(a1) * tip;
    const yt = cy + Math.sin(a1) * tip;
    const x2 = cx + Math.cos(a2) * valley;
    const y2 = cy + Math.sin(a2) * valley;
    if (i === 0) outer.push(`M${x0.toFixed(2)} ${y0.toFixed(2)}`);
    outer.push(`Q${xt.toFixed(2)} ${yt.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`);
  }
  outer.push("Z");
  return (
    <g aria-hidden="true" data-wing-part="medallion">
      <circle
        cx={cx}
        cy={cy}
        r={r * 1.08}
        fill="color-mix(in srgb, var(--color-mushaf-ornament-mid, #EDE0C4) 55%, transparent)"
        stroke="none"
      />
      <path
        d={outer.join(" ")}
        fill="color-mix(in srgb, var(--color-mushaf-ornament-bg, #D8C39C) 35%, transparent)"
        stroke={ORNAMENT_LINE}
        strokeWidth={STROKE}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.7}
        fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
        stroke={GOLD_SOFT}
        strokeWidth={STROKE * 0.85}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.4}
        fill="none"
        stroke={ORNAMENT_LINE}
        strokeWidth={STROKE}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.2}
        fill="var(--color-mushaf-ornament-bg, #D8C39C)"
        stroke={GOLD_QUIET}
        strokeWidth={STROKE * 0.7}
      />
      <circle cx={cx} cy={cy} r={r * 0.07} fill={GOLD_QUIET} />
    </g>
  );
}

function TwinSpirals({
  cx,
  cy,
  medR,
  wingX,
  wingW,
}: {
  cx: number;
  cy: number;
  medR: number;
  wingX: number;
  wingW: number;
}) {
  const leftEnd = wingX + 3;
  const rightEnd = wingX + wingW - 3;
  const amp = medR * 0.9;
  const left = [
    `M ${(cx - medR * 0.95).toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(cx - medR * 1.4).toFixed(2)} ${(cy - amp).toFixed(2)},`,
    `${(leftEnd + (cx - leftEnd) * 0.32).toFixed(2)} ${(cy - amp * 0.4).toFixed(2)},`,
    `${leftEnd.toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(leftEnd + (cx - leftEnd) * 0.38).toFixed(2)} ${(cy + amp * 0.75).toFixed(2)},`,
    `${(cx - medR * 1.18).toFixed(2)} ${(cy + amp * 0.55).toFixed(2)},`,
    `${(cx - medR * 0.72).toFixed(2)} ${(cy + amp * 0.06).toFixed(2)}`,
  ].join(" ");
  const right = [
    `M ${(cx + medR * 0.95).toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(cx + medR * 1.4).toFixed(2)} ${(cy - amp).toFixed(2)},`,
    `${(rightEnd - (rightEnd - cx) * 0.32).toFixed(2)} ${(cy - amp * 0.4).toFixed(2)},`,
    `${rightEnd.toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(rightEnd - (rightEnd - cx) * 0.38).toFixed(2)} ${(cy + amp * 0.75).toFixed(2)},`,
    `${(cx + medR * 1.18).toFixed(2)} ${(cy + amp * 0.55).toFixed(2)},`,
    `${(cx + medR * 0.72).toFixed(2)} ${(cy + amp * 0.06).toFixed(2)}`,
  ].join(" ");
  return (
    <g data-wing-part="spirals" aria-hidden="true">
      <path
        data-wing-part="spiral"
        d={left}
        fill="none"
        stroke={ORNAMENT_LINE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        data-wing-part="spiral"
        d={right}
        fill="none"
        stroke={ORNAMENT_LINE}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function CornerFinial({ x, y, dir }: { x: number; y: number; dir: 1 | -1 }) {
  const s = 3.2 * dir;
  return (
    <g aria-hidden="true">
      <path
        d={`M ${x} ${y} l ${s} ${-Math.abs(s) * 0.35} l ${s * 0.15} ${Math.abs(s) * 0.7} Z`}
        fill={GOLD_SOFT}
        stroke={GOLD_QUIET}
        strokeWidth={0.6}
      />
    </g>
  );
}

function WingMotifs({
  wingX,
  wingW,
  cy,
  wingH,
}: {
  wingX: number;
  wingW: number;
  cy: number;
  wingH: number;
}) {
  const medR = wingH * 0.34;
  const cx = wingX + wingW / 2;
  return (
    <g data-wing="1">
      <TwinSpirals cx={cx} cy={cy} medR={medR} wingX={wingX} wingW={wingW} />
      <PetalMedallion cx={cx} cy={cy} r={medR} />
    </g>
  );
}

export function SurahBanner({ label, className, titleRef, style }: Props) {
  const aria = label.replace(/^(?:سُورَةُ|سورة)\s*/u, "").trim() || label;
  const nameRef = useRef<HTMLSpanElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const nameEl = nameRef.current;
    const root = rootRef.current;
    if (!nameEl || !root) return;

    const fit = () => {
      const panelW = root.clientWidth * PANEL_FRAC;
      const maxW = Math.max(24, panelW - PANEL_MARGIN_PX * 2);
      let sizeEm = MUSHAF_TYPESCALE.surahBannerName;
      nameEl.style.fontSize = `${sizeEm}em`;
      for (let i = 0; i < 24; i++) {
        if (nameEl.scrollWidth <= maxW) break;
        sizeEm *= 0.92;
        nameEl.style.fontSize = `${sizeEm}em`;
      }
    };

    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(root);
    return () => ro?.disconnect();
  }, [label]);

  const W = 320;
  const H = 40;
  const panelW = W * PANEL_FRAC;
  const panelX = (W - panelW) / 2;
  const panelY = 6.5;
  const panelH = H - 13;
  const innerPad = OUTER_STROKE + FRAME_GAP + INNER_STROKE + 1;
  const wingH = H - innerPad * 2;
  const leftWingX = innerPad;
  const leftWingW = panelX - innerPad - 2;
  const outerInset = 1.1;
  const innerInset = outerInset + OUTER_STROKE + FRAME_GAP;

  const setNameRef = (el: HTMLSpanElement | null) => {
    nameRef.current = el;
    titleRef?.(el);
  };

  return (
    <div
      ref={rootRef}
      className={className ? `mf2-surah-banner ${className}` : "mf2-surah-banner"}
      role="heading"
      aria-level={2}
      aria-label={`سورة ${aria}`}
      style={style}
      data-ornament="wing-refined"
      data-wing-motif="medallion+twin-spiral"
      data-wing-density-target="20-30"
      data-panel-width-pct="34"
      data-wing-mirror="1"
      data-stroke-uniform={STROKE}
    >
      <svg
        className="mf2-surah-banner__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="mf2-banner-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mushaf-ornament-mid, #EDE0C4)" />
            <stop offset="100%" stopColor="var(--color-mushaf-ornament-bg, #E3D2B4)" />
          </linearGradient>
        </defs>
        <rect
          x={outerInset}
          y={outerInset}
          width={W - outerInset * 2}
          height={H - outerInset * 2}
          rx={FRAME_RADIUS}
          fill="url(#mf2-banner-fill)"
          stroke={GOLD_QUIET}
          strokeWidth={OUTER_STROKE}
        />
        <rect
          x={innerInset}
          y={innerInset}
          width={W - innerInset * 2}
          height={H - innerInset * 2}
          rx={FRAME_RADIUS - 1}
          fill="none"
          stroke={GOLD_SOFT}
          strokeWidth={INNER_STROKE}
          strokeOpacity={0.9}
        />
        {/* نقاط ذهبية خفيفة على المحاور — زخرفة هادئة بلا ازدحام */}
        {[panelX - 6, W - panelX + 6].map((px) => (
          <circle key={px} cx={px} cy={H / 2} r={1.15} fill={GOLD_QUIET} opacity={0.75} />
        ))}
        <WingMotifs wingX={leftWingX} wingW={leftWingW} cy={H / 2} wingH={wingH} />
        <g data-wing-mirror-copy="1" transform={`translate(${W}, 0) scale(-1, 1)`}>
          <WingMotifs wingX={leftWingX} wingW={leftWingW} cy={H / 2} wingH={wingH} />
        </g>
        <CornerFinial x={outerInset + 2} y={outerInset + 2} dir={1} />
        <CornerFinial x={W - outerInset - 2} y={outerInset + 2} dir={-1} />
        <rect
          x={panelX}
          y={panelY}
          width={panelW}
          height={panelH}
          rx="2"
          fill="var(--color-mushaf-panel, #FAF3E8)"
          stroke={GOLD_QUIET}
          strokeWidth={PANEL_STROKE}
        />
        <rect
          x={panelX + 2.5}
          y={panelY + 2}
          width={panelW - 5}
          height={panelH - 4}
          rx="1.5"
          fill="none"
          stroke={GOLD_SOFT}
          strokeWidth={0.7}
          opacity={0.7}
        />
      </svg>
      <span
        className="mf2-surah-banner__name mf2-surah-header__name"
        data-sizing-line="surah_title"
        lang="ar"
        dir="rtl"
        ref={setNameRef}
        style={{ fontSize: `${MUSHAF_TYPESCALE.surahBannerName}em` }}
      >
        {label}
      </span>
    </div>
  );
}

export default SurahBanner;
