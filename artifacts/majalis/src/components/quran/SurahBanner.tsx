/**
 * شارة سورة — زخرفة المجلس العلمي:
 * إطار زمردي/ذهبي مزدوج · ميدالية بتلات · نجمة ثمانية · لوحة عاجية.
 * تبقى data-ornament="islamic-light" لبوابات الكثافة.
 */
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { MUSHAF_TYPESCALE } from "@/features/mushaf/typescale";

type Props = {
  label: string;
  className?: string;
  titleRef?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
};

const PANEL_MARGIN_PX = 5;
const PANEL_FRAC = 0.36;
const OUTER_STROKE = 1.35;
const INNER_STROKE = 0.75;
const FRAME_GAP = 2.6;
const FRAME_RADIUS = 4;
const GOLD =
  "color-mix(in srgb, var(--color-mushaf-gold-strong, #A67C3D) 82%, #7a6240)";
const GOLD_SOFT = "var(--color-mushaf-gold-soft, #C9B07A)";
const IVORY = "var(--color-mushaf-panel, #FAF3E8)";
const EMERALD =
  "color-mix(in srgb, var(--mj-brand-deep, #123F2E) 72%, var(--color-mushaf-gold-strong, #A67C3D))";
const ORNAMENT_LINE =
  "color-mix(in srgb, var(--color-mushaf-ornament-line, #FFFFFF) 55%, var(--color-mushaf-gold-soft, #C9B07A))";

function PetalMedallion({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const petals = 10;
  const parts: string[] = [];
  for (let i = 0; i < petals; i++) {
    const a0 = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 0.5) / petals) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / petals) * Math.PI * 2 - Math.PI / 2;
    const valley = r * 0.72;
    const tip = r;
    const x0 = cx + Math.cos(a0) * valley;
    const y0 = cy + Math.sin(a0) * valley;
    const xt = cx + Math.cos(a1) * tip;
    const yt = cy + Math.sin(a1) * tip;
    const x2 = cx + Math.cos(a2) * valley;
    const y2 = cy + Math.sin(a2) * valley;
    if (i === 0) parts.push(`M${x0.toFixed(2)} ${y0.toFixed(2)}`);
    parts.push(`Q${xt.toFixed(2)} ${yt.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`);
  }
  parts.push("Z");
  return (
    <g aria-hidden="true" data-majlis-ornament="petal">
      <circle
        cx={cx}
        cy={cy}
        r={r * 1.05}
        fill="color-mix(in srgb, var(--color-mushaf-ornament-mid, #EDE0C4) 50%, transparent)"
      />
      <path
        d={parts.join(" ")}
        fill="color-mix(in srgb, var(--mj-brand, #1F7A5A) 12%, var(--color-mushaf-ornament-bg, #D8C39C))"
        stroke={ORNAMENT_LINE}
        strokeWidth={0.85}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.48}
        fill={IVORY}
        stroke={GOLD_SOFT}
        strokeWidth={0.8}
      />
      <circle cx={cx} cy={cy} r={r * 0.18} fill={EMERALD} opacity={0.9} />
      <circle cx={cx} cy={cy} r={r * 0.07} fill={GOLD} />
    </g>
  );
}

function GeoStar({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.46;
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return (
    <g aria-hidden="true" data-majlis-ornament="star">
      <polygon
        points={pts.join(" ")}
        fill="none"
        stroke={GOLD_SOFT}
        strokeWidth={0.8}
        opacity={0.95}
      />
      <circle cx={cx} cy={cy} r={r * 0.2} fill={EMERALD} opacity={0.85} />
    </g>
  );
}

function SideOrnament({
  x,
  y,
  w,
  h,
  mirror,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  mirror?: boolean;
}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const transform = mirror ? `translate(${cx * 2}, 0) scale(-1, 1)` : undefined;
  const medR = Math.min(w, h) * 0.32;
  return (
    <g transform={transform} aria-hidden="true" data-ornament-side="1">
      <path
        d={`M ${x + 2} ${cy} Q ${cx - medR * 0.2} ${cy - h * 0.4} ${cx - medR * 0.85} ${cy}`}
        fill="none"
        stroke={ORNAMENT_LINE}
        strokeWidth={0.85}
        strokeLinecap="round"
      />
      <path
        d={`M ${x + 2} ${cy} Q ${cx - medR * 0.2} ${cy + h * 0.4} ${cx - medR * 0.85} ${cy}`}
        fill="none"
        stroke={ORNAMENT_LINE}
        strokeWidth={0.85}
        strokeLinecap="round"
      />
      <PetalMedallion cx={cx} cy={cy} r={medR} />
      <GeoStar cx={cx - medR * 0.02} cy={cy} r={medR * 0.38} />
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
  const H = 36;
  const panelW = W * PANEL_FRAC;
  const panelX = (W - panelW) / 2;
  const panelY = 5.25;
  const panelH = H - 10.5;
  const outerInset = 1;
  const innerInset = outerInset + OUTER_STROKE + FRAME_GAP;
  const sidePad = innerInset + 1;
  const sideW = panelX - sidePad - 3;

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
      data-ornament="islamic-light"
      data-panel-width-pct="36"
      data-majlis-banner="1"
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
          fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
          stroke={EMERALD}
          strokeWidth={OUTER_STROKE}
        />
        <rect
          x={innerInset}
          y={innerInset}
          width={W - innerInset * 2}
          height={H - innerInset * 2}
          rx={FRAME_RADIUS - 1.25}
          fill="none"
          stroke={GOLD_SOFT}
          strokeWidth={INNER_STROKE}
          opacity={0.95}
        />
        <line
          x1={innerInset + 8}
          y1={innerInset + 1.1}
          x2={W - innerInset - 8}
          y2={innerInset + 1.1}
          stroke={GOLD}
          strokeWidth={0.45}
          opacity={0.4}
        />
        <line
          x1={innerInset + 8}
          y1={H - innerInset - 1.1}
          x2={W - innerInset - 8}
          y2={H - innerInset - 1.1}
          stroke={GOLD}
          strokeWidth={0.45}
          opacity={0.4}
        />
        <SideOrnament x={sidePad} y={innerInset} w={sideW} h={H - innerInset * 2} />
        <SideOrnament
          x={sidePad}
          y={innerInset}
          w={sideW}
          h={H - innerInset * 2}
          mirror
        />
        <rect
          x={panelX}
          y={panelY}
          width={panelW}
          height={panelH}
          rx="2.25"
          fill={IVORY}
          stroke={EMERALD}
          strokeWidth={1.15}
        />
        <rect
          x={panelX + 2}
          y={panelY + 1.6}
          width={panelW - 4}
          height={panelH - 3.2}
          rx="1.35"
          fill="none"
          stroke={GOLD_SOFT}
          strokeWidth={0.6}
          opacity={0.75}
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
