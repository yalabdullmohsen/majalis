import { stripEmojiFromTitle } from "../scripts/harvest/normalize.mjs";

const DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;
const TATWEEL = /\u0640/g;

/** تطبيع عربي للمقارنة — بلا تشكيل وبلا إيموجي */
export function normalizeArabic(input) {
  return stripEmojiFromTitle(String(input ?? ""))
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

/** عبارات صريحة فقط — لا تخمين من «نساء» أو «للنساء» منفردة */
const EXPLICIT_PHRASES = [
  "يوجد مكان للنساء",
  "يوجد مصلى نساء",
  "يوجد مكان مخصص للنساء",
  "يوجد قسم مخصص للنساء",
  "للنساء مكان",
  "حضور النساء متاح",
  "متاح للنساء",
  "للرجال والنساء",
];

const EXPLICIT_PATTERNS = EXPLICIT_PHRASES.map((phrase) => {
  const normalized = normalizeArabic(phrase);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return { phrase, re: new RegExp(escaped, "u") };
});

const MEN_ONLY_VENUE_RE = /(?:^|[\s،,.])((?:ديوان(?:يه|ية)?|مجلس\s+خاص))(?:[\s،,.]|$)/u;

function collectTextParts(input, options = {}) {
  const parts = [];
  if (typeof input === "string") {
    parts.push(input);
  } else if (Array.isArray(input)) {
    parts.push(...input.map(String));
  } else if (input && typeof input === "object") {
    for (const key of [
      "title",
      "description",
      "mosque",
      "location",
      "venue",
      "venueType",
      "venue_type",
      "womenSection",
      "women_section",
      "note",
      "schedule",
      "rawText",
      "raw_ocr_text",
    ]) {
      if (input[key]) parts.push(String(input[key]));
    }
    if (Array.isArray(input.keywords)) parts.push(...input.keywords.map(String));
    if (Array.isArray(input.linkedTitles)) parts.push(...input.linkedTitles.map(String));
    if (Array.isArray(input.linked_titles)) parts.push(...input.linked_titles.map(String));
  }
  if (options.venue) parts.push(String(options.venue));
  if (options.venueType) parts.push(String(options.venueType));
  return parts.filter(Boolean);
}

function splitSentences(rawText) {
  return String(rawText || "")
    .split(/(?<=[.!؟\n])|(?:\s—\s)|(?:\s-\s)/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractProofSentence(rawText, normalizedText) {
  for (const sentence of splitSentences(rawText)) {
    const n = normalizeArabic(sentence);
    for (const { re } of EXPLICIT_PATTERNS) {
      if (re.test(n)) return sentence.trim();
    }
  }
  for (const { phrase, re } of EXPLICIT_PATTERNS) {
    if (re.test(normalizedText)) {
      const idx = normalizedText.search(re);
      if (idx >= 0) {
        const snippet = rawText.slice(Math.max(0, idx - 20), idx + phrase.length + 40).trim();
        return snippet || phrase;
      }
      return phrase;
    }
  }
  return EXPLICIT_PHRASES[0];
}

/**
 * @returns {{ womenAttendance: "متاح" | "men_only", womenAttendanceNote?: string }}
 */
export function classifyWomenAttendance(input, options = {}) {
  const parts = collectTextParts(input, options);
  const rawText = parts.join("\n");
  const normalized = normalizeArabic(rawText);

  for (const { re } of EXPLICIT_PATTERNS) {
    if (re.test(normalized)) {
      return {
        womenAttendance: "متاح",
        womenAttendanceNote: extractProofSentence(rawText, normalized),
      };
    }
  }

  return { womenAttendance: "men_only" };
}

/** ديوان/ديوانية/مجلس خاص = رجالي افتراضياً ما لم يُثبت العكس بنص صريح */
export function isMenOnlyVenue(text) {
  return MEN_ONLY_VENUE_RE.test(normalizeArabic(text));
}

export function isWomenFriendlyLesson(lesson) {
  return lesson?.womenAttendance === "متاح";
}
