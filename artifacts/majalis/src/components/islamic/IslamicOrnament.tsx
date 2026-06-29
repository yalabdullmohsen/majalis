/** Lightweight inline SVG Islamic geometric ornaments — no external assets, GPU-friendly. */

type OrnamentProps = {
  className?: string;
  opacity?: number;
};

export function IslamicGeometricPattern({ className = "", opacity = 0.08 }: OrnamentProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="islamic-star-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path
            d="M24 4 L28 20 L44 24 L28 28 L24 44 L20 28 L4 24 L20 20 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            opacity={opacity * 4}
          />
          <circle cx="24" cy="24" r="2" fill="currentColor" opacity={opacity * 3} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-star-grid)" />
    </svg>
  );
}

export function IslamicDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`islamic-divider ${className}`.trim()} aria-hidden="true">
      <span className="islamic-divider__line" />
      <svg className="islamic-divider__motif" viewBox="0 0 40 16" width="40" height="16" aria-hidden="true">
        <path
          d="M20 0 L24 8 L20 16 L16 8 Z M0 8 H12 M28 8 H40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="islamic-divider__line" />
    </div>
  );
}

export function IslamicCornerBorder({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`islamic-corner-border ${className}`.trim()}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 20 L4 4 L20 4 M44 4 L60 4 L60 20 M60 44 L60 60 L44 60 M20 60 L4 60 L4 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IslamicHeadingOrnament({ className = "" }: { className?: string }) {
  return (
    <span className={`islamic-heading-ornament ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 120 12" width="120" height="12">
        <path
          d="M0 6 H40 M80 6 H120 M52 6 L60 2 L68 6 L60 10 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
