type Props = {
  className?: string;
  width?: number | string;
  style?: React.CSSProperties;
};

/**
 * Horizontal ornament banner — used at hero bottom and footer top.
 * Renders a repeating geometric border motif in SVG.
 */
export function IslamicOrnament({ className = "", width = "100%", style }: Props) {
  return (
    <svg
      className={className}
      style={style}
      width={width}
      height="18"
      viewBox="0 0 400 18"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="islamic-border" x="0" y="0" width="40" height="18" patternUnits="userSpaceOnUse">
          {/* Diamond */}
          <polygon
            points="20,3 25,9 20,15 15,9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          {/* Small diamonds between */}
          <polygon
            points="0,9 3,12 0,15 -3,12"
            fill="currentColor"
            opacity="0.4"
          />
          <polygon
            points="40,9 43,12 40,15 37,12"
            fill="currentColor"
            opacity="0.4"
          />
          {/* Center dot */}
          <circle cx="20" cy="9" r="1.4" fill="currentColor" opacity="0.5" />
          {/* Horizontal connectors */}
          <line x1="0" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
          <line x1="25" y1="9" x2="40" y2="9" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
        </pattern>
      </defs>
      <rect width="400" height="18" fill="url(#islamic-border)" />
    </svg>
  );
}

export default IslamicOrnament;
