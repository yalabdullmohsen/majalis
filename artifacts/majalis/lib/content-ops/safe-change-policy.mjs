/**
 * Safe Change Policy — enforces A/B/C publish rules (P0).
 * Auto-publish is OFF by default and cannot run until P0 + rollback proofs.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyRisk } from "./risk-classifier.mjs";
import { rejectProtectedModification } from "./protected-content-registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POLICY_PATH = join(__dirname, "data", "safe-change-policy.json");

let _cache = null;

export function loadSafeChangePolicy(force = false) {
  if (_cache && !force) return _cache;
  _cache = JSON.parse(readFileSync(POLICY_PATH, "utf8"));
  return _cache;
}

export function isAutoPublishEnabled() {
  const policy = loadSafeChangePolicy();
  if (policy.autoPublishEnabled !== true) return false;
  if (process.env.CONTENT_OPS_AUTO_PUBLISH !== "1") return false;
  if (process.env.CONTENT_OPS_P0_ROLLBACK_VERIFIED !== "1") return false;
  return true;
}

/**
 * Decide what to do with a single proposed change.
 * Never publishes B/C. Never publishes A while autoPublishEnabled is false.
 */
export function evaluateChange(change, context = {}) {
  const protection = rejectProtectedModification(change, {
    changeId: change.changeId || null,
  });
  if (protection.rejected) {
    return {
      decision: "reject",
      publish: false,
      applyIsolated: false,
      classification: {
        level: "C",
        mayAutoEdit: false,
        mayAutoPublish: false,
        status: "needs_specialist_review",
        reasons: protection.hits.flatMap((h) => h.reasons),
        hits: protection.hits,
      },
      protection,
    };
  }

  const classification = classifyRisk(change);
  const policy = loadSafeChangePolicy();
  const limits = policy.safetyLimits || {};

  if (classification.level === "C") {
    return {
      decision: "reject",
      publish: false,
      applyIsolated: false,
      classification,
    };
  }

  if (classification.level === "B") {
    return {
      decision: "isolate",
      publish: false,
      applyIsolated: true,
      destination: classification.destination || "staging",
      classification,
    };
  }

  // Level A
  const cycleModified = context.cycleModifiedCount ?? 0;
  if (cycleModified >= (limits.maxRecordsModifiedPerCycle ?? 50)) {
    return {
      decision: "quarantine",
      publish: false,
      applyIsolated: false,
      reason: "daily_limit_exceeded",
      classification: { ...classification, status: "quarantined" },
    };
  }

  const auto = isAutoPublishEnabled();
  if (!auto) {
    return {
      decision: "hold_p0",
      publish: false,
      applyIsolated: false,
      reason: "auto_publish_disabled_until_p0_complete",
      classification,
      note: "مستوى A مُصنَّف وآمن نظريًا، لكن النشر التلقائي معطّل في P0.",
    };
  }

  if (!classification.mayAutoPublish) {
    return {
      decision: "isolate",
      publish: false,
      applyIsolated: true,
      classification,
    };
  }

  return {
    decision: "auto_approve",
    publish: true,
    applyIsolated: false,
    classification,
  };
}

/**
 * Batch gate: any C or policy violation blocks production publish of the set.
 */
export function gateChangeSet(changes, context = {}) {
  const evaluations = changes.map((c) => evaluateChange(c, context));
  const hasC = evaluations.some((e) => e.classification?.level === "C");
  const hasPublishable = evaluations.some((e) => e.publish === true);
  const publishAllowed = isAutoPublishEnabled() && !hasC && hasPublishable;

  return {
    evaluations,
    publishAllowed,
    autoPublishEnabled: isAutoPublishEnabled(),
    blockedByProtected: hasC,
    counts: {
      reject: evaluations.filter((e) => e.decision === "reject").length,
      isolate: evaluations.filter((e) => e.decision === "isolate").length,
      quarantine: evaluations.filter((e) => e.decision === "quarantine").length,
      hold_p0: evaluations.filter((e) => e.decision === "hold_p0").length,
      auto_approve: evaluations.filter((e) => e.decision === "auto_approve").length,
    },
  };
}

export function getPolicyPath() {
  return POLICY_PATH;
}
