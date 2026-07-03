type PatternType =
  | "honeycomb"
  | "stars"
  | "waves"
  | "mountains"
  | "orbits"
  | "vines"
  | "metallic"
  | "circles";

interface Props {
  pattern?: PatternType;
  className?: string;
  color?: string;
  opacity?: number;
}

const patterns: Record<PatternType, (color: string) => React.ReactNode> = {
  honeycomb: (c) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="52">
      <defs>
        <pattern id="hc" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,17 58,47 30,52 2,47 2,17" fill="none" stroke={c} strokeWidth="1.2" />
          <polygon points="0,2 28,17 28,47 0,52 -28,47 -28,17" fill="none" stroke={c} strokeWidth="1.2" />
          <polygon points="60,2 88,17 88,47 60,52 32,47 32,17" fill="none" stroke={c} strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hc)" />
    </svg>
  ),
  stars: (c) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <defs>
        <pattern id="st" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M32 4 L36 28 L60 32 L36 36 L32 60 L28 36 L4 32 L28 28 Z" fill="none" stroke={c} strokeWidth="1.2" />
          <path d="M32 4 L36 28 L60 32 L36 36 L32 60 L28 36 L4 32 L28 28 Z" fill="none" stroke={c} strokeWidth="0.8" opacity="0.5" transform="rotate(45 32 32)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#st)" />
    </svg>
  ),
  waves: (c) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">
      <defs>
        <pattern id="wv" x="0" y="0" width="120" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 Q15 5 30 20 Q45 35 60 20 Q75 5 90 20 Q105 35 120 20" fill="none" stroke={c} strokeWidth="1.5" />
          <path d="M0 30 Q15 15 30 30 Q45 45 60 30 Q75 15 90 30 Q105 45 120 30" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wv)" />
    </svg>
  ),
  mountains: (c) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="60">
      <defs>
        <pattern id="mt" x="0" y="0" width="100" height="60" patternUnits="userSpaceOnUse">
          <path d="M0 60 L25 10 L50 45 L75 5 L100 60 Z" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M0 70 L20 30 L40 55 L60 20 L80 50 L100 70" fill="none" stroke={c} strokeWidth="0.8" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mt)" />
    </svg>
  ),
  orbits: (c) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <defs>
        <pattern id="or" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <circle cx="40" cy="40" r="30" fill="none" stroke={c} strokeWidth="1" />
          <circle cx="40" cy="40" r="20" fill="none" stroke={c} strokeWidth="0.8" />
          <circle cx="40" cy="40" r="10" fill="none" stroke={c} strokeWidth="0.6" />
          <circle cx="70" cy="40" r="3" fill={c} opacity="0.6" />
          <circle cx="40" cy="10" r="2" fill={c} opacity="0.6" />
          <line x1="0" y1="40" x2="80" y2="40" stroke={c} strokeWidth="0.4" opacity="0.3" />
          <line x1="40" y1="0" x2="40" y2="80" stroke={c} strokeWidth="0.4" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#or)" />
    </svg>
  ),
  vines: (c) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <defs>
        <pattern id="vn" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M10 80 C10 60 30 55 40 40 C50 25 70 20 70 0" fill="none" stroke={c} strokeWidth="1.2" />
          <path d="M40 20 C35 15 20 18 15 10" fill="none" stroke={c} strokeWidth="0.8" />
          <circle cx="15" cy="10" r="3" fill={c} opacity="0.6" />
          <path d="M40 50 C45 45 60 48 65 40" fill="none" stroke={c} strokeWidth="0.8" />
          <circle cx="65" cy="40" r="3" fill={c} opacity="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#vn)" />
    </svg>
  ),
  metallic: (c) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
      <defs>
        <pattern id="ml" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="40" height="40" fill="none" stroke={c} strokeWidth="0.6" />
          <line x1="0" y1="0" x2="40" y2="40" stroke={c} strokeWidth="0.4" opacity="0.4" />
          <line x1="40" y1="0" x2="0" y2="40" stroke={c} strokeWidth="0.4" opacity="0.4" />
          <circle cx="20" cy="20" r="4" fill="none" stroke={c} strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ml)" />
    </svg>
  ),
  circles: (c) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <defs>
        <pattern id="cl" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <circle cx="40" cy="40" r="35" fill="none" stroke={c} strokeWidth="1" />
          <circle cx="40" cy="40" r="25" fill="none" stroke={c} strokeWidth="0.8" />
          <circle cx="40" cy="40" r="15" fill="none" stroke={c} strokeWidth="0.6" />
          <circle cx="40" cy="40" r="5" fill={c} opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cl)" />
    </svg>
  ),
};

export function GeometricPattern({
  pattern = "stars",
  className = "",
  color = "currentColor",
  opacity = 0.07,
}: Props) {
  const render = patterns[pattern];
  return (
    <div
      className={`geo-pattern ${className}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      {render(color)}
    </div>
  );
}

export default GeometricPattern;
