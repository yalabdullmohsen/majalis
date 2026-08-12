import { motion } from 'framer-motion';

interface SectionCalloutProps {
  label: string;
  icon?: string;
  color?: 'emerald' | 'brass';
  delay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

const EMERALD = '#1F6E54';
const BRASS = '#B08D2E';
const SAGE = '#CFE0D3';

export function SectionCallout({
  label,
  icon,
  color = 'emerald',
  delay = 0,
  position = 'inline',
  size = 'md',
}: SectionCalloutProps) {
  const accent = color === 'emerald' ? EMERALD : BRASS;
  const accentSoft = color === 'emerald' ? `${EMERALD}22` : `${BRASS}22`;

  const fontSize = size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px';
  const dotSize = size === 'sm' ? 7 : size === 'lg' ? 11 : 9;
  const px = size === 'sm' ? '12px' : size === 'lg' ? '20px' : '16px';
  const py = size === 'sm' ? '6px' : size === 'lg' ? '12px' : '8px';

  const posStyle: React.CSSProperties =
    position === 'top-right'
      ? { position: 'absolute', top: 24, right: 24 }
      : position === 'top-left'
      ? { position: 'absolute', top: 24, left: 24 }
      : position === 'bottom-right'
      ? { position: 'absolute', bottom: 24, right: 24 }
      : position === 'bottom-left'
      ? { position: 'absolute', bottom: 24, left: 24 }
      : { display: 'inline-flex' };

  return (
    <motion.div
      style={{ ...posStyle, zIndex: 20 }}
      initial={{ opacity: 0, y: -16, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 28,
        delay,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(14px)',
          border: `1.5px solid ${accent}40`,
          borderRadius: '100px',
          padding: `${py} ${px}`,
          boxShadow: `0 4px 24px ${accent}18, 0 1px 4px rgba(0,0,0,0.06)`,
          direction: 'rtl',
        }}
      >
        {/* Pulsing dot */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            style={{
              width: dotSize * 2.5,
              height: dotSize * 2.5,
              borderRadius: '50%',
              backgroundColor: accentSoft,
              position: 'absolute',
            }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay }}
          />
          <div
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              backgroundColor: accent,
              position: 'relative',
            }}
          />
        </div>

        {/* Label */}
        <span
          style={{
            fontFamily: "'Amiri', serif",
            fontSize,
            fontWeight: 700,
            color: accent,
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
        >
          {label}
        </span>

        {/* Optional icon/emoji */}
        {icon && (
          <span style={{ fontSize: fontSize, lineHeight: 1 }}>{icon}</span>
        )}
      </div>

      {/* Underline draw-in accent */}
      <motion.div
        style={{
          height: 2,
          backgroundColor: accent,
          borderRadius: 2,
          marginTop: 6,
          marginRight: 12,
          marginLeft: 12,
          originX: 1,
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: delay + 0.25 }}
      />
    </motion.div>
  );
}

/** A full-width banner callout that slides down from the top of a scene */
export function SceneIntroBanner({
  label,
  subtitle,
  color = 'emerald',
  delay = 0,
}: {
  label: string;
  subtitle?: string;
  color?: 'emerald' | 'brass';
  delay?: number;
}) {
  const accent = color === 'emerald' ? EMERALD : BRASS;
  const accentSoft = color === 'emerald' ? SAGE : `${BRASS}33`;

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 28,
        paddingBottom: 0,
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, delay }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          direction: 'rtl',
        }}
      >
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            border: `1.5px solid ${accent}35`,
            borderRadius: 100,
            padding: '10px 24px',
            boxShadow: `0 8px 32px ${accent}20, 0 1px 4px rgba(0,0,0,0.06)`,
          }}
          initial={{ scale: 0.88 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22, delay: delay + 0.05 }}
        >
          {/* Left accent bar */}
          <motion.div
            style={{ width: 3, height: 22, borderRadius: 3, backgroundColor: accent }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: delay + 0.2 }}
          />

          {/* Pulsing dot */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: `${accent}20`,
                position: 'absolute',
              }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0.15, 0.8] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.3 }}
            />
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: accent, position: 'relative' }} />
          </div>

          <span
            style={{
              fontFamily: "'Amiri', serif",
              fontSize: 19,
              fontWeight: 700,
              color: accent,
              letterSpacing: '0.03em',
              lineHeight: 1,
            }}
          >
            {label}
          </span>
        </motion.div>

        {subtitle && (
          <motion.span
            style={{
              fontFamily: "'Almarai', sans-serif",
              fontSize: 13,
              color: `${accent}99`,
              letterSpacing: '0.04em',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.4 }}
          >
            {subtitle}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

/** An annotation arrow/tag that highlights a specific UI element */
export function CalloutTag({
  label,
  color = 'emerald',
  delay = 0,
  arrowDir = 'down',
}: {
  label: string;
  color?: 'emerald' | 'brass';
  delay?: number;
  arrowDir?: 'down' | 'up' | 'left' | 'right' | 'none';
}) {
  const accent = color === 'emerald' ? EMERALD : BRASS;

  const arrowPath: Record<string, string> = {
    down: 'M8 0 L8 14 M3 9 L8 14 L13 9',
    up: 'M8 14 L8 0 M3 5 L8 0 L13 5',
    left: 'M14 8 L0 8 M5 3 L0 8 L5 13',
    right: 'M0 8 L14 8 M9 3 L14 8 L9 13',
    none: '',
  };

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, direction: 'rtl' }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22, delay }}
    >
      <div
        style={{
          backgroundColor: accent,
          color: '#fff',
          borderRadius: 8,
          padding: '5px 14px',
          fontFamily: "'Amiri', serif",
          fontSize: 14,
          fontWeight: 700,
          boxShadow: `0 4px 16px ${accent}44`,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
      {arrowDir !== 'none' && (
        <motion.svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.15 }}
        >
          <path d={arrowPath[arrowDir]} stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      )}
    </motion.div>
  );
}
