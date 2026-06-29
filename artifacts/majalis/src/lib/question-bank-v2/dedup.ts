/** Client-side dedup — mirrors lib/question-generation/dedup.mjs */

export function normalizeArabic(text: string): string {
  if (!text?.trim()) return "";
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function contentHash(question: string, answer: string): string {
  const payload = `${normalizeArabic(question)}|${normalizeArabic(answer)}`;
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    h = (Math.imul(31, h) + payload.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).padStart(8, "0");
}

export function tokenSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeArabic(a).split(/\s+/).filter(Boolean));
  const tb = new Set(normalizeArabic(b).split(/\s+/).filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

export type DedupHit = {
  duplicate: boolean;
  reason?: string;
  score?: number;
};

export function findDuplicate(
  candidate: { question: string; options?: string[]; correct_index?: number; content_hash?: string },
  existing: Array<{ question: string; options?: string[]; correct_index?: number; content_hash?: string }>,
  threshold = 0.92,
): DedupHit {
  const answer = candidate.options?.[candidate.correct_index ?? 0] ?? "";
  const hash = candidate.content_hash ?? contentHash(candidate.question, answer);
  const normQ = normalizeArabic(candidate.question);

  for (const ex of existing) {
    if (ex.content_hash && ex.content_hash === hash) {
      return { duplicate: true, reason: "content_hash", score: 1 };
    }
    if (normalizeArabic(ex.question) === normQ) {
      return { duplicate: true, reason: "same_wording", score: 1 };
    }
    const sim = tokenSimilarity(candidate.question, ex.question);
    if (sim >= threshold) {
      return { duplicate: true, reason: "semantic_similarity", score: sim };
    }
    const exAns = ex.options?.[ex.correct_index ?? 0] ?? "";
    if (answer && exAns && normalizeArabic(answer) === normalizeArabic(exAns) && normQ.length > 20) {
      const qSim = tokenSimilarity(candidate.question, ex.question);
      if (qSim >= 0.75) return { duplicate: true, reason: "same_answer_similar_question", score: qSim };
    }
  }
  return { duplicate: false };
}
