/**
 * SunnahFoundationTokens — أسماء CSS فقط للاستهلاك في TypeScript.
 * القيم الحرفية: `styles/sunnah-foundation-tokens.css`
 */

export const SF_COLOR = {
  warmIvory: "var(--sf-color-warm-ivory)",
  warmIvorySurface: "var(--sf-color-warm-ivory-surface)",
  warmIvoryMuted: "var(--sf-color-warm-ivory-muted)",
  ivoryCanvas: "var(--sf-color-ivory-canvas)",
  ivoryRaised: "var(--sf-color-ivory-raised)",
  deepEmerald: "var(--sf-color-deep-emerald)",
  deepEmeraldDeep: "var(--sf-color-deep-emerald-deep)",
  deepEmeraldSoft: "var(--sf-color-deep-emerald-soft)",
  quranGold: "var(--sf-color-quran-gold)",
  richInk: "var(--sf-color-rich-ink)",
  richInkMuted: "var(--sf-color-rich-ink-muted)",
  luxuryNight: "var(--sf-color-luxury-night)",
  luxuryNightSurface: "var(--sf-color-luxury-night-surface)",
  luxuryNightElevated: "var(--sf-color-luxury-night-elevated)",
  luxuryNightInk: "var(--sf-color-luxury-night-ink)",
  luxuryNightGold: "var(--sf-color-luxury-night-gold)",
  onEmerald: "var(--sf-color-on-emerald)",
} as const;

export const SF_FONT = {
  display: "var(--sf-font-display)",
  ui: "var(--sf-font-ui)",
  ornament: "var(--sf-font-ornament)",
} as const;

export const SF_TYPE = {
  display: "var(--sf-type-display)",
  pageTitle: "var(--sf-type-page-title)",
  sectionTitle: "var(--sf-type-section-title)",
  cardTitle: "var(--sf-type-card-title)",
  body: "var(--sf-type-body)",
  supporting: "var(--sf-type-supporting)",
  metadata: "var(--sf-type-metadata)",
  caption: "var(--sf-type-caption)",
} as const;

export const SF_TYPE_SCALE = [
  "display",
  "pageTitle",
  "sectionTitle",
  "cardTitle",
  "body",
  "supporting",
  "metadata",
  "caption",
] as const;

export type SfTypeRole = (typeof SF_TYPE_SCALE)[number];

export const SF_DENSITY = {
  compact: "compact",
  standard: "standard",
  reading: "reading",
} as const;

export type SfDensity = (typeof SF_DENSITY)[keyof typeof SF_DENSITY];

export const SF_SPACE = {
  1: "var(--sf-space-1)",
  2: "var(--sf-space-2)",
  3: "var(--sf-space-3)",
  4: "var(--sf-space-4)",
  5: "var(--sf-space-5)",
  6: "var(--sf-space-6)",
  8: "var(--sf-space-8)",
  12: "var(--sf-space-12)",
} as const;

export const SF_RADIUS = {
  sm: "var(--sf-radius-sm)",
  md: "var(--sf-radius-md)",
  lg: "var(--sf-radius-lg)",
  xl: "var(--sf-radius-xl)",
  card: "var(--sf-radius-card)",
  control: "var(--sf-radius-control)",
  pill: "var(--sf-radius-pill)",
} as const;

export const SF_SHADOW = {
  soft: "var(--sf-shadow-soft)",
  card: "var(--sf-shadow-card)",
  elevated: "var(--sf-shadow-elevated)",
} as const;

export const SF_SURFACE = {
  canvas: "var(--sf-surface-canvas)",
  raised: "var(--sf-surface-raised)",
  muted: "var(--sf-surface-muted)",
  brand: "var(--sf-surface-brand)",
  hairline: "var(--sf-hairline)",
} as const;

export const SF_STATE = {
  hoverWash: "var(--sf-state-hover-wash)",
  activeWash: "var(--sf-state-active-wash)",
  disabledOpacity: "var(--sf-state-disabled-opacity)",
} as const;

export const SF_FOCUS = {
  ring: "var(--sf-focus-ring)",
} as const;

export const SF_LAYER = {
  base: "var(--sf-layer-base)",
  sticky: "var(--sf-layer-sticky)",
  header: "var(--sf-layer-header)",
  nav: "var(--sf-layer-nav)",
  overlay: "var(--sf-layer-overlay)",
  modal: "var(--sf-layer-modal)",
  toast: "var(--sf-layer-toast)",
  critical: "var(--sf-layer-critical)",
} as const;

export const SF_SAFE_AREA = {
  top: "var(--sf-safe-top)",
  right: "var(--sf-safe-right)",
  bottom: "var(--sf-safe-bottom)",
  left: "var(--sf-safe-left)",
} as const;

/** تجميع للاستيراد الواحد */
export const SunnahFoundationTokens = {
  color: SF_COLOR,
  font: SF_FONT,
  type: SF_TYPE,
  typeScale: SF_TYPE_SCALE,
  density: SF_DENSITY,
  space: SF_SPACE,
  radius: SF_RADIUS,
  shadow: SF_SHADOW,
  surface: SF_SURFACE,
  state: SF_STATE,
  focus: SF_FOCUS,
  layer: SF_LAYER,
  safeArea: SF_SAFE_AREA,
} as const;

export default SunnahFoundationTokens;
