/**
 * شارة سورة مزخرفة بعرض كامل — جناحان بنقش أرابيسك (<pattern>) + وردة ثمانية + لوحة وسطى قائمة.
 */
import { useId, useLayoutEffect, useRef, type CSSProperties } from "react";

type Props = {
  label: string;
  className?: string;
  titleRef?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
};

const PANEL_MARGIN_PX = 6;

/** وردة ثمانية البتلات في منتصف الجناح */
function Octofoil({ cx, cy, r = 5.2 }: { cx: number; cy: number; r?: number }) {
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
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={r * 0.35} fill="var(--color-mushaf-ornament-mid, #D8C39C)" />
      <path
        d={petals.join(" ")}
        fill="var(--color-mushaf-ornament-mid, #D8C39C)"
        stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
        strokeWidth="0.7"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.18}
        fill="var(--color-mushaf-ornament-line, #FFFFFF)"
      />
    </g>
  );
}

export function SurahBanner({ label, className, titleRef, style }: Props) {
  const uid = useId().replace(/:/g, "");
  const aria = label.replace(/^(?:سُورَةُ|سورة)\s*/u, "").trim() || label;
  const nameRef = useRef<HTMLSpanElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const nameEl = nameRef.current;
    const root = rootRef.current;
    if (!nameEl || !root) return;

    const fit = () => {
      const panelW = root.clientWidth * 0.32;
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
  const H = 48;
  const wingW = W * 0.34;
  const panelW = W * 0.32;
  const panelX = (W - panelW) / 2;
  const panelY = 8;
  const panelH = H - 16;
  const patternId = `${uid}-arabesque`;

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
      data-ornament="arabesque"
    >
      <svg
        className="mf2-surah-banner__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width="14"
            height="16"
          >
            <path
              d="M1 8 C3 2 7 2 9 8 C7 14 3 14 1 8 M7 8 C9 3 12 3 13 8 C12 13 9 13 7 8"
              fill="none"
              stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        {/* إطار خارجي ذهبي مزدوج rx=4 */}
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
          x="5"
          y="5"
          width={W - 10}
          height={H - 10}
          rx="2.5"
          fill="none"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="1"
        />
        {/* جناح أيسر — أرضية + نقش pattern + وردة */}
        <rect
          x="6"
          y="6"
          width={wingW - 4}
          height={H - 12}
          rx="2"
          fill="var(--color-mushaf-ornament-bg, #E3D2B4)"
        />
        <rect
          x="6"
          y="6"
          width={wingW - 4}
          height={H - 12}
          rx="2"
          fill={`url(#${patternId})`}
          opacity="0.95"
        />
        <Octofoil cx={6 + (wingW - 4) / 2} cy={H / 2} r={Math.min(6.2, (wingW - 4) * 0.12)} />
        {/* جناح أيمن */}
        <rect
          x={W - wingW - 2}
          y="6"
          width={wingW - 4}
          height={H - 12}
          rx="2"
          fill="var(--color-mushaf-ornament-bg, #E3D2B4)"
        />
        <rect
          x={W - wingW - 2}
          y="6"
          width={wingW - 4}
          height={H - 12}
          rx="2"
          fill={`url(#${patternId})`}
          opacity="0.95"
        />
        <Octofoil
          cx={W - wingW - 2 + (wingW - 4) / 2}
          cy={H / 2}
          r={Math.min(6.2, (wingW - 4) * 0.12)}
        />
        {/* لوحة وسطى فاتحة — حواف رأسية مستقيمة (مستطيل) */}
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
