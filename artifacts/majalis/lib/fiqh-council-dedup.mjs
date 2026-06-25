/** Duplicate detection for Node sync engine (mirrors fiqh-council-dedup.ts) */

function normalize(s) {
  return String(s || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim()
    .toLowerCase();
}

function tokenSet(text) {
  return new Set(
    normalize(text)
      .split(/[\s،,.؛;:!?\-]+/)
      .filter((w) => w.length > 2),
  );
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function findPotentialDuplicates(incoming, existing, threshold = 0.72) {
  const matches = [];

  for (const item of existing) {
    if (item.id === incoming.id) continue;
    const reasons = [];
    let score = 0;

    if (incoming.source_url && item.source_url && incoming.source_url === item.source_url) {
      matches.push({ candidateId: item.id, candidateSlug: item.slug, score: 1, reasons: ["source_url"] });
      continue;
    }

    if (incoming.content_hash && item.content_hash && incoming.content_hash === item.content_hash) {
      score = 0.98;
      reasons.push("content_hash");
    }

    const titleA = normalize(incoming.title);
    const titleB = normalize(item.title);
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

    score = Math.min(score, 1);

    if (score >= threshold && reasons.length > 0) {
      matches.push({ candidateId: item.id, candidateSlug: item.slug, score, reasons });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
