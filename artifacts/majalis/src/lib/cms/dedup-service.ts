import { normalizeArabic } from "@/lib/arabic-search";
import type { CmsContentKind, CmsContentRecord, DedupMatch, DedupResult } from "./content-types";
import { contentHash, slugify, tokenSimilarity } from "./normalize";
import { getContentConfig } from "./content-registry";

export type DedupCandidate = {
  id: string;
  table: string;
  external_key?: string;
  slug?: string;
  title: string;
  speaker_name?: string;
  content_hash?: string;
};

const FUZZY_TITLE_THRESHOLD = 0.82;
const FUZZY_SPEAKER_THRESHOLD = 0.75;

export function buildContentFingerprint(record: CmsContentRecord): {
  hash: string;
  slug: string;
  titleNorm: string;
  speakerNorm: string;
} {
  const titleNorm = normalizeArabic(record.title);
  const speakerNorm = normalizeArabic(record.speaker_name || "");
  const slug = record.slug || slugify(record.title);
  const hash = contentHash([record.kind, titleNorm, speakerNorm, normalizeArabic(record.body || "").slice(0, 200)]);
  return { hash, slug, titleNorm, speakerNorm };
}

export function detectDuplicates(
  record: CmsContentRecord,
  candidates: DedupCandidate[],
): DedupResult {
  const { hash, slug, titleNorm, speakerNorm } = buildContentFingerprint(record);
  const matches: DedupMatch[] = [];

  for (const c of candidates) {
    if (record.external_key && c.external_key && record.external_key === c.external_key) {
      matches.push({
        matchType: "external_key",
        existingId: c.id,
        existingTable: c.table,
        score: 1,
        external_key: c.external_key,
      });
      continue;
    }

    if (slug && c.slug && slug === c.slug) {
      matches.push({
        matchType: "slug",
        existingId: c.id,
        existingTable: c.table,
        score: 0.98,
      });
      continue;
    }

    if (c.content_hash && c.content_hash === hash) {
      matches.push({
        matchType: "hash",
        existingId: c.id,
        existingTable: c.table,
        score: 1,
      });
      continue;
    }

    const cTitleNorm = normalizeArabic(c.title);
    const titleScore = tokenSimilarity(titleNorm, cTitleNorm);
    const cSpeakerNorm = normalizeArabic(c.speaker_name || "");
    const speakerScore = speakerNorm && cSpeakerNorm ? tokenSimilarity(speakerNorm, cSpeakerNorm) : 1;

    if (titleScore >= FUZZY_TITLE_THRESHOLD && speakerScore >= FUZZY_SPEAKER_THRESHOLD) {
      matches.push({
        matchType: speakerNorm ? "title_speaker" : "fuzzy_title",
        existingId: c.id,
        existingTable: c.table,
        score: (titleScore + speakerScore) / 2,
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return {
    isDuplicate: matches.length > 0 && matches[0].score >= FUZZY_TITLE_THRESHOLD,
    matches,
    contentHash: hash,
    slug,
    titleNorm,
    speakerNorm,
  };
}

/** Build external_key when missing — deterministic from kind + title + speaker. */
export function ensureExternalKey(record: CmsContentRecord): string {
  if (record.external_key?.trim()) return record.external_key.trim();
  const config = getContentConfig(record.kind);
  const base = slugify(`${config.kind}-${record.title}-${record.speaker_name || ""}`);
  return base.slice(0, 120);
}

export function mergeDuplicateRecords(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  preferIncomingFields: string[] = ["description", "body", "summary", "source_urls"],
): Record<string, unknown> {
  const merged = { ...existing };
  for (const field of preferIncomingFields) {
    if (incoming[field] != null && incoming[field] !== "") {
      merged[field] = incoming[field];
    }
  }
  return merged;
}

/** Load dedup candidates from seed data for offline mode. */
export function seedDedupCandidates(kind: CmsContentKind, seeds: Array<{ id: string; title?: string; name?: string; question?: string; text?: string; external_key?: string; speaker_name?: string }>): DedupCandidate[] {
  const config = getContentConfig(kind);
  return seeds.map((s) => ({
    id: s.id,
    table: config.table,
    external_key: s.external_key,
    title: s.title || s.name || s.question || s.text || "",
    speaker_name: s.speaker_name,
  }));
}
