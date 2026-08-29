/** إطار زخرفي محلي (SVG) — بلا أصول محمية من تطبيقات أخرى */
export function MushafDecorFrame() {
  return (
    <svg
      className="nm-page__frame-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* نقاط منتصف الأضلاع */}
      <circle cx="50" cy="1.2" r="0.9" fill="#c5b396" stroke="#7a6b4a" strokeWidth="0.35" />
      <circle cx="50" cy="98.8" r="0.9" fill="#c5b396" stroke="#7a6b4a" strokeWidth="0.35" />
      <circle cx="1.2" cy="50" r="0.9" fill="#c5b396" stroke="#7a6b4a" strokeWidth="0.35" />
      <circle cx="98.8" cy="50" r="0.9" fill="#c5b396" stroke="#7a6b4a" strokeWidth="0.35" />
      {/* زوايا هندسية بسيطة */}
      {CORNERS.map(([x, y, sx, sy]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
          <path
            d="M0 0 L3.2 0 L3.2 0.7 L0.7 0.7 L0.7 3.2 L0 3.2 Z"
            fill="none"
            stroke="#8b7355"
            strokeWidth="0.45"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx="1.6" cy="1.6" r="0.55" fill="#c5b396" stroke="#7a6b4a" strokeWidth="0.3" />
        </g>
      ))}
    </svg>
  );
}

const CORNERS: Array<[number, number, number, number]> = [
  [1.4, 1.4, 1, 1],
  [98.6, 1.4, -1, 1],
  [1.4, 98.6, 1, -1],
  [98.6, 98.6, -1, -1],
];
