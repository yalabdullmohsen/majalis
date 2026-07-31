/**
 * Risk classification for Release Train candidates.
 * Level A = auto-merge allowed
 * Level B = allowed with extra verification
 * Level C = blocked / excluded automatically
 */
import {
  LEVEL,
  LEVEL_A_PATH_PATTERNS,
  LEVEL_C_PATH_PATTERNS,
  MAX_FILES_LEVEL_B,
  MAX_FILES_LEVEL_C,
} from "./constants.mjs";

/**
 * @param {{ files?: string[], title?: string, body?: string, labels?: string[] }} input
 * @returns {{ level: string, reasons: string[], blocked: boolean }}
 */
export function classifyPullRequest(input = {}) {
  const files = Array.isArray(input.files) ? input.files : [];
  const title = String(input.title || "");
  const body = String(input.body || "");
  const labels = (input.labels || []).map((l) => String(l).toLowerCase());
  const blob = `${title}\n${body}\n${files.join("\n")}`;
  const reasons = [];

  if (files.length > MAX_FILES_LEVEL_C) {
    reasons.push(`files_changed=${files.length} > ${MAX_FILES_LEVEL_C} (Level C)`);
    return { level: LEVEL.C, reasons, blocked: true };
  }

  for (const pattern of LEVEL_C_PATH_PATTERNS) {
    const hit = files.find((f) => pattern.test(f)) || (pattern.test(blob) ? "(title/body)" : null);
    if (hit) {
      reasons.push(`Level C pattern ${pattern}: matched ${hit}`);
      return { level: LEVEL.C, reasons, blocked: true };
    }
  }

  // Explicit security / auth / SQL markers in labels block even if files look safe.
  if (labels.some((l) => /^(sql|migration|auth|rls|security-definer|ios-native)$/i.test(l))) {
    reasons.push("explicit risk label present");
    return { level: LEVEL.C, reasons, blocked: true };
  }

  const allLevelA =
    files.length > 0 &&
    files.every((f) => LEVEL_A_PATH_PATTERNS.some((p) => p.test(f)));

  const titleSuggestsA =
    /\b(typo|fix|content|seed|test|docs?|chore|link)\b/i.test(title) &&
    !/\b(ui|refactor|cache|layout|css|component)\b/i.test(title);

  if (allLevelA || (titleSuggestsA && files.length <= MAX_FILES_LEVEL_B)) {
    reasons.push(allLevelA ? "all paths look content/test/docs safe" : "title/heuristic Level A");
    return { level: LEVEL.A, reasons, blocked: false };
  }

  if (files.length >= 1 && files.length <= MAX_FILES_LEVEL_B) {
    reasons.push(`minor change set (${files.length} files) → Level B (extra verification)`);
    return { level: LEVEL.B, reasons, blocked: false };
  }

  if (files.length === 0) {
    reasons.push("unknown file set → Level B (extra verification)");
    return { level: LEVEL.B, reasons, blocked: false };
  }

  // 16–40 files without Level-C patterns: treat as B with extra verification.
  reasons.push(`moderate change set (${files.length} files) → Level B`);
  return { level: LEVEL.B, reasons, blocked: false };
}

/**
 * Human-readable exclusion comment for Level C PRs.
 * @param {number|string} prNumber
 * @param {string[]} reasons
 */
export function levelCExclusionComment(prNumber, reasons) {
  const list = (reasons || []).map((r) => `- ${r}`).join("\n") || "- classified as Level C";
  return [
    `🚂 **Release Train — استبعاد تلقائي (Level C)**`,
    "",
    `PR #${prNumber} لن يُدمَج في قطار الإصدار لأنه صُنّف **Level C** (مخاطرة مرتفعة).`,
    "",
    "**الأسباب:**",
    list,
    "",
    "بقية قطار الإصدار تستمر دون تأثر. أزِل مسارات SQL/Auth/iOS أو قلّل حجم التغيير ثم أعد وسم `release-train-ready`.",
  ].join("\n");
}
