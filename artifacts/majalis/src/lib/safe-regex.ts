/**
 * ReDoS-safe helpers for Arabic search / highlight / normalize.
 * Caps input length, escapes safely, prefers indexOf over catastrophic regex.
 * Logic-only — no UI.
 */

/** Hard cap for user search / normalize inputs (chars). */
export const SAFE_TEXT_MAX_CHARS = 4_000;

/** Cap for highlight pattern word count. */
export const SAFE_HIGHLIGHT_MAX_WORDS = 12;

/** Cap for each highlight token length. */
export const SAFE_HIGHLIGHT_MAX_WORD_LEN = 64;

export function clampSearchInput(text: string, max = SAFE_TEXT_MAX_CHARS): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max);
}

/** Escape regex metacharacters — linear, no nested quantifiers. */
export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a highlight RegExp from a user query.
 * Uses bounded alternation of escaped tokens only — no `.+` / nested `*` groups.
 * Returns null when the query is empty or too adversarial.
 */
export function buildSafeHighlightPattern(query: string): RegExp | null {
  const clipped = clampSearchInput(query.trim(), 512);
  if (!clipped) return null;

  const words = clipped
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, SAFE_HIGHLIGHT_MAX_WORDS)
    .map((w) => w.slice(0, SAFE_HIGHLIGHT_MAX_WORD_LEN));

  if (!words.length) return null;

  const alts = words.map((w) => {
    // Caller should pass already-normalized Arabic; we still escape metas.
    const n = escapeRegExp(w)
      // Character classes only — fixed width, linear matching
      .replace(/ه/g, "[هة]")
      .replace(/ي/g, "[يى]")
      .replace(/ا/g, "[اأإآٱ]")
      .replace(/و/g, "[وؤ]");
    return `(?:${n})`;
  });

  try {
    return new RegExp(alts.join("|"), "g");
  } catch {
    return null;
  }
}

/**
 * Safe includes after normalize — rejects oversized needles to protect CPU.
 */
export function isSafeSearchNeedle(needle: string): boolean {
  return needle.length > 0 && needle.length <= SAFE_TEXT_MAX_CHARS;
}
