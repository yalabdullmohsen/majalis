/**
 * Validation Engine — date, time, sheikh, mosque checks.
 */
import { matchSheikhByName } from "../../cms/sheikh-matcher.mjs";
import { MOSQUE_HINTS } from "./knowledge-base.mjs";

function isValidDate(str) {
  if (!str) return { valid: true, reason: "optional" };
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { valid: false, reason: "invalid_format" };
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return { valid: false, reason: "invalid_date" };
  const now = new Date();
  const twoYears = 730 * 86400000;
  if (d.getTime() < now.getTime() - twoYears) return { valid: false, reason: "date_too_old" };
  if (d.getTime() > now.getTime() + 365 * 86400000) return { valid: false, reason: "date_too_far" };
  return { valid: true, reason: "ok" };
}

function isValidTime(str) {
  if (!str) return { valid: true, reason: "optional" };
  if (/بعد\s+(?:الفجر|الظهر|العصر|المغرب|العشاء)/u.test(str)) return { valid: true, reason: "prayer_relative" };
  if (/\d{1,2}\s*(?:ص|م)/u.test(str)) return { valid: true, reason: "clock" };
  return { valid: false, reason: "unrecognized_time" };
}

function validateMosque(name) {
  if (!name) return { valid: false, reason: "missing" };
  const hasPrefix = /(?:مسجد|جامع|مصلى)/u.test(name);
  const knownHint = MOSQUE_HINTS.some((h) => name.includes(h));
  return { valid: hasPrefix || knownHint, reason: hasPrefix ? "prefix_ok" : knownHint ? "known_hint" : "unknown_mosque" };
}

export async function validateExtractedFields(fields) {
  const issues = [];
  const dateCheck = isValidDate(fields.gregorian_date);
  if (!dateCheck.valid) issues.push({ field: "gregorian_date", ...dateCheck });

  const timeCheck = isValidTime(fields.lesson_time);
  if (!timeCheck.valid) issues.push({ field: "lesson_time", ...timeCheck });

  const mosqueCheck = validateMosque(fields.mosque);
  if (!mosqueCheck.valid) issues.push({ field: "mosque", ...mosqueCheck });

  let sheikhMatch = null;
  if (fields.speaker_name) {
    sheikhMatch = await matchSheikhByName(fields.speaker_name);
    if (!sheikhMatch.matched) {
      issues.push({ field: "speaker_name", valid: false, reason: "sheikh_not_in_db", proposed: sheikhMatch.proposedDraft });
    }
  }

  return {
    ok: issues.filter((i) => !i.valid).length === 0,
    issues,
    sheikhMatch,
    rejected: issues.some((i) => i.reason === "invalid_date" || i.reason === "date_too_old"),
  };
}
