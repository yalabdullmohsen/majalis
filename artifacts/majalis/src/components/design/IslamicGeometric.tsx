"use client";

import type { CSSProperties } from "react";

// ── النجمة الثمانية (مبنية رياضياً، لا صورة) ──────────────────────────────

function star8Points(cx: number, cy: number, r1: number, r2: number): string {
  const points: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(3)},${(cy + r * Math.sin(angle)).toFixed(3)}`);
  }
  return points.join(" ");
}

// ── مُحمَّل هندسي (بديل Spinner) ─────────────────────────────────────────

export function IslamicLoader({ size = 48, color = "var(--majalis-emerald, #1F4D3A)" }: { size?: number; color?: string }) {
  const cx = size / 2;
  const r1 = size * 0.42;
  const r2 = size * 0.22;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      role="img"
      className="igd-loader-svg"
    >
      <style>{`
        @keyframes islamic-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .il-star { animation: none !important; opacity: 0.5; }
        }
      `}</style>
      <g style={{ "--il-cx": `${cx}px`, transformOrigin: "var(--il-cx) var(--il-cx)", animation: "islamic-rotate 2s linear infinite" } as React.CSSProperties} className="il-star">
        <polygon
          points={star8Points(cx, cx, r1, r2)}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.04}
          strokeLinejoin="round"
          opacity="0.9"
        />
      </g>
      <circle cx={cx} cy={cx} r={size * 0.08} fill={color} opacity="0.7" />
    </svg>
  );
}

// ── فاصل هندسي بنجمة مركزية ──────────────────────────────────────────────

export function IslamicDividerStar({
  label,
  color = "var(--majalis-line, rgba(14,110,82,0.15))",
  starColor = "var(--majalis-emerald, #1F4D3A)",
  style,
}: {
  label?: string;
  color?: string;
  starColor?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className="islamic-divider"
      style={{ "--igd-divider-color": color, ...style } as React.CSSProperties}
      aria-hidden={!label}
      role={label ? "separator" : undefined}
      aria-label={label}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" className="islamic-divider__diamond" aria-hidden="true">
        <polygon points={star8Points(10, 10, 9, 5)} fill={starColor} opacity="0.55" />
      </svg>
      {label && <span className="igd-divider-label">{label}</span>}
      {label && (
        <svg width="20" height="20" viewBox="0 0 20 20" className="islamic-divider__diamond" aria-hidden="true">
          <polygon points={star8Points(10, 10, 9, 5)} fill={starColor} opacity="0.55" />
        </svg>
      )}
    </div>
  );
}

// ── نسيج خلفية شفاف (للأقسام الكبيرة) ────────────────────────────────────

export function IslamicPatternBg({
  opacity = 0.045,
  color = "var(--majalis-emerald, #1F4D3A)",
  tileSize = 64,
  style,
  className,
}: {
  opacity?: number;
  color?: string;
  tileSize?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const id = `ip-${tileSize}-${color.replace(/[^a-z0-9]/gi, "")}`;
  const cx = tileSize / 2;
  const r1 = tileSize * 0.42;
  const r2 = tileSize * 0.2;

  return (
    <svg
      aria-hidden="true"
      className={`igd-pattern-bg${className ? ` ${className}` : ""}`}
      style={style}
    >
      <defs>
        <pattern id={id} x="0" y="0" width={tileSize} height={tileSize} patternUnits="userSpaceOnUse">
          <polygon
            points={star8Points(cx, cx, r1, r2)}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            opacity={opacity}
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// ── إطار شارة الإنجاز (نجمة ثمانية كإطار) ────────────────────────────────

export function AchievementFrame({
  size = 64,
  color = "var(--v2-gold, #1F4D3A)",
  children,
}: {
  size?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const cx = size / 2;
  const r1 = size * 0.46;
  const r2 = size * 0.32;

  return (
    <div
      className="igd-achievement-frame"
      style={{ "--igd-frame-size": `${size}px` } as React.CSSProperties}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="igd-achievement-svg"
        aria-hidden="true"
      >
        <polygon
          points={star8Points(cx, cx, r1, r2)}
          fill={color}
          opacity="0.15"
        />
        <polygon
          points={star8Points(cx, cx, r1 * 0.92, r2 * 0.92)}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.6"
          strokeLinejoin="round"
        />
      </svg>
      <div className="igd-achievement-center">
        {children}
      </div>
    </div>
  );
}

// ── مؤشر تحميل الصفحة الكامل ─────────────────────────────────────────────

export function IslamicPageLoader({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="igd-page-loader">
      <IslamicLoader size={52} />
      <p className="igd-page-loader__label">{label}</p>
    </div>
  );
}
