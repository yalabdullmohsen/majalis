/**
 * CD Safety Rules — block auto-merge for high-risk changes.
 */

import { execSync } from "node:child_process";

export const RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

/** Paths/patterns that require human review before auto-merge. */
export const HIGH_RISK_PATTERNS = [
  { pattern: /^supabase\/.*\.sql$/i, reason: "Database migration", level: RISK_LEVELS.HIGH },
  { pattern: /admin-auth|auth\.mjs|auth-context|jwt|session/i, reason: "Authentication change", level: RISK_LEVELS.CRITICAL },
  { pattern: /governance.*policy|row level security|enable row level/i, reason: "Security policy change", level: RISK_LEVELS.CRITICAL },
  { pattern: /^\.env|vercel\.json$/i, reason: "Environment / deploy config", level: RISK_LEVELS.HIGH },
  { pattern: /DROP TABLE|DROP COLUMN|DELETE FROM.*profiles/i, reason: "Destructive SQL", level: RISK_LEVELS.CRITICAL },
  { pattern: /secrets?|service.?role|api.?key/i, reason: "Secrets handling", level: RISK_LEVELS.HIGH },
];

export const MEDIUM_RISK_PATTERNS = [
  { pattern: /vercel\.json$/i, reason: "Vercel cron/routing change", level: RISK_LEVELS.MEDIUM },
  { pattern: /api-dispatch\.mjs$/i, reason: "API routing change", level: RISK_LEVELS.MEDIUM },
  { pattern: /package\.json$/i, reason: "Dependency change", level: RISK_LEVELS.MEDIUM },
];

export function getChangedFiles(baseRef = "origin/main") {
  try {
    const out = execSync(`git diff --name-only ${baseRef}...HEAD 2>/dev/null || git diff --name-only HEAD~1 HEAD`, {
      encoding: "utf8",
    });
    return out.split("\n").map((f) => f.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function analyzeChangeRisk(files = getChangedFiles()) {
  const findings = [];
  let maxLevel = RISK_LEVELS.LOW;

  const levelRank = { low: 0, medium: 1, high: 2, critical: 3 };

  for (const file of files) {
    for (const rule of [...HIGH_RISK_PATTERNS, ...MEDIUM_RISK_PATTERNS]) {
      if (rule.pattern.test(file)) {
        findings.push({ file, reason: rule.reason, level: rule.level });
        if (levelRank[rule.level] > levelRank[maxLevel]) maxLevel = rule.level;
      }
    }

    if (/\.sql$/i.test(file)) {
      try {
        const diff = execSync(`git diff origin/main...HEAD -- "${file}" 2>/dev/null || true`, { encoding: "utf8" });
        if (/DROP TABLE|DROP COLUMN|DELETE FROM|REVOKE ALL|DISABLE ROW LEVEL/i.test(diff)) {
          findings.push({ file, reason: "Destructive SQL in diff", level: RISK_LEVELS.CRITICAL });
          maxLevel = RISK_LEVELS.CRITICAL;
        }
      } catch {
        /* ignore */
      }
    }
  }

  const autoMergeAllowed = maxLevel === RISK_LEVELS.LOW || maxLevel === RISK_LEVELS.MEDIUM;
  const previewRequired = maxLevel === RISK_LEVELS.HIGH || maxLevel === RISK_LEVELS.CRITICAL;

  return {
    files,
    findings,
    riskLevel: maxLevel,
    autoMergeAllowed,
    previewRequired,
    humanReviewRequired: previewRequired,
  };
}

export function shouldSkipPreview(risk) {
  return !risk.previewRequired && risk.autoMergeAllowed;
}
