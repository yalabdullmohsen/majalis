/**
 * Confidence Engine — per-field and aggregate confidence scores.
 */
import { REQUIRED_FOR_PUBLISH } from "./field-definitions.mjs";
import { MOSQUE_HINTS } from "./knowledge-base.mjs";

function scoreField(name, value, rawText = "") {
  const v = String(value || "").trim();
  if (!v) return { field: name, score: 0, reason: "empty" };

  switch (name) {
    case "speaker_name":
      return { field: name, score: v.length >= 4 ? 0.98 : 0.6, reason: "name_length" };
    case "mosque":
      return {
        field: name,
        score: MOSQUE_HINTS.some((h) => v.includes(h)) ? 0.95 : 0.82,
        reason: "mosque_pattern",
      };
    case "gregorian_date":
      return {
        field: name,
        score: /^\d{4}-\d{2}-\d{2}$/.test(v) ? 1.0 : 0.7,
        reason: "date_format",
      };
    case "lesson_time":
      return { field: name, score: /\d|بعد|ص|م/.test(v) ? 0.97 : 0.5, reason: "time_pattern" };
    case "day_of_week":
      return { field: name, score: 0.99, reason: "day_match" };
    case "city":
      return { field: name, score: 0.83, reason: "governorate" };
    case "phone":
      return { field: name, score: /^\+?965?\d{8}$/.test(v.replace(/\s/g, "")) ? 0.96 : 0.75, reason: "phone_format" };
    case "registration_url":
    case "live_url":
      return { field: name, score: /^https?:\/\//.test(v) ? 0.94 : 0.5, reason: "url" };
    case "title":
      return { field: name, score: v.length >= 10 ? 0.92 : 0.65, reason: "title_length" };
    default:
      return { field: name, score: v.length > 2 ? 0.8 : 0.4, reason: "generic" };
  }
}

export function computeConfidence(fields, rawText = "") {
  const keys = Object.keys(fields).filter((k) => !["confidence", "confidence_reason", "raw_ocr_text", "links", "keywords", "slug"].includes(k));
  const breakdown = keys.map((k) => scoreField(k, fields[k], rawText));
  const nonZero = breakdown.filter((b) => b.score > 0);
  const overall = nonZero.length
    ? nonZero.reduce((s, b) => s + b.score, 0) / nonZero.length
    : 0;

  const requiredScores = REQUIRED_FOR_PUBLISH.map((k) => scoreField(k, fields[k], rawText));
  const requiredAvg = requiredScores.length
    ? requiredScores.reduce((s, b) => s + b.score, 0) / requiredScores.length
    : 0;

  const reasons = [];
  if (requiredAvg < 0.7) reasons.push("required_fields_weak");
  if (overall >= 0.95) reasons.push("high_confidence_auto_publish");
  else if (overall >= 0.9) reasons.push("quick_review");
  else if (overall >= 0.7) reasons.push("full_review");
  else reasons.push("ai_recommended");

  return {
    overall: Math.round(overall * 1000) / 1000,
    requiredAvg: Math.round(requiredAvg * 1000) / 1000,
    breakdown,
    confidence_reason: reasons.join(", "),
    publishAction: overall >= 0.95 ? "auto_publish" : overall >= 0.9 ? "quick_review" : overall >= 0.7 ? "full_review" : "ai_or_manual",
  };
}

export function formatConfidencePercent(score) {
  return `${Math.round((score || 0) * 100)}%`;
}
