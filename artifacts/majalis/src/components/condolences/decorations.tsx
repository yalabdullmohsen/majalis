/** زخارف SVG — أبيض/رمادي فقط، بدون صور خارجية */

export function CornerFrames({ color = "rgba(255,255,255,0.35)" }: { color?: string }) {
  const corner = (transform: string) => (
    <g transform={transform} stroke={color} fill="none" strokeWidth="0.35">
      <path d="M0 10 L0 0 L10 0" />
    </g>
  );
  return (
    <>
      {corner("translate(3,3)")}
      {corner("translate(97,3) scale(-1,1)")}
      {corner("translate(3,97) scale(1,-1)")}
      {corner("translate(97,97) scale(-1,-1)")}
    </>
  );
}

export function CircleOrnaments() {
  return (
    <>
      <div className="cond-deco-circle cond-deco-circle--1" aria-hidden="true" />
      <div className="cond-deco-circle cond-deco-circle--2" aria-hidden="true" />
      <div className="cond-deco-circle cond-deco-circle--3" aria-hidden="true" />
    </>
  );
}

export function IslamicPatternBg() {
  return (
    <svg className="cond-pattern-bg" aria-hidden="true" viewBox="0 0 200 200" preserveAspectRatio="none">
      <defs>
        <pattern id="cond-islamic-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
          <circle cx="20" cy="20" r="4" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cond-islamic-grid)" />
    </svg>
  );
}

export function DividerLine() {
  return (
    <div className="cond-divider" aria-hidden="true">
      <span />
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path
          d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1"
        />
      </svg>
      <span />
    </div>
  );
}

export function CrescentSvg() {
  return (
    <svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true" className="cond-crescent">
      <path
        d="M28 8 A14 14 0 1 1 20 40 A18 18 0 1 0 28 8"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
