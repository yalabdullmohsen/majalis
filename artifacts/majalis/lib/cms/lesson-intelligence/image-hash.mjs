/**
 * Simple perceptual hash (dHash) + SHA-256 + embedding stub.
 */
import { createHash } from "node:crypto";
import { fuzzySimilarity, tokenOverlapScore } from "./text-utils.mjs";

export function sha256ImageHash(buffer) {
  if (!buffer?.length) return null;
  return createHash("sha256").update(buffer).digest("hex").slice(0, 32);
}

export function computeDHash(buffer) {
  if (!buffer?.length || buffer.length < 64) return null;
  try {
    const sample = buffer.slice(0, Math.min(buffer.length, 4096));
    let hash = 0n;
    for (let i = 0; i < 63; i++) {
      if (sample[i] > sample[i + 1]) hash |= 1n << BigInt(i % 63);
    }
    return hash.toString(16).padStart(16, "0");
  } catch {
    return null;
  }
}

export function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) + ((x >> 3) & 1);
  }
  return dist;
}

export function perceptualSimilarity(hashA, hashB) {
  if (!hashA || !hashB) return 0;
  const dist = hammingDistance(hashA, hashB);
  return Math.max(0, 1 - dist / 64);
}

/** Embedding stub — fuzzy + token overlap until vector DB is wired. */
export function computeEmbeddingSimilarity(textA, textB) {
  return Math.max(fuzzySimilarity(textA, textB), tokenOverlapScore(textA, textB));
}
