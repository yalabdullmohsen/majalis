/**
 * Shared fawaid quality + cleanup rules (import pipeline, purge, publisher).
 */
import { containsBlockedContentMarker } from "./content-sanitizer.mjs";
import { isQuizLikeFawaidText } from "../content-import/fawaid-quality.mjs";

export { isQuizLikeFawaidText };

/**
 * @param {string} text
 */
export function isBlockedFawaidText(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  if (containsBlockedContentMarker(t)) return true;
  if (isQuizLikeFawaidText(t)) return true;
  if (/^فائدة:\s/i.test(t)) return true;
  if (/\?\s*$/.test(t) && /(?:من|ما|في|إلى|كم|أين|متى|هل)\s/i.test(t)) return true;
  return false;
}

/**
 * @param {object} row
 */
export function shouldPurgeFawaidRow(row) {
  const text = String(row.text || "").trim();
  if (!text) return true;
  if (isBlockedFawaidText(text)) return true;
  const author = String(row.author_name || "").trim();
  if (author && isBlockedFawaidText(author)) return true;
  return false;
}

/**
 * Extract QA candidate from misclassified fawaid row.
 * @param {object} row
 */
export function fawaidRowToQaCandidate(row) {
  const text = String(row.text || "").trim();
  const quizMatch = text.match(/^فائدة:\s*(.+?)\s—\s*(.+?\?)\s*(?:\[import-\d+\])?\s*$/i);
  if (!quizMatch) return null;
  return {
    question: quizMatch[2].trim(),
    answer: quizMatch[1].trim(),
    source_fawaid_id: row.id,
  };
}
