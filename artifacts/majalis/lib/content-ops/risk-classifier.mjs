/**
 * Risk Classification — levels A / B / C (P0).
 */
import {
  CHANGE_KINDS_A,
  CHANGE_KINDS_B,
  CHANGE_KINDS_C,
  RISK_LEVELS,
} from "./types.mjs";
import { findProtectionHits, isProtectedTarget } from "./protected-content-registry.mjs";
import { assertSourceUsable } from "./source-registry.mjs";

/**
 * @typedef {object} ProposedChange
 * @property {string} [changeKind]
 * @property {string} [path]
 * @property {string} [field]
 * @property {string} [contentType]
 * @property {string} [table]
 * @property {string} [sourceId]
 * @property {boolean} [hasSourceConflict]
 * @property {boolean} [highConfidence]
 * @property {boolean} [reversible]
 * @property {boolean} [isQuote]
 * @property {boolean} [isPersonName]
 * @property {boolean} [isBookName]
 * @property {boolean} [isSacredTerm]
 * @property {boolean} [semanticMeaningChange]
 * @property {number} [confidence]
 * @property {string} [before]
 * @property {string} [after]
 */

/**
 * Classify a proposed change. C always wins over A/B when protection hits.
 * @param {ProposedChange} change
 */
export function classifyRisk(change = {}) {
  const hits = findProtectionHits(change);
  if (hits.length || isProtectedTarget(change)) {
    return buildResult(RISK_LEVELS.C, {
      reasons: ["protected_content", ...hits.flatMap((h) => h.reasons)],
      hits,
      mayAutoEdit: false,
      mayAutoPublish: false,
      status: "needs_specialist_review",
    });
  }

  const kind = change.changeKind || change.kind || null;

  if (kind && CHANGE_KINDS_C.includes(kind)) {
    return buildResult(RISK_LEVELS.C, {
      reasons: [`changeKind:${kind}`],
      mayAutoEdit: false,
      mayAutoPublish: false,
      status: "needs_specialist_review",
    });
  }

  if (
    change.isQuote ||
    change.isPersonName ||
    change.isBookName ||
    change.isSacredTerm ||
    change.semanticMeaningChange
  ) {
    return buildResult(RISK_LEVELS.B, {
      reasons: ["editorial_or_identity_sensitive"],
      mayAutoEdit: true,
      mayAutoPublish: false,
      status: "proposed_changes",
      destination: "proposed_changes",
    });
  }

  if (kind && CHANGE_KINDS_B.includes(kind)) {
    return buildResult(RISK_LEVELS.B, {
      reasons: [`changeKind:${kind}`],
      mayAutoEdit: true,
      mayAutoPublish: false,
      status: "proposed_changes",
      destination: "staging",
    });
  }

  if (kind && CHANGE_KINDS_A.includes(kind)) {
    return classifyLevelA(change, kind);
  }

  // Unknown kind → quarantine as B (never auto-publish)
  return buildResult(RISK_LEVELS.B, {
    reasons: ["unknown_change_kind"],
    mayAutoEdit: true,
    mayAutoPublish: false,
    status: "quarantined",
    destination: "quarantine",
  });
}

function classifyLevelA(change, kind) {
  const reasons = [`changeKind:${kind}`];
  const confidence = change.confidence ?? (change.highConfidence ? 0.95 : 0.5);
  const highConfidence = change.highConfidence === true || confidence >= 0.9;
  const reversible = change.reversible !== false;

  if (change.hasSourceConflict) {
    return buildResult(RISK_LEVELS.B, {
      reasons: [...reasons, "source_conflict"],
      mayAutoEdit: true,
      mayAutoPublish: false,
      status: "quarantined",
      destination: "quarantine",
    });
  }

  if (change.sourceId) {
    const srcCheck = assertSourceUsable(change.sourceId);
    if (!srcCheck.ok) {
      return buildResult(RISK_LEVELS.B, {
        reasons: [...reasons, srcCheck.reason],
        mayAutoEdit: true,
        mayAutoPublish: false,
        status: "needs_source",
        destination: "quarantine",
      });
    }
  }

  if (!highConfidence || !reversible) {
    return buildResult(RISK_LEVELS.B, {
      reasons: [
        ...reasons,
        !highConfidence ? "low_confidence" : null,
        !reversible ? "not_reversible" : null,
      ].filter(Boolean),
      mayAutoEdit: true,
      mayAutoPublish: false,
      status: "proposed_changes",
      destination: "draft",
    });
  }

  return buildResult(RISK_LEVELS.A, {
    reasons,
    mayAutoEdit: true,
    mayAutoPublish: true, // policy still gates actual publish
    status: "validated",
    confidence,
  });
}

function buildResult(level, extra) {
  return {
    level,
    ...extra,
    classifiedAt: new Date().toISOString(),
  };
}

export function summarizeClassification(results) {
  const counts = { A: 0, B: 0, C: 0 };
  for (const r of results) {
    if (counts[r.level] != null) counts[r.level] += 1;
  }
  return counts;
}
