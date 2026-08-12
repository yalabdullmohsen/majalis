import type { FiqhCouncilItem } from "./fiqh-council-types";

export type DuplicateMatch = {
  candidateId: string;
  candidateSlug: string;
  score: number;
  reasons: string[];
};

const ARABIC_NORMALIZE = (s: string) =>
  s
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim()
    .toLowerCase();

function tokenSet(text: string): Set<string> {
  return new Set(
    ARABIC_NORMALIZE(text)
      .split(/[\s،,.؛;:!?-]+/)
      .filter((w) => w.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function tagOverlap(a: string[] = [], b: string[] = []): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b.map(ARABIC_NORMALIZE));
  let match = 0;
  for (const t of a) if (setB.has(ARABIC_NORMALIZE(t))) match += 1;
  return match / Math.max(a.length, b.length);
}

/** Detect potential duplicates against existing items */
export function findPotentialDuplicates(
  incoming: Pick<
    FiqhCouncilItem,
    "id" | "slug" | "title" | "source_url" | "session_number" | "session_date" | "tags" | "content_hash" | "summary" | "content"
  >,
  existing: FiqhCouncilItem[],
  threshold = 0.72,
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const item of existing) {
    if (item.id === incoming.id) continue;

    const reasons: string[] = [];
    let score = 0;

    if (incoming.source_url && item.source_url && incoming.source_url === item.source_url) {
      score = 1;
      reasons.push("source_url");
      matches.push({ candidateId: item.id, candidateSlug: item.slug, score, reasons });
      continue;
    }

    if (incoming.content_hash && item.content_hash && incoming.content_hash === item.content_hash) {
      score = 0.98;
      reasons.push("content_hash");
    }

    const titleA = ARABIC_NORMALIZE(incoming.title || "");
    const titleB = ARABIC_NORMALIZE(item.title || "");
    if (titleA && titleB && titleA === titleB) {
      score = Math.max(score, 0.9);
      reasons.push("title_exact");
    } else {
      const tScore = jaccard(tokenSet(incoming.title || ""), tokenSet(item.title || ""));
      if (tScore >= 0.75) {
        score = Math.max(score, tScore * 0.85);
        reasons.push("title_similar");
      }
    }

    if (incoming.session_number && item.session_number && incoming.session_number === item.session_number) {
      score += 0.15;
      reasons.push("session_number");
    }

    if (incoming.session_date && item.session_date && incoming.session_date === item.session_date) {
      score += 0.08;
      reasons.push("session_date");
    }

    const tagScore = tagOverlap(incoming.tags, item.tags);
    if (tagScore >= 0.5) {
      score += tagScore * 0.12;
      reasons.push("tags");
    }

    const bodyA = tokenSet([incoming.summary, incoming.content].filter(Boolean).join(" "));
    const bodyB = tokenSet([item.summary, item.content].filter(Boolean).join(" "));
    const bodyScore = jaccard(bodyA, bodyB);
    if (bodyScore >= 0.6) {
      score += bodyScore * 0.2;
      reasons.push("content_similar");
    }

    score = Math.min(score, 1);

    if (score >= threshold && reasons.length > 0) {
      matches.push({ candidateId: item.id, candidateSlug: item.slug, score, reasons });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
