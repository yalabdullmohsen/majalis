import type { FiqhCouncilItem } from "./fiqh-council-types";

export type RelationMatch = {
  relatedItemId: string;
  relatedSlug: string;
  score: number;
  reasons: string[];
  relationType: "similar" | "related" | "same_topic" | "same_source" | "same_category";
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

function inferRelationType(reasons: string[]): RelationMatch["relationType"] {
  if (reasons.includes("same_source")) return "same_source";
  if (reasons.includes("same_category") || reasons.includes("category")) return "same_category";
  if (reasons.includes("title_exact") || reasons.includes("title_similar")) return "similar";
  if (reasons.includes("nawazil_topic")) return "same_topic";
  return "related";
}

/** اكتشاف علاقات محتملة بين مواد المجمع الفقهي — لا تُنشر مباشرة */
export function findPotentialRelations(
  item: FiqhCouncilItem,
  existing: FiqhCouncilItem[],
  threshold = 0.55,
): RelationMatch[] {
  const matches: RelationMatch[] = [];

  for (const other of existing) {
    if (other.id === item.id) continue;

    const reasons: string[] = [];
    let score = 0;

    if (item.decision_number && other.decision_number && item.decision_number === other.decision_number) {
      score = Math.max(score, 0.95);
      reasons.push("decision_number");
    }

    if (item.source_url && other.source_url && item.source_url === other.source_url) {
      score = Math.max(score, 0.92);
      reasons.push("same_source");
    }

    if (item.source_name && other.source_name && item.source_name === other.source_name) {
      score += 0.12;
      reasons.push("same_source");
    }

    if (item.category && other.category && item.category === other.category) {
      score += 0.15;
      reasons.push("same_category");
    }

    if (item.subcategory && other.subcategory && item.subcategory === other.subcategory) {
      score += 0.08;
      reasons.push("subcategory");
    }

    if (item.nawazil_topic && other.nawazil_topic && item.nawazil_topic === other.nawazil_topic) {
      score += 0.2;
      reasons.push("nawazil_topic");
    }

    const titleScore = jaccard(tokenSet(item.title || ""), tokenSet(other.title || ""));
    if (titleScore >= 0.7) {
      score += titleScore * 0.35;
      reasons.push(titleScore >= 0.95 ? "title_exact" : "title_similar");
    }

    const tagScore = tagOverlap(item.tags, other.tags);
    if (tagScore >= 0.4) {
      score += tagScore * 0.2;
      reasons.push("tags");
    }

    const bodyA = tokenSet(
      [item.title, item.summary, item.ruling_text, item.content, ...(item.key_points || [])]
        .filter(Boolean)
        .join(" "),
    );
    const bodyB = tokenSet(
      [other.title, other.summary, other.ruling_text, other.content, ...(other.key_points || [])]
        .filter(Boolean)
        .join(" "),
    );
    const bodyScore = jaccard(bodyA, bodyB);
    if (bodyScore >= 0.35) {
      score += bodyScore * 0.25;
      reasons.push("content_similar");
    }

    score = Math.min(score, 1);

    if (score >= threshold && reasons.length > 0) {
      matches.push({
        relatedItemId: other.id,
        relatedSlug: other.slug,
        score,
        reasons,
        relationType: inferRelationType(reasons),
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

/** مسح كامل لاقتراح علاقات بين جميع العناصر */
export function scanAllPotentialRelations(
  items: FiqhCouncilItem[],
  threshold = 0.55,
): Array<{ itemId: string; match: RelationMatch }> {
  const results: Array<{ itemId: string; match: RelationMatch }> = [];
  const seen = new Set<string>();

  for (const item of items) {
    const matches = findPotentialRelations(item, items, threshold);
    for (const match of matches) {
      const key = [item.id, match.relatedItemId].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ itemId: item.id, match });
    }
  }

  return results.sort((a, b) => b.match.score - a.match.score);
}
