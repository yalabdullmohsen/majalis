/**
 * سجل رموز سُنّة — أسماء CSS فقط (لا هكس مكرر).
 * المصدر الحرفي: `app/styles/theme.css`
 * الجسر الدلالي: `styles/ssunnah-theme-api.css` (--ss-*)
 */

export const SS_TYPE = {
  display: "var(--ss-type-display)",
  screenTitle: "var(--ss-type-screen-title)",
  heroTitle: "var(--ss-type-hero)",
  sectionTitle: "var(--ss-type-section-title)",
  subsectionTitle: "var(--ss-type-subsection)",
  cardTitle: "var(--ss-type-card-title)",
  bodyLarge: "var(--ss-type-body-lg)",
  body: "var(--ss-type-body)",
  readerBody: "var(--ss-type-reader)",
  scripture: "var(--ss-type-scripture)",
  hadithText: "var(--ss-type-hadith)",
  explanation: "var(--ss-type-explanation)",
  supporting: "var(--ss-type-supporting)",
  metadata: "var(--ss-type-meta)",
  label: "var(--ss-type-label)",
  buttonLabel: "var(--ss-type-button)",
  caption: "var(--ss-type-caption)",
  badge: "var(--ss-type-badge)",
} as const;

export const SS_COLOR = {
  bg: "var(--ss-color-bg)",
  bgSubtle: "var(--ss-color-bg-subtle)",
  surface: "var(--ss-color-surface)",
  surface2: "var(--ss-color-surface-2)",
  surfaceElevated: "var(--ss-color-surface-elevated)",
  surfaceInteractive: "var(--ss-color-surface-interactive)",
  surfaceSelected: "var(--ss-color-surface-selected)",
  surfaceFeature: "var(--ss-color-surface-feature)",
  surfaceKnowledge: "var(--ss-color-surface-knowledge)",
  text: "var(--ss-color-text)",
  textSecondary: "var(--ss-color-text-secondary)",
  textMuted: "var(--ss-color-text-muted)",
  textDisabled: "var(--ss-color-text-disabled)",
  textOnColor: "var(--ss-color-text-on-color)",
  brand: "var(--ss-color-brand)",
  brandDeep: "var(--ss-color-brand-deep)",
  brandOnLight: "var(--ss-color-brand-on-light)",
  onBrand: "var(--ss-color-on-brand)",
  primaryContainer: "var(--ss-color-primary-container)",
  primaryPressed: "var(--ss-color-primary-pressed)",
  border: "var(--ss-color-border)",
  borderSubtle: "var(--ss-color-border-subtle)",
  borderStrong: "var(--ss-color-border-strong)",
  divider: "var(--ss-color-divider)",
  focus: "var(--ss-color-focus)",
  selected: "var(--ss-color-selected)",
  success: "var(--ss-color-success)",
  warning: "var(--ss-color-warning)",
  danger: "var(--ss-color-danger)",
  error: "var(--ss-color-error)",
  info: "var(--ss-color-info)",
  overlay: "var(--ss-color-overlay)",
  skeleton: "var(--ss-color-skeleton)",
  skeletonHighlight: "var(--ss-color-skeleton-highlight)",
  icon: "var(--ss-color-icon)",
  iconSecondary: "var(--ss-color-icon-secondary)",
} as const;

export const SS_SPACE = {
  1: "var(--ss-space-1)",
  2: "var(--ss-space-2)",
  3: "var(--ss-space-3)",
  4: "var(--ss-space-4)",
  6: "var(--ss-space-6)",
  8: "var(--ss-space-8)",
  12: "var(--ss-space-12)",
} as const;

export const SS_RADIUS = {
  sm: "var(--ss-radius-sm)",
  md: "var(--ss-radius-md)",
  lg: "var(--ss-radius-lg)",
  card: "var(--ss-radius-card)",
  pill: "var(--ss-radius-pill)",
} as const;

/** أدوار النص المدعومة في مكوّنات design-system/text */
export const SS_TEXT_ROLES = [
  "screenTitle",
  "sectionTitle",
  "cardTitle",
  "body",
  "scripture",
  "explanation",
  "supporting",
  "label",
  "caption",
] as const;

export type SsTextRole = (typeof SS_TEXT_ROLES)[number];

export const SS_TEXT_ROLE_CLASS: Record<SsTextRole, string> = {
  screenTitle: "ss-text ss-text--screen-title",
  sectionTitle: "ss-text ss-text--section-title",
  cardTitle: "ss-text ss-text--card-title",
  body: "ss-text ss-text--body",
  scripture: "ss-text ss-text--scripture",
  explanation: "ss-text ss-text--explanation",
  supporting: "ss-text ss-text--supporting",
  label: "ss-text ss-text--label",
  caption: "ss-text ss-text--caption",
};

export const SS_TEXT_DEFAULT_TAG: Record<SsTextRole, keyof HTMLElementTagNameMap> = {
  screenTitle: "h1",
  sectionTitle: "h2",
  cardTitle: "h3",
  body: "p",
  scripture: "p",
  explanation: "p",
  supporting: "p",
  label: "span",
  caption: "span",
};
