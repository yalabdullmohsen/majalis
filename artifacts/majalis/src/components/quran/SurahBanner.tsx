/**
 * شارة سورة مزخرفة بعرض كامل — SVG أصلي بلا صور نقطية.
 * جناحان بأرابيسك + لوحة وسطى لاسم السورة بخط الصفحة.
 */
import type { CSSProperties } from "react";

type Props = {
  label: string;
  className?: string;
  titleRef?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
};

/** وردة ثمانية البتلات */
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

/** نقش أرابيسك متكرر لجناح الشارة */
function WingArabesque({ x, w, h }: { x: number; w: number; h: number }) {
  const midY = h / 2;
  const loops: string[] = [];
  const step = Math.max(10, w / 4.2);
  for (let px = x + 6; px < x + w - 6; px += step) {
    loops.push(
      `M${px.toFixed(1)} ${(midY - 7).toFixed(1)} C${(px + 3).toFixed(1)} ${(midY - 14).toFixed(1)} ${(px + 7).toFixed(1)} ${(midY - 14).toFixed(1)} ${(px + 10).toFixed(1)} ${(midY - 7).toFixed(1)} C${(px + 13).toFixed(1)} ${midY.toFixed(1)} ${(px + 13).toFixed(1)} ${(midY + 7).toFixed(1)} ${(px + 10).toFixed(1)} ${(midY + 7).toFixed(1)} C${(px + 7).toFixed(1)} ${(midY + 14).toFixed(1)} ${(px + 3).toFixed(1)} ${(midY + 14).toFixed(1)} ${px.toFixed(1)} ${(midY + 7).toFixed(1)} C${(px - 2).toFixed(1)} ${midY.toFixed(1)} ${(px - 2).toFixed(1)} ${(midY - 3).toFixed(1)} ${px.toFixed(1)} ${(midY - 7).toFixed(1)}`,
    );
  }
  return (
    <g aria-hidden="true">
      <rect
        x={x}
        y="3"
        width={w}
        height={h - 6}
        rx="2"
        fill="var(--color-mushaf-ornament-bg, #E3D2B4)"
      />
      <path
        d={loops.join(" ")}
        fill="none"
        stroke="var(--color-mushaf-ornament-line, #FFFFFF)"
        strokeWidth="1.2"
        opacity="0.95"
      />
      <path
        d={loops.join(" ")}
        fill="var(--color-mushaf-ornament-mid, #D8C39C)"
        opacity="0.22"
      />
      <Octofoil cx={x + w / 2} cy={midY} r={Math.min(6.2, w * 0.12)} />
    </g>
  );
}

export function SurahBanner({ label, className, titleRef, style }: Props) {
  const aria = label.replace(/^(?:سُورَةُ|سورة)\s*/u, "").trim() || label;
  /* viewBox عرض 320 — الجناحان ~34% لكل، اللوحة الوسطى ~32% */
  const W = 320;
  const H = 48;
  const wingW = W * 0.34;
  const panelW = W * 0.32;
  const panelX = (W - panelW) / 2;
  const panelY = 7;
  const panelH = H - 14;

  return (
    <div
      className={className ? `mf2-surah-banner ${className}` : "mf2-surah-banner"}
      role="heading"
      aria-level={2}
      aria-label={`سورة ${aria}`}
      style={style}
    >
      <svg
        className="mf2-surah-banner__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* إطار مزدوج */}
        <rect
          x="1"
          y="1"
          width={W - 2}
          height={H - 2}
          rx="4"
          fill="var(--color-mushaf-panel, #FAF3E8)"
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
        <WingArabesque x={6} w={wingW - 4} h={H} />
        <WingArabesque x={W - wingW - 2} w={wingW - 4} h={H} />
        {/* لوحة وسطى بقوس مدبّب خفيف */}
        <path
          d={[
            `M${panelX + 4} ${panelY + 3}`,
            `Q${panelX + panelW / 2} ${panelY - 2} ${panelX + panelW - 4} ${panelY + 3}`,
            `L${panelX + panelW - 2} ${panelY + panelH - 3}`,
            `Q${panelX + panelW / 2} ${panelY + panelH + 2} ${panelX + 2} ${panelY + panelH - 3}`,
            "Z",
          ].join(" ")}
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
        ref={titleRef}
      >
        {label}
      </span>
    </div>
  );
}
