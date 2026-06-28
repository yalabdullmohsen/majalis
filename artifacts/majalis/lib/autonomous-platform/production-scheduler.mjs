/**
 * Production scheduler — spread daily quotas across the day (no burst publishing).
 */
import { DAILY_QUOTAS, WEEKLY_QUOTAS, CONTENT_PIPELINES } from "./config.mjs";
import { kuwaitDateString } from "./normalize.mjs";

const HOURS_PER_DAY = 24;

/** Kuwait timezone hour 0–23 */
export function kuwaitHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuwait",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  return Number(parts.find((p) => p.type === "hour")?.value || 0);
}

export function batchSizeForPipeline(pipelineId, alreadyPublished = 0) {
  const pipeline = CONTENT_PIPELINES[pipelineId];
  if (!pipeline) return 0;

  const quota = pipeline.quota;
  const remaining = Math.max(0, quota - alreadyPublished);
  if (remaining <= 0) return 0;

  const hour = kuwaitHour();
  const periods = pipeline.quotaPeriod === "weekly" ? 7 * HOURS_PER_DAY : HOURS_PER_DAY;
  const slotsLeft = Math.max(1, periods - hour);
  const perSlot = Math.ceil(remaining / slotsLeft);

  const caps = {
    benefits: 40,
    questions: 25,
    hadith: 25,
    rulings: 10,
    stories: 5,
    articles: 3,
  };

  return Math.min(perSlot, caps[pipelineId] || 20, remaining);
}

export function shouldRunPipelineNow(pipelineId) {
  const hour = kuwaitHour();
  if (hour < 5) return pipelineId === "hadith";
  if (hour >= 22) return ["benefits", "questions"].includes(pipelineId);
  return true;
}

export function getDailyTargets() {
  return {
    date: kuwaitDateString(),
    hour: kuwaitHour(),
    quotas: DAILY_QUOTAS,
    weekly: WEEKLY_QUOTAS,
    pipelines: Object.fromEntries(
      Object.keys(CONTENT_PIPELINES).map((id) => [id, batchSizeForPipeline(id, 0)]),
    ),
  };
}
