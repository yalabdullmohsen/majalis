/**
 * شارة سورة رصينة متماثلة:
 * إطار ذهبي خارجي ٢px + داخلي ١px بفاصل ٤px · radius ٣px ·
 * كل جناح: ميدالية ١٢ بتلة + فرعان لولبيان فقط · سُمك ١٫٢px ·
 * أبيض بعتامة ٠٫٨٥ · الجناح الأيمن مرآة الأيسر · لوحة وسطى ٣٤٪.
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
const STROKE = 1.2;
const PANEL_STROKE = 1.5;
const OUTER_STROKE = 2;
const INNER_STROKE = 1;
const FRAME_GAP = 4;
const FRAME_RADIUS = 3;
/** خط الزخرفة: أبيض بعتامة ٠٫٨٥ */
const ORNAMENT_LINE = "color-mix(in srgb, #FFFFFF 85%, transparent)";
const GOLD_QUIET =
  "color-mix(in srgb, var(--color-mushaf-gold-strong, #A67C3D) 82%, #8a7040)";

/** ميدالية دائرية — ١٢ بتلة متساوية الزوايا */
function PetalMedallion({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const petals = 12;
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
    outer.push(`Q${xt.toFixed(2)} ${yt.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`);
  }
  outer.push("Z");
  return (
    <g aria-hidden="true" data-wing-part="medallion">
      <path
        d={outer.join(" ")}
        fill="none"
        stroke={ORNAMENT_LINE}
        strokeWidth={STROKE}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.72}
        fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
        stroke={ORNAMENT_LINE}
        strokeWidth={STROKE}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.42}
        fill="none"
        stroke={ORNAMENT_LINE}
        strokeWidth={STROKE}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.22}
        fill="var(--color-mushaf-ornament-bg, #D8C39C)"
        stroke={ORNAMENT_LINE}
        strokeWidth={STROKE}
      />
      <circle cx={cx} cy={cy} r={r * 0.08} fill={ORNAMENT_LINE} />
    </g>
  );
}

/** فرعان لولبيان متناظران فقط حول الميدالية */
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
  const amp = medR * 0.85;
  const left = [
    `M ${(cx - medR * 0.95).toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(cx - medR * 1.35).toFixed(2)} ${(cy - amp).toFixed(2)},`,
    `${(leftEnd + (cx - leftEnd) * 0.35).toFixed(2)} ${(cy - amp * 0.35).toFixed(2)},`,
    `${leftEnd.toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(leftEnd + (cx - leftEnd) * 0.4).toFixed(2)} ${(cy + amp * 0.7).toFixed(2)},`,
    `${(cx - medR * 1.15).toFixed(2)} ${(cy + amp * 0.55).toFixed(2)},`,
    `${(cx - medR * 0.75).toFixed(2)} ${(cy + amp * 0.08).toFixed(2)}`,
  ].join(" ");
  const right = [
    `M ${(cx + medR * 0.95).toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(cx + medR * 1.35).toFixed(2)} ${(cy - amp).toFixed(2)},`,
    `${(rightEnd - (rightEnd - cx) * 0.35).toFixed(2)} ${(cy - amp * 0.35).toFixed(2)},`,
    `${rightEnd.toFixed(2)} ${cy.toFixed(2)}`,
    `C ${(rightEnd - (rightEnd - cx) * 0.4).toFixed(2)} ${(cy + amp * 0.7).toFixed(2)},`,
    `${(cx + medR * 1.15).toFixed(2)} ${(cy + amp * 0.55).toFixed(2)},`,
    `${(cx + medR * 0.75).toFixed(2)} ${(cy + amp * 0.08).toFixed(2)}`,
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
  /* نصف قطر أصغر قليلاً لإبقاء كثافة الجناح داخل ٢٠–٣٠٪ */
  const medR = wingH * 0.36;
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
  const panelY = 7;
  const panelH = H - 14;
  const innerPad = OUTER_STROKE + FRAME_GAP + INNER_STROKE + 1;
  const wingH = H - innerPad * 2;
  const leftWingX = innerPad;
  const leftWingW = panelX - innerPad - 2;
  const outerInset = 1;
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
        <rect
          x={outerInset}
          y={outerInset}
          width={W - outerInset * 2}
          height={H - outerInset * 2}
          rx={FRAME_RADIUS}
          fill="var(--color-mushaf-ornament-bg, #E3D2B4)"
          stroke={GOLD_QUIET}
          strokeWidth={OUTER_STROKE}
        />
        <rect
          x={innerInset}
          y={innerInset}
          width={W - innerInset * 2}
          height={H - innerInset * 2}
          rx={FRAME_RADIUS}
          fill="none"
          stroke={GOLD_QUIET}
          strokeWidth={INNER_STROKE}
        />
        <WingMotifs wingX={leftWingX} wingW={leftWingW} cy={H / 2} wingH={wingH} />
        <g data-wing-mirror-copy="1" transform={`translate(${W}, 0) scale(-1, 1)`}>
          <WingMotifs wingX={leftWingX} wingW={leftWingW} cy={H / 2} wingH={wingH} />
        </g>
        <rect
          x={panelX}
          y={panelY}
          width={panelW}
          height={panelH}
          rx="0"
          fill="var(--color-mushaf-panel, #FAF3E8)"
          stroke={GOLD_QUIET}
          strokeWidth={PANEL_STROKE}
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
