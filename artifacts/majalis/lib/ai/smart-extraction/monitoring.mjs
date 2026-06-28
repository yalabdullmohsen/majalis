/**
 * Smart extraction monitoring — costs, AI usage, OCR stats.
 */
const STATS = {
  totalImages: 0,
  ocrSuccess: 0,
  ocrFailed: 0,
  noAiCount: 0,
  aiCount: 0,
  openaiRequests: 0,
  anthropicRequests: 0,
  totalCostUsd: 0,
  dailyCostUsd: 0,
  monthlyCostUsd: 0,
  confidenceSum: 0,
  processingMsSum: 0,
  publishQueue: 0,
  reviewQueue: 0,
  lastResetDay: new Date().toISOString().slice(0, 10),
  lastResetMonth: new Date().toISOString().slice(0, 7),
  history: [],
};

function rollDaily() {
  const day = new Date().toISOString().slice(0, 10);
  if (STATS.lastResetDay !== day) {
    STATS.dailyCostUsd = 0;
    STATS.lastResetDay = day;
  }
  const month = new Date().toISOString().slice(0, 7);
  if (STATS.lastResetMonth !== month) {
    STATS.monthlyCostUsd = 0;
    STATS.lastResetMonth = month;
  }
}

export function recordExtractionRun({
  ocrOk,
  usedAi,
  providerUsed,
  confidence = 0,
  durationMs = 0,
  publishAction = "full_review",
}) {
  rollDaily();
  STATS.totalImages++;
  if (ocrOk) STATS.ocrSuccess++;
  else STATS.ocrFailed++;
  if (usedAi) STATS.aiCount++;
  else STATS.noAiCount++;
  STATS.confidenceSum += confidence;
  STATS.processingMsSum += durationMs;
  if (publishAction === "auto_publish") STATS.publishQueue++;
  else STATS.reviewQueue++;

  STATS.history.unshift({
    at: new Date().toISOString(),
    ocrOk,
    usedAi,
    providerUsed,
    confidence,
    durationMs,
    publishAction,
  });
  if (STATS.history.length > 100) STATS.history.length = 100;
}

export function recordAiUsage({ provider, type, costUsd = 0 }) {
  rollDaily();
  if (provider === "openai") STATS.openaiRequests++;
  if (provider === "anthropic") STATS.anthropicRequests++;
  STATS.totalCostUsd += costUsd;
  STATS.dailyCostUsd += costUsd;
  STATS.monthlyCostUsd += costUsd;
}

export function getSmartExtractionStats() {
  rollDaily();
  const total = STATS.totalImages || 1;
  const aiPct = Math.round((STATS.aiCount / total) * 100);
  const savingsPct = Math.round((STATS.noAiCount / total) * 100);
  const hypotheticalAllAi = STATS.totalImages * 0.003;
  const savedUsd = Math.max(0, hypotheticalAllAi - STATS.totalCostUsd);

  return {
    ...STATS,
    avgConfidence: STATS.totalImages ? STATS.confidenceSum / STATS.totalImages : 0,
    avgProcessingMs: STATS.totalImages ? Math.round(STATS.processingMsSum / STATS.totalImages) : 0,
    successRate: STATS.totalImages ? Math.round((STATS.ocrSuccess / STATS.totalImages) * 100) : 0,
    aiUsagePercent: aiPct,
    savingsPercent: savingsPct,
    estimatedSavedUsd: Math.round(savedUsd * 1000) / 1000,
    hypotheticalAllAiCostUsd: Math.round(hypotheticalAllAi * 1000) / 1000,
  };
}

export function resetSmartExtractionStats() {
  for (const k of Object.keys(STATS)) {
    if (k === "history") STATS[k] = [];
    else if (typeof STATS[k] === "number") STATS[k] = 0;
  }
}
