/**
 * سجل رموز سُنّة — أسماء CSS فقط (لا هكس مكرر).
 * المصدر الحرفي: `app/styles/theme.css`
 * الجسر الدلالي: `styles/ssunnah-theme-api.css` (--ss-*)
 */

export const SS_TYPE = {
  screenTitle: "var(--ss-type-screen-title)",
  sectionTitle: "var(--ss-type-section-title)",
  cardTitle: "var(--ss-type-card-title)",
  body: "var(--ss-type-body)",
  scripture: "var(--ss-type-scripture)",
  explanation: "var(--ss-type-explanation)",
  supporting: "var(--ss-type-supporting)",
  label: "var(--ss-type-label)",
  caption: "var(--ss-type-caption)",
} as const;

export const SS_COLOR = {
  bg: "var(--ss-color-bg)",
  surface: "var(--ss-color-surface)",
  surface2: "var(--ss-color-surface-2)",
  text: "var(--ss-color-text)",
  textSecondary: "var(--ss-color-text-secondary)",
  textMuted: "var(--ss-color-text-muted)",
  brand: "var(--ss-color-brand)",
  brandDeep: "var(--ss-color-brand-deep)",
  brandOnLight: "var(--ss-color-brand-on-light)",
  onBrand: "var(--ss-color-on-brand)",
  border: "var(--ss-color-border)",
  danger: "var(--ss-color-danger)",
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
