/**
 * شارة سورة إسلامية حديثة خفيفة:
 * إطار ذهبي رفيع مزدوج · زخرفة هندسية هادئة · لوحة عاجية وسطى — بلا ازدحام.
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
const FRAME_GAP = 2.75;
const FRAME_RADIUS = 3.5;
const GOLD =
  "color-mix(in srgb, var(--color-mushaf-gold-strong, #A67C3D) 82%, #7a6240)";
const GOLD_SOFT = "var(--color-mushaf-gold-soft, #C9B07A)";
const IVORY = "var(--color-mushaf-panel, #FAF3E8)";
const ORNAMENT_LINE =
  "color-mix(in srgb, var(--color-mushaf-ornament-line, #FFFFFF) 70%, var(--color-mushaf-gold-soft, #C9B07A))";

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
  const r = Math.min(w, h) * 0.22;
  const transform = mirror ? `translate(${cx * 2}, 0) scale(-1, 1)` : undefined;
  return (
    <g transform={transform} aria-hidden="true" data-ornament-side="1">
      {/* قوسان هندسيان خفيفان */}
      <path
        d={`M ${x + 4} ${cy} Q ${cx} ${cy - h * 0.38} ${x + w - 4} ${cy}`}
        fill="none"
        stroke={ORNAMENT_LINE}
        strokeWidth={0.95}
        strokeLinecap="round"
      />
      <path
        d={`M ${x + 4} ${cy} Q ${cx} ${cy + h * 0.38} ${x + w - 4} ${cy}`}
        fill="none"
        stroke={ORNAMENT_LINE}
        strokeWidth={0.95}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD_SOFT} strokeWidth={0.9} />
      <circle cx={cx} cy={cy} r={r * 0.42} fill={GOLD} opacity={0.85} />
      {/* نقاط ذهبية هادئة */}
      <circle cx={x + 6} cy={cy} r={1} fill={GOLD} opacity={0.7} />
      <circle cx={x + w - 6} cy={cy} r={1} fill={GOLD} opacity={0.7} />
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
  const panelY = 5.5;
  const panelH = H - 11;
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
    >
      <svg
        className="mf2-surah-banner__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs />
        <rect
          x={outerInset}
          y={outerInset}
          width={W - outerInset * 2}
          height={H - outerInset * 2}
          rx={FRAME_RADIUS}
          fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
          stroke={GOLD}
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
          opacity={0.85}
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
          rx="2"
          fill={IVORY}
          stroke={GOLD}
          strokeWidth={1.15}
        />
        <rect
          x={panelX + 2}
          y={panelY + 1.75}
          width={panelW - 4}
          height={panelH - 3.5}
          rx="1.25"
          fill="none"
          stroke={GOLD_SOFT}
          strokeWidth={0.65}
          opacity={0.65}
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
