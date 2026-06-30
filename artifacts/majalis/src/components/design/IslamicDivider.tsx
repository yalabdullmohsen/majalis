type Props = {
  className?: string;
  size?: number;
};

/** Lightweight SVG section divider with an 8-pointed Islamic star ornament. */
export function IslamicDivider({ className = "", size = 28 }: Props) {
  return (
    <div className={`islamic-divider ${className}`} aria-hidden="true">
      <span className="islamic-divider__line" />
      <span className="islamic-divider__ornament">
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 8-pointed star: two overlapping squares */}
          <path
            d="M16 3 L18.5 13.5 L29 16 L18.5 18.5 L16 29 L13.5 18.5 L3 16 L13.5 13.5 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M16 3 L18.5 13.5 L29 16 L18.5 18.5 L16 29 L13.5 18.5 L3 16 L13.5 13.5 Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            transform="rotate(45 16 16)"
            opacity="0.6"
          />
          <circle cx="16" cy="16" r="2.5" fill="currentColor" opacity="0.7" />
        </svg>
      </span>
      <span className="islamic-divider__line" />
    </div>
  );
}

export default IslamicDivider;
