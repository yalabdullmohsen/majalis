/**
 * Pure Tajweed color-tag catalog for QA — mirrors educational rule colors
 * from the Tajweed curriculum (no UI wiring; testable logic only).
 */
export type TajweedColorTag = {
  ruleId: string;
  label: string;
  color: string;
  /** Simple pattern: letter sequences that should receive this tag in fixtures */
  markers: string[];
};

/** Canonical color map used by curriculum cards (emerald family, no purple). */
export const TAJWEED_COLOR_RULES: TajweedColorTag[] = [
  { ruleId: "idgham-bighunnah", label: "إدغام بغنّة", color: "#143F35", markers: ["من و", "عن ي"] },
  { ruleId: "idgham-bila-ghunnah", label: "إدغام بلا غنّة", color: "#143F35", markers: ["من ل", "عن ر"] },
  { ruleId: "ikhfa", label: "إخفاء حقيقي", color: "#155241", markers: ["من ت", "عن ك"] },
  { ruleId: "iqlab", label: "إقلاب", color: "#176B57", markers: ["من ب"] },
  { ruleId: "qalqalah", label: "قلقلة", color: "#0D2B22", markers: ["قطب جد", "قد", "طب"] },
  { ruleId: "ghunnah", label: "غنّة", color: "#0D2B22", markers: ["نّ", "مّ"] },
  { ruleId: "madd-tabeei", label: "مد طبيعي", color: "#226A56", markers: ["قا", "نو", "في"] },
];

export type TajweedRuleHit = {
  ruleId: string;
  color: string;
  label: string;
};

/**
 * Tag an Arabic fixture string with matching tajweed color rules.
 * Deterministic — used by unit tests to assert color-coded tags.
 */
export function tagTajweedColors(text: string): TajweedRuleHit[] {
  const hits: TajweedRuleHit[] = [];
  for (const rule of TAJWEED_COLOR_RULES) {
    if (rule.markers.some((m) => text.includes(m))) {
      hits.push({ ruleId: rule.ruleId, color: rule.color, label: rule.label });
    }
  }
  return hits;
}

const GHUNNAH_RE = /[نم]\u0651/; // ن/م + shadda
/** Qalqalah letters at end of word (sukoon/pause approximation for coloring). */
const QALQALAH_END_RE = /[قطبجد]\u0652?$/;

/**
 * Resolve the primary tajweed color rule for a single Uthmani word.
 * Used by Mushaf/continuous renderers when `isTajweedEnabled` is true.
 * Returns null for plain (uncolored) rendering.
 */
export function getTajweedRuleForWord(word: string): TajweedRuleHit | null {
  const w = word?.trim();
  if (!w) return null;

  for (const rule of TAJWEED_COLOR_RULES) {
    if (rule.markers.some((m) => !m.includes(" ") && w.includes(m))) {
      return { ruleId: rule.ruleId, color: rule.color, label: rule.label };
    }
  }
  if (GHUNNAH_RE.test(w)) {
    const rule = TAJWEED_COLOR_RULES.find((r) => r.ruleId === "ghunnah");
    if (rule) return { ruleId: rule.ruleId, color: rule.color, label: rule.label };
  }
  if (QALQALAH_END_RE.test(w)) {
    const rule = TAJWEED_COLOR_RULES.find((r) => r.ruleId === "qalqalah");
    if (rule) return { ruleId: rule.ruleId, color: rule.color, label: rule.label };
  }
  return null;
}

export function assertValidTajweedColor(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) && !/^#(6[Bb]|7[Cc]|8[Dd]|9[Ee]|[Aa][Ff])/.test(hex);
}
