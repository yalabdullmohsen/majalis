/**
 * Semantic layer — OpenAI embeddings when available, local fallback always.
 */
import { generateEmbedding } from "../knowledge-engine/indexer.mjs";
import { tokenOverlapSimilarity, tokenize } from "./normalize.mjs";

/** Local semantic fingerprint (no API). */
export function buildSemanticFingerprint(text) {
  const tokens = tokenize(text);
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 32);
  return Object.fromEntries(sorted);
}

export function semanticSimilarityLocal(a, b) {
  const fa = typeof a === "object" ? a : buildSemanticFingerprint(a);
  const fb = typeof b === "object" ? b : buildSemanticFingerprint(b);
  const keys = new Set([...Object.keys(fa), ...Object.keys(fb)]);
  if (!keys.size) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k of keys) {
    const va = fa[k] || 0;
    const vb = fb[k] || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (!na || !nb) return tokenOverlapSimilarity(String(a), String(b));
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function getSemanticEmbedding(text) {
  const trimmed = String(text || "").slice(0, 4000);
  if (!trimmed) return { mode: "none", embedding: null, fingerprint: null };

  if (process.env.OPENAI_API_KEY) {
    const embedding = await generateEmbedding(trimmed);
    if (embedding) {
      return { mode: "openai", embedding, fingerprint: buildSemanticFingerprint(trimmed) };
    }
  }

  return { mode: "local", embedding: null, fingerprint: buildSemanticFingerprint(trimmed) };
}

export function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function compareSemantic(textA, textB, storedEmbedding = null) {
  const semanticA = await getSemanticEmbedding(textA);
  const semanticB = await getSemanticEmbedding(textB);

  if (semanticA.embedding && (storedEmbedding || semanticB.embedding)) {
    const target = storedEmbedding || semanticB.embedding;
    const sim = cosineSimilarity(semanticA.embedding, target);
    return { similarity: sim, mode: "embedding" };
  }

  const sim = semanticSimilarityLocal(semanticA.fingerprint, semanticB.fingerprint);
  return { similarity: sim, mode: "local" };
}
