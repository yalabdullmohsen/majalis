/**
 * شارة سورة كثيفة مطابقة لمرجعي ٦٠٠/٦٠١:
 * ميدالية بتلات + شبكة أرابيسك متصلة تملأ الجناح + عقدة — بلا وسم pattern مكرر.
 */
import { useLayoutEffect, useRef, type CSSProperties } from "react";

type Props = {
  label: string;
  className?: string;
  titleRef?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
};

const PANEL_MARGIN_PX = 6;
const PANEL_FRAC = 0.34;

/** ميدالية دائرية كبيرة بحواف بتلات متعددة (١٤) */
function PetalMedallion({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const petals = 14;
  const outer: string[] = [];
  for (let i = 0; i < petals; i++) {
    const a0 = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 0.5) / petals) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / petals) * Math.PI * 2 - Math.PI / 2;
    const tip = r;
    const valley = r * 0.78;
    const x0 = cx + Math.cos(a0) * valley;
    const y0 = cy + Math.sin(a0) * valley;
    const xt = cx + Math.cos(a1) * tip;
    const yt = cy + Math.sin(a1) * tip;
    const x2 = cx + Math.cos(a2) * valley;
    const y2 = cy + Math.sin(a2) * valley;
    if (i === 0) outer.push(`M${x0.toFixed(2)} ${y0.toFixed(2)}`);
    outer.push(
      `Q${xt.toFixed(2)} ${yt.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    );
  }
  outer.push("Z");
  return (
    <g aria-hidden="true" data-wing-part="medallion">
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.88}
        fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
      />
      <path
        d={outer.join(" ")}
        fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
        stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
        strokeWidth="1.5"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.42}
        fill="none"
        stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
        strokeWidth="1.35"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.22}
        fill="var(--color-mushaf-ornament-bg, #D8C39C)"
        stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
        strokeWidth="1.2"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.08}
        fill="var(--color-mushaf-ornament-line, #FFFFFF)"
      />
    </g>
  );
}

/** شبكة أرابيسك متصلة (مسارات صريحة) تملأ جانبًا من الجناح */
function ArabesqueMesh({
  x0,
  x1,
  cy,
  wingH,
  dir,
}: {
  x0: number;
  x1: number;
  cy: number;
  wingH: number;
  dir: 1 | -1;
}) {
  const w = Math.abs(x1 - x0);
  const mid = (x0 + x1) / 2;
  const h = wingH * 0.46;
  const paths: string[] = [];

  /* لفّات متشابكة — كثافة مستهدفة ٢٢–٣٨٪ مع الميدالية */
  for (let i = 0; i < 2; i++) {
    const t = (i + 0.35) / 2;
    const bx = x0 + w * t;
    const amp = h * (0.58 + (i % 2) * 0.16);
    paths.push(
      [
        `M ${(bx - dir * 1.5).toFixed(2)} ${cy.toFixed(2)}`,
        `C ${(bx + dir * w * 0.1).toFixed(2)} ${(cy - amp).toFixed(2)},`,
        `${(bx + dir * w * 0.22).toFixed(2)} ${(cy - amp * 0.25).toFixed(2)},`,
        `${(bx + dir * w * 0.26).toFixed(2)} ${cy.toFixed(2)}`,
        `C ${(bx + dir * w * 0.3).toFixed(2)} ${(cy + amp * 0.6).toFixed(2)},`,
        `${(bx + dir * w * 0.12).toFixed(2)} ${(cy + amp * 0.9).toFixed(2)},`,
        `${(bx + dir * 0.5).toFixed(2)} ${(cy + amp * 0.12).toFixed(2)}`,
      ].join(" "),
    );
  }
  {
    const bx = x0 + w * 0.62;
    const amp = h * 0.64;
    paths.push(
      [
        `M ${(bx + dir * 1).toFixed(2)} ${cy.toFixed(2)}`,
        `C ${(bx - dir * w * 0.12).toFixed(2)} ${(cy + amp).toFixed(2)},`,
        `${(bx - dir * w * 0.24).toFixed(2)} ${(cy + amp * 0.2).toFixed(2)},`,
        `${(bx - dir * w * 0.28).toFixed(2)} ${cy.toFixed(2)}`,
        `C ${(bx - dir * w * 0.3).toFixed(2)} ${(cy - amp * 0.55).toFixed(2)},`,
        `${(bx - dir * w * 0.1).toFixed(2)} ${(cy - amp * 0.85).toFixed(2)},`,
        `${bx.toFixed(2)} ${(cy - amp * 0.1).toFixed(2)}`,
      ].join(" "),
    );
  }
  paths.push(
    [
      `M ${x0.toFixed(2)} ${(cy - h * 0.65).toFixed(2)}`,
      `C ${mid.toFixed(2)} ${(cy - h * 0.95).toFixed(2)},`,
      `${mid.toFixed(2)} ${(cy - h * 0.2).toFixed(2)},`,
      `${x1.toFixed(2)} ${(cy - h * 0.45).toFixed(2)}`,
    ].join(" "),
  );
  paths.push(
    [
      `M ${x0.toFixed(2)} ${(cy + h * 0.65).toFixed(2)}`,
      `C ${mid.toFixed(2)} ${(cy + h * 0.95).toFixed(2)},`,
      `${mid.toFixed(2)} ${(cy + h * 0.2).toFixed(2)},`,
      `${x1.toFixed(2)} ${(cy + h * 0.45).toFixed(2)}`,
    ].join(" "),
  );

  const nodes = [
    [x0 + w * 0.32, cy - h * 0.28],
    [x0 + w * 0.72, cy + h * 0.26],
  ];

  return (
    <g data-wing-part="mesh" aria-hidden="true">
      {paths.map((d, i) => (
        <path
          key={`m-${i}`}
          data-wing-part="spiral"
          d={d}
          fill="none"
          stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {nodes.map(([nx, ny], i) => (
        <circle
          key={`n-${i}`}
          cx={nx}
          cy={ny}
          r={1.45}
          fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
          stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
          strokeWidth="1.1"
        />
      ))}
    </g>
  );
}

function WingMotifs({
  wingX,
  wingW,
  cy,
  wingH,
  panelSide,
}: {
  wingX: number;
  wingW: number;
  cy: number;
  wingH: number;
  panelSide: "left" | "right";
}) {
  const medR = wingH * 0.425; /* قطر ≈٨٥٪ من ارتفاع الجناح */
  const cx = wingX + wingW / 2;
  const knotX =
    panelSide === "right" ? wingX + wingW - 3.4 : wingX + 3.4;
  const leftPad = wingX + 2;
  const rightPad = wingX + wingW - 2;
  const medLeft = cx - medR * 0.95;
  const medRight = cx + medR * 0.95;

  return (
    <g data-wing="1">
      <ArabesqueMesh
        x0={leftPad}
        x1={medLeft}
        cy={cy}
        wingH={wingH}
        dir={-1}
      />
      <ArabesqueMesh
        x0={medRight}
        x1={rightPad}
        cy={cy}
        wingH={wingH}
        dir={1}
      />
      <PetalMedallion cx={cx} cy={cy} r={medR} />
      <circle
        data-wing-part="knot"
        cx={knotX}
        cy={cy}
        r={2.6}
        fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
        stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
        strokeWidth="1.3"
      />
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
      nameEl.style.fontSize = "";
      let sizeEm = 0.85;
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
  const panelY = 7;
  const panelH = H - 14;
  const innerPad = 7;
  const wingH = H - innerPad * 2;
  const leftWingX = innerPad;
  const leftWingW = panelX - innerPad - 2;
  const rightWingX = panelX + panelW + 2;
  const rightWingW = W - innerPad - rightWingX;

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
      data-ornament="wing-dense"
      data-wing-motif="medallion+mesh+knot"
      data-wing-density="filled"
      data-wing-density-target="22-38"
      data-panel-width-pct="34"
    >
      <svg
        className="mf2-surah-banner__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* إطار خارجي 2px + داخلي 1.5px بفاصل 4px — radius 4 */}
        <rect
          x="1"
          y="1"
          width={W - 2}
          height={H - 2}
          rx="4"
          fill="var(--color-mushaf-ornament-bg, #E3D2B4)"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="2"
        />
        <rect
          x="6"
          y="6"
          width={W - 12}
          height={H - 12}
          rx="4"
          fill="none"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="1.5"
        />
        <WingMotifs
          wingX={leftWingX}
          wingW={leftWingW}
          cy={H / 2}
          wingH={wingH}
          panelSide="right"
        />
        <WingMotifs
          wingX={rightWingX}
          wingW={rightWingW}
          cy={H / 2}
          wingH={wingH}
          panelSide="left"
        />
        <rect
          x={panelX}
          y={panelY}
          width={panelW}
          height={panelH}
          rx="3"
          fill="var(--color-mushaf-panel, #FAF3E8)"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="1.5"
        />
      </svg>
      <span
        className="mf2-surah-banner__name mf2-surah-header__name"
        data-sizing-line="surah_title"
        lang="ar"
        dir="rtl"
        ref={setNameRef}
      >
        {label}
      </span>
    </div>
  );
}
