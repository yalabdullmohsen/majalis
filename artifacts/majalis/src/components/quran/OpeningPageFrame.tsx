/**
 * إطار زخرفي لصفحتي الفاتحة/البقرة الأولى — يحوّل الفراغ إلى مساحة مقصودة.
 * نفس لغة لفّات الشارة بمقاس أصغر — بلا وسم pattern مكرر.
 */
type Props = {
  className?: string;
};

function CornerRose({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const petals = 8;
  const parts: string[] = [];
  for (let i = 0; i < petals; i++) {
    const a0 = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 0.5) / petals) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / petals) * Math.PI * 2 - Math.PI / 2;
    const tip = r;
    const valley = r * 0.62;
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
    <g data-opening-part="corner-rose">
      <path
        d={parts.join(" ")}
        fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
        stroke="var(--color-mushaf-gold-strong, #A67C3D)"
        strokeWidth="1.1"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.28}
        fill="var(--color-mushaf-panel, #FAF3E8)"
        stroke="var(--color-mushaf-gold-strong, #A67C3D)"
        strokeWidth="0.9"
      />
    </g>
  );
}

function SideScroll({
  x,
  y0,
  y1,
  dir,
}: {
  x: number;
  y0: number;
  y1: number;
  dir: 1 | -1;
}) {
  const h = Math.abs(y1 - y0);
  const mid = (y0 + y1) / 2;
  const amp = 5.5 * dir;
  const d = [
    `M ${x.toFixed(2)} ${y0.toFixed(2)}`,
    `C ${(x + amp).toFixed(2)} ${(y0 + h * 0.18).toFixed(2)},`,
    `${(x - amp).toFixed(2)} ${(y0 + h * 0.36).toFixed(2)},`,
    `${x.toFixed(2)} ${mid.toFixed(2)}`,
    `C ${(x + amp).toFixed(2)} ${(y0 + h * 0.64).toFixed(2)},`,
    `${(x - amp).toFixed(2)} ${(y0 + h * 0.82).toFixed(2)},`,
    `${x.toFixed(2)} ${y1.toFixed(2)}`,
  ].join(" ");
  return (
    <path
      data-opening-part="side-scroll"
      d={d}
      fill="none"
      stroke="var(--color-mushaf-gold-soft, #C9B07A)"
      strokeWidth="1.15"
      strokeLinecap="round"
    />
  );
}

export function OpeningPageFrame({ className }: Props) {
  const W = 200;
  const H = 280;
  const m = 8; /* هامش داخلي للـ viewBox ≈١٢px بصريًا */
  const outer = { x: m, y: m, w: W - m * 2, h: H - m * 2 };
  const gap = 5;
  const inner = {
    x: outer.x + gap + 2.5,
    y: outer.y + gap + 2.5,
    w: outer.w - (gap + 2.5) * 2,
    h: outer.h - (gap + 2.5) * 2,
  };
  const roseR = 7.5;
  const corners = [
    [outer.x + 2, outer.y + 2],
    [outer.x + outer.w - 2, outer.y + 2],
    [outer.x + 2, outer.y + outer.h - 2],
    [outer.x + outer.w - 2, outer.y + outer.h - 2],
  ] as const;
  const midTop = [outer.x + outer.w / 2, outer.y + 1.2] as const;
  const midBot = [outer.x + outer.w / 2, outer.y + outer.h - 1.2] as const;

  return (
    <div
      className={className ? `mf2-opening-frame ${className}` : "mf2-opening-frame"}
      aria-hidden="true"
      data-opening-frame="1"
      data-frame-span-pct="84"
    >
      <svg
        className="mf2-opening-frame__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <rect
          x={outer.x}
          y={outer.y}
          width={outer.w}
          height={outer.h}
          rx="3"
          fill="color-mix(in srgb, var(--color-mushaf-panel, #FAF3E8) 35%, transparent)"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="2.5"
        />
        <rect
          x={inner.x}
          y={inner.y}
          width={inner.w}
          height={inner.h}
          rx="2"
          fill="none"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="1"
        />
        <SideScroll x={inner.x + 4} y0={inner.y + 18} y1={inner.y + inner.h - 18} dir={1} />
        <SideScroll
          x={inner.x + inner.w - 4}
          y0={inner.y + 18}
          y1={inner.y + inner.h - 18}
          dir={-1}
        />
        {corners.map(([cx, cy], i) => (
          <CornerRose key={i} cx={cx} cy={cy} r={roseR} />
        ))}
        <circle
          data-opening-part="mid-knot"
          cx={midTop[0]}
          cy={midTop[1]}
          r={3.2}
          fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="1.1"
        />
        <circle
          data-opening-part="mid-knot"
          cx={midBot[0]}
          cy={midBot[1]}
          r={3.2}
          fill="var(--color-mushaf-ornament-mid, #EDE0C4)"
          stroke="var(--color-mushaf-gold-strong, #A67C3D)"
          strokeWidth="1.1"
        />
      </svg>
    </div>
  );
}
