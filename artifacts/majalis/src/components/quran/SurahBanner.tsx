/**
 * شارة سورة مطابقة لمرجعي ٦٠٠/٦٠١:
 * جناح = وردة ثمانية واحدة + فرعان لولبيان + عقدة — بلا نقش مكرّر ولا سلاسل.
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

/** وردة ثمانية البتلات — قطر ≈٧٥٪ من ارتفاع الجناح */
function Octofoil({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const petals: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    petals.push(
      `M${cx.toFixed(2)} ${cy.toFixed(2)} Q${(cx + Math.cos(a - 0.35) * r * 0.55).toFixed(2)} ${(cy + Math.sin(a - 0.35) * r * 0.55).toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} Q${(cx + Math.cos(a + 0.35) * r * 0.55).toFixed(2)} ${(cy + Math.sin(a + 0.35) * r * 0.55).toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)}`,
    );
  }
  return (
    <g aria-hidden="true" data-wing-part="rose">
      <path
        d={petals.join(" ")}
        fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
        stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
        strokeWidth="1.5"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.22}
        fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
        stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
        strokeWidth="1.2"
      />
    </g>
  );
}

/** فرع أرابيسك لولبي واحد (نصف حلزون) ينتهي بلفّة مغلقة */
function SpiralArm({
  cx,
  cy,
  side,
  reach,
}: {
  cx: number;
  cy: number;
  side: "left" | "right";
  reach: number;
}) {
  const dir = side === "left" ? -1 : 1;
  const tipX = cx + dir * reach;
  const midX = cx + dir * reach * 0.55;
  const loopR = Math.max(2.2, reach * 0.14);
  const d = [
    `M ${cx.toFixed(2)} ${cy.toFixed(2)}`,
    `C ${midX.toFixed(2)} ${(cy - reach * 0.42).toFixed(2)}, ${tipX.toFixed(2)} ${(cy - reach * 0.18).toFixed(2)}, ${tipX.toFixed(2)} ${cy.toFixed(2)}`,
    `C ${tipX.toFixed(2)} ${(cy + reach * 0.28).toFixed(2)}, ${(tipX - dir * loopR * 1.6).toFixed(2)} ${(cy + loopR * 1.8).toFixed(2)}, ${(tipX - dir * loopR * 0.2).toFixed(2)} ${(cy + loopR * 0.35).toFixed(2)}`,
    `C ${(tipX + dir * loopR * 0.9).toFixed(2)} ${(cy - loopR * 0.9).toFixed(2)}, ${(tipX + dir * loopR * 0.15).toFixed(2)} ${(cy - loopR * 1.5).toFixed(2)}, ${tipX.toFixed(2)} ${(cy - loopR * 0.15).toFixed(2)}`,
  ].join(" ");
  return (
    <path
      data-wing-part="spiral"
      d={d}
      fill="none"
      stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
  const roseR = wingH * 0.375;
  const cx = wingX + wingW / 2;
  const reach = Math.max(10, (wingW - roseR * 2) * 0.42);
  const knotX =
    panelSide === "right" ? wingX + wingW - 3.2 : wingX + 3.2;
  return (
    <g data-wing="1">
      <SpiralArm cx={cx - roseR * 0.15} cy={cy} side="left" reach={reach} />
      <SpiralArm cx={cx + roseR * 0.15} cy={cy} side="right" reach={reach} />
      <Octofoil cx={cx} cy={cy} r={roseR} />
      <circle
        data-wing-part="knot"
        cx={knotX}
        cy={cy}
        r={2.4}
        fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
        stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
        strokeWidth="1.2"
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
  const H = 36;
  const panelW = W * PANEL_FRAC;
  const panelX = (W - panelW) / 2;
  const panelY = 5;
  const panelH = H - 10;
  const innerPad = 6;
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
      data-ornament="wing-ref"
      data-wing-motif="rose+spiral+spiral+knot"
    >
      <svg
        className="mf2-surah-banner__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* إطار خارجي 2px + داخلي 1px بفاصل 3px — radius 3 */}
        <rect
          x="1"
          y="1"
          width={W - 2}
          height={H - 2}
          rx="3"
          fill="var(--color-mushaf-ornament-bg, #E3D2B4)"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="2"
        />
        <rect
          x="5"
          y="5"
          width={W - 10}
          height={H - 10}
          rx="3"
          fill="none"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="1"
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
        {/* لوحة وسطى 34% — حواف رأسية مستقيمة */}
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
