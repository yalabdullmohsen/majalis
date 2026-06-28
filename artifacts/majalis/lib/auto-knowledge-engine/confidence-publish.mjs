/**
 * Confidence-based publish routing — auto / review / reject.
 */

const DEFAULT_TIERS = { auto_publish: 90, review: 70 };

export function resolveConfidencePublish(confidence, connectorConfig = {}) {
  const tiers = {
    ...DEFAULT_TIERS,
    ...(connectorConfig?.api_config?.confidence_tiers || {}),
  };

  const score = normalizeConfidence(confidence);

  if (score >= tiers.auto_publish) {
    return {
      tier: "high",
      action: "auto_publish",
      confidence: score,
      autoPublish: true,
      publishStatus: "pending",
      verificationStatus: "verified",
    };
  }

  if (score >= tiers.review) {
    return {
      tier: "medium",
      action: "review",
      confidence: score,
      autoPublish: false,
      publishStatus: "review",
      verificationStatus: "pending",
      reason: "confidence_review_band",
    };
  }

  return {
    tier: "low",
    action: "reject",
    confidence: score,
    autoPublish: false,
    publishStatus: "rejected",
    verificationStatus: "rejected",
    reason: "confidence_below_threshold",
  };
}

export function normalizeConfidence(value) {
  if (value == null || Number.isNaN(Number(value))) return 0;
  const n = Number(value);
  if (n <= 1) return Math.round(n * 100);
  return Math.round(Math.min(100, Math.max(0, n)));
}

export function extractItemConfidence(item) {
  const fromExtracted = item?.extracted_fields?.confidence;
  const fromAnalysis = item?.analysis?.ai_confidence ?? item?.analysis?.confidence;
  const fromVerification = item?.verification?.confidence;
  return normalizeConfidence(fromExtracted ?? fromAnalysis ?? fromVerification ?? 0);
}

export function applyConfidenceToGate(gate, item, connectorConfig) {
  if (!connectorConfig?.api_config?.confidence_tiers) return gate;

  const confidence = extractItemConfidence(item);
  const decision = resolveConfidencePublish(confidence, connectorConfig);

  if (decision.action === "reject") {
    return {
      ...gate,
      passed: false,
      autoPublish: false,
      canPublish: false,
      publishStatus: "rejected",
      verificationStatus: "rejected",
      confidenceDecision: decision,
      failedChecks: [...(gate.failedChecks || []), "confidence_low"],
    };
  }

  if (decision.action === "review") {
    return {
      ...gate,
      autoPublish: false,
      canPublish: gate.canPublish !== false,
      publishStatus: "review",
      verificationStatus: "pending",
      confidenceDecision: decision,
    };
  }

  return {
    ...gate,
    autoPublish: gate.passed && decision.autoPublish,
    confidenceDecision: decision,
  };
}
