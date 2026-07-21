/**
 * أشكال هندسية إسلامية للزينة — مكوّنات SVG قابلة لإعادة الاستخدام.
 * الألوان: زمردي (#28584D / #173D35)، عاجي، ذهبي محدود.
 * جميع المكوّنات مزيّنة فقط — aria-hidden="true".
 */

/** النجمة الثمانية — Classic 8-pointed Khatam star */
export function StarKhatam({
  size = 48,
  color = "currentColor",
  opacity = 1,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const starPts = Array.from({ length: 8 }, (_, i) => {
    const outerAngle = (i * Math.PI) / 4 - Math.PI / 8;
    const innerAngle = (i * Math.PI) / 4 + Math.PI / 8;
    const ri = r * 0.38;
    return [
      `${cx + r * Math.cos(outerAngle)},${cy + r * Math.sin(outerAngle)}`,
      `${cx + ri * Math.cos(innerAngle)},${cy + ri * Math.sin(innerAngle)}`,
    ].join(" ");
  }).join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className={className}
      style={{ opacity }}
    >
      <polygon points={starPts} fill={color} />
      {/* inner circle */}
      <circle cx={cx} cy={cy} r={r * 0.18} fill="none" stroke={color} strokeWidth={size * 0.018} />
    </svg>
  );
}

/** نجمة سداسية — 6-pointed star (نجمة داود كزينة هندسية) */
export function StarSixPointed({
  size = 40,
  color = "currentColor",
  opacity = 1,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const tri1 = Array.from({ length: 3 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  const tri2 = Array.from({ length: 3 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 3 + Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className={className}
      style={{ opacity }}
    >
      <polygon points={tri1} fill="none" stroke={color} strokeWidth={size * 0.04} />
      <polygon points={tri2} fill="none" stroke={color} strokeWidth={size * 0.04} />
    </svg>
  );
}

/** تصميم المشربية — Mashrabiya lattice pattern as background tile */
export function MashrabiyaPattern({
  size = 80,
  color = "currentColor",
  opacity = 0.08,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const s = size;
  const h = s / 2;
  const q = s / 4;
  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      aria-hidden="true"
      className={className}
      style={{ opacity }}
    >
      {/* outer octagon */}
      <polygon
        points={`${q},0 ${3*q},0 ${s},${q} ${s},${3*q} ${3*q},${s} ${q},${s} 0,${3*q} 0,${q}`}
        fill="none"
        stroke={color}
        strokeWidth={s * 0.018}
      />
      {/* inner square rotated 45° */}
      <polygon
        points={`${h},${q*0.6} ${s-q*0.6},${h} ${h},${s-q*0.6} ${q*0.6},${h}`}
        fill="none"
        stroke={color}
        strokeWidth={s * 0.014}
      />
      {/* center diamond */}
      <polygon
        points={`${h},${h-q*0.45} ${h+q*0.45},${h} ${h},${h+q*0.45} ${h-q*0.45},${h}`}
        fill="none"
        stroke={color}
        strokeWidth={s * 0.012}
      />
      {/* corner dots */}
      {[[0,0],[s,0],[0,s],[s,s]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={s * 0.04} fill={color} />
      ))}
    </svg>
  );
}

/** فاصل زخرفي — Ornamental divider with geometric motif */
export function IslamicDivider({
  width = 320,
  color = "currentColor",
  opacity = 0.35,
  className = "",
}: {
  width?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const h = 24;
  const cx = width / 2;
  const cy = h / 2;
  const r = 7;
  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      aria-hidden="true"
      className={className}
      style={{ opacity }}
      role="presentation"
    >
      {/* center star */}
      {(() => {
        const pts = Array.from({ length: 8 }, (_, i) => {
          const outerA = (i * Math.PI) / 4 - Math.PI / 8;
          const innerA = (i * Math.PI) / 4 + Math.PI / 8;
          const ri = r * 0.4;
          return [
            `${cx + r * Math.cos(outerA)},${cy + r * Math.sin(outerA)}`,
            `${cx + ri * Math.cos(innerA)},${cy + ri * Math.sin(innerA)}`,
          ].join(" ");
        }).join(" ");
        return <polygon points={pts} fill={color} />;
      })()}
      {/* left line */}
      <line x1={0} y1={cy} x2={cx - r - 10} y2={cy} stroke={color} strokeWidth={0.8} />
      {/* right line */}
      <line x1={cx + r + 10} y1={cy} x2={width} y2={cy} stroke={color} strokeWidth={0.8} />
      {/* side diamonds */}
      {[-1, 1].map((side) => {
        const x = cx + side * (r + 22);
        return (
          <polygon
            key={side}
            points={`${x},${cy - 3} ${x + 4},${cy} ${x},${cy + 3} ${x - 4},${cy}`}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

/** ركن هندسي — geometric corner ornament (للزوايا) */
export function CornerOrnament({
  size = 60,
  color = "currentColor",
  opacity = 0.15,
  flip = false,
  className = "",
}: {
  size?: number;
  color?: string;
  opacity?: number;
  flip?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      aria-hidden="true"
      className={className}
      style={{
        opacity,
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    >
      {/* quarter circle arc */}
      <path d="M0,0 Q30,0 30,30" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M0,0 Q0,30 30,30" fill="none" stroke={color} strokeWidth="0.7" />
      {/* small star at corner */}
      {(() => {
        const pts = Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI) / 3;
          const ri = i % 2 === 0 ? 6 : 3;
          return `${8 + ri * Math.cos(a)},${8 + ri * Math.sin(a)}`;
        }).join(" ");
        return <polygon points={pts} fill={color} />;
      })()}
      {/* decorative dots along arc */}
      {[0.2, 0.5, 0.8].map((t, i) => {
        const angle = (t * Math.PI) / 2;
        const r = 30;
        const x = 30 - r * Math.cos(angle);
        const y = 30 - r * Math.sin(angle);
        return <circle key={i} cx={x} cy={y} r={1.5} fill={color} />;
      })}
    </svg>
  );
}

/** إطار هندسي — section header with geometric border top */
export function GeometricSectionBorder({
  color = "#28584D",
  opacity = 0.18,
  className = "",
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      style={{ height: 32 }}
    >
      <svg
        width="100%"
        height="32"
        viewBox="0 0 400 32"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity }}
      >
        {/* repeated small stars */}
        {Array.from({ length: 14 }, (_, i) => {
          const cx = 14 + i * 28;
          const cy = 16;
          const r = 5;
          const pts = Array.from({ length: 8 }, (_, j) => {
            const a = (j * Math.PI) / 4 - Math.PI / 8;
            const ri = j % 2 === 0 ? r : r * 0.42;
            return `${cx + ri * Math.cos(a)},${cy + ri * Math.sin(a)}`;
          }).join(" ");
          return <polygon key={i} points={pts} fill={color} />;
        })}
        {/* connecting line */}
        <line x1="0" y1="16" x2="400" y2="16" stroke={color} strokeWidth="0.5" />
      </svg>
    </div>
  );
}

/** بطاقة إسلامية — decorative top edge for cards */
export function CardIslamicAccent({
  color = "#28584D",
  opacity = 0.12,
  height = 8,
}: {
  color?: string;
  opacity?: number;
  height?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        background: `repeating-linear-gradient(
          90deg,
          ${color} 0px,
          ${color} 4px,
          transparent 4px,
          transparent 8px
        )`,
        opacity,
        borderRadius: "4px 4px 0 0",
      }}
    />
  );
}
