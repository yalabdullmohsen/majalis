import { normalizeArabic } from "@/lib/arabic-search";
import type { CmsContentRecord, DedupMatch, DedupResult } from "./content-types";
import { buildContentFingerprint, detectDuplicates, type DedupCandidate } from "./dedup-service";
import { contentHash, tokenSimilarity } from "./normalize";

export type UnifiedDedupOptions = {
  sourceUrl?: string;
  embeddingVector?: number[];
  embeddingThreshold?: number;
};

const SOURCE_URL_THRESHOLD = 1;
const SEMANTIC_THRESHOLD = 0.88;

/** Cosine similarity for embedding vectors (when available). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Normalize source URL for dedup (strip query/fragment). */
export function normalizeSourceUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.search = "";
    return parsed.href.toLowerCase().replace(/\/$/, "");
  } catch {
    return url.trim().toLowerCase();
  }
}

export type ExtendedDedupCandidate = DedupCandidate & {
  source_url?: string;
  embedding?: number[];
};

/** Unified dedup: content hash + external key + source URL + semantic similarity. */
export function detectUnifiedDuplicates(
  record: CmsContentRecord,
  candidates: ExtendedDedupCandidate[],
  options: UnifiedDedupOptions = {},
): DedupResult {
  const base = detectDuplicates(record, candidates);
  const matches: DedupMatch[] = [...base.matches];

  const sourceUrl = options.sourceUrl || record.source_urls?.[0];
  if (sourceUrl) {
    const normUrl = normalizeSourceUrl(sourceUrl);
    for (const c of candidates) {
      if (!c.source_url) continue;
      if (normalizeSourceUrl(c.source_url) === normUrl) {
        matches.push({
          matchType: "external_key",
          existingId: c.id,
          existingTable: c.table,
          score: SOURCE_URL_THRESHOLD,
          external_key: c.external_key,
        });
      }
    }
  }

  if (options.embeddingVector?.length) {
    const threshold = options.embeddingThreshold ?? SEMANTIC_THRESHOLD;
    const { titleNorm, speakerNorm } = buildContentFingerprint(record);
    for (const c of candidates) {
      if (c.embedding?.length) {
        const sim = cosineSimilarity(options.embeddingVector, c.embedding);
        if (sim >= threshold) {
          matches.push({
            matchType: "fuzzy_title",
            existingId: c.id,
            existingTable: c.table,
            score: sim,
          });
        }
      } else {
        const cTitleNorm = normalizeArabic(c.title);
        const titleScore = tokenSimilarity(titleNorm, cTitleNorm);
        const cSpeakerNorm = normalizeArabic(c.speaker_name || "");
        const speakerScore = speakerNorm && cSpeakerNorm ? tokenSimilarity(speakerNorm, cSpeakerNorm) : 1;
        const combined = (titleScore + speakerScore) / 2;
        if (combined >= threshold) {
          matches.push({
            matchType: speakerNorm ? "title_speaker" : "fuzzy_title",
            existingId: c.id,
            existingTable: c.table,
            score: combined,
          });
        }
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const dedupedMatches = dedupeMatchList(matches);

  return {
    isDuplicate: dedupedMatches.length > 0 && dedupedMatches[0].score >= 0.82,
    matches: dedupedMatches,
    contentHash: base.contentHash,
    slug: base.slug,
    titleNorm: base.titleNorm,
    speakerNorm: base.speakerNorm,
  };
}

function dedupeMatchList(matches: DedupMatch[]): DedupMatch[] {
  const seen = new Set<string>();
  const out: DedupMatch[] = [];
  for (const m of matches) {
    const key = `${m.existingTable}:${m.existingId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

/** Build stable content hash including source URL when present. */
export function unifiedContentHash(record: CmsContentRecord, sourceUrl?: string): string {
  const fp = buildContentFingerprint(record);
  if (sourceUrl) {
    return contentHash([fp.hash, normalizeSourceUrl(sourceUrl)]);
  }
  return fp.hash;
}
