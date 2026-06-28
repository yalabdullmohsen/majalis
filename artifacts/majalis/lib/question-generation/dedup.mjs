import crypto from "node:crypto";
import { EMBEDDING_SIMILARITY_THRESHOLD } from "./config.mjs";
import { getEnvConfig } from "../env-config.mjs";

/** @type {object[]} */
let corpus = [];

/**
 * Normalize Arabic text for comparison.
 * @param {string} text
 */
export function normalizeArabic(text) {
  if (!text || typeof text !== "string") return "";
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

/**
 * @param {string} question
 * @param {string} [answer]
 */
export function questionContentHash(question, answer = "") {
  const payload = `${normalizeArabic(question)}|${normalizeArabic(answer)}`;
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex").slice(0, 32);
}

/**
 * Token overlap similarity 0-1
 * @param {string} a
 * @param {string} b
 */
export function tokenSimilarity(a, b) {
  const ta = new Set(normalizeArabic(a).split(/\s+/).filter(Boolean));
  const tb = new Set(normalizeArabic(b).split(/\s+/).filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) {
    if (tb.has(t)) inter++;
  }
  return inter / Math.max(ta.size, tb.size);
}

/**
 * Cosine similarity for embedding vectors
 * @param {number[]} a
 * @param {number[]} b
 */
export function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * @param {object} candidate
 * @param {object[]} existing
 */
export function findDuplicate(candidate, existing) {
  const hash = candidate.content_hash || questionContentHash(
    candidate.question,
    candidate.correct_answer || candidate.options?.[candidate.correct_index],
  );
  const normQ = normalizeArabic(candidate.question);
  const normA = normalizeArabic(candidate.correct_answer || candidate.options?.[candidate.correct_index] || "");
  const ref = (candidate.source_reference || "").trim();

  for (const ex of existing) {
    if (ex.content_hash && ex.content_hash === hash) {
      return { duplicate: true, reason: "content_hash", score: 1, matchId: ex.id };
    }

    const exQ = normalizeArabic(ex.question || "");
    const exA = normalizeArabic(ex.correct_answer || ex.answer || "");

    if (normQ === exQ) {
      return { duplicate: true, reason: "same_wording", score: 1, matchId: ex.id };
    }

    if (normA && exA && normA === exA && normA.length > 3) {
      return { duplicate: true, reason: "same_answer", score: 0.98, matchId: ex.id };
    }

    const qSim = tokenSimilarity(normQ, exQ);
    if (qSim >= 0.92) {
      return { duplicate: true, reason: "same_meaning", score: qSim, matchId: ex.id };
    }

    const exRef = (ex.source_reference || ex.reference || "").trim();
    if (ref && exRef && ref === exRef) {
      return { duplicate: true, reason: "same_reference", score: 1, matchId: ex.id };
    }

    if (candidate.embedding && ex.embedding) {
      const embA = Array.isArray(ex.embedding) ? ex.embedding : ex.embedding?.vector;
      if (embA) {
        const sim = cosineSimilarity(candidate.embedding, embA);
        if (sim > EMBEDDING_SIMILARITY_THRESHOLD) {
          return { duplicate: true, reason: "embedding_similarity", score: sim, matchId: ex.id };
        }
      }
    }
  }

  return { duplicate: false, reason: null, score: 0, matchId: null, hash };
}

export async function loadDedupIndex(admin) {
  const { data } = await admin
    .from("sin_jeem_questions")
    .select("id, question, correct_answer, content_hash, source_reference, embedding")
    .limit(15000);

  corpus = (data || []).map((row) => ({
    id: row.id,
    question: row.question,
    correct_answer: row.correct_answer,
    content_hash: row.content_hash,
    source_reference: row.source_reference,
    embedding: row.embedding,
  }));
}

async function fetchEmbedding(text) {
  const { openaiKey } = getEnvConfig();
  if (!openaiKey || !text?.trim()) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

/**
 * @param {object} candidate
 * @param {import("@supabase/supabase-js").SupabaseClient} admin
 */
export async function checkDuplicate(candidate, admin) {
  if (!corpus.length) {
    await loadDedupIndex(admin);
  }

  const answer = candidate.correct_answer || candidate.options?.[candidate.correct_index] || "";
  const hash = questionContentHash(candidate.question, answer);
  const embedding = await fetchEmbedding(`${candidate.question}\n${answer}`);

  const result = findDuplicate({ ...candidate, content_hash: hash, embedding }, corpus);

  return {
    duplicate: result.duplicate,
    reason: result.reason,
    hash,
    embedding,
    score: result.score,
    matchId: result.matchId,
  };
}

export function registerCandidate(candidate, hash, embedding) {
  corpus.push({
    id: `local-${corpus.length}`,
    question: candidate.question,
    correct_answer: candidate.correct_answer || candidate.options?.[candidate.correct_index],
    content_hash: hash,
    source_reference: candidate.source_reference,
    embedding,
  });
}
