/**
 * Match extracted sheikh name to existing DB records.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { matchScholarByName } from "../scholar-automation-registry.mjs";

function normalizeName(name) {
  return String(name || "")
    .trim()
    .replace(/^(الشيخ|فضيلة|معالي|د\.|دكتور)\s+/u, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function scoreMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const partsA = na.split(" ");
  const partsB = nb.split(" ");
  const overlap = partsA.filter((p) => partsB.some((q) => q.includes(p) || p.includes(q))).length;
  return overlap / Math.max(partsA.length, partsB.length, 1);
}

export async function matchSheikhByName(name) {
  const registryMatch = matchScholarByName(name);
  if (registryMatch.matched) {
    return {
      matched: {
        id: registryMatch.matched.id,
        name: registryMatch.matched.name,
        city: registryMatch.matched.city,
        is_verified: registryMatch.matched.is_verified,
        external_key: registryMatch.matched.external_key,
        source: "registry",
      },
      score: registryMatch.score,
      proposedDraft: null,
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin || !name?.trim()) {
    return { matched: null, proposedDraft: name ? { name: name.trim(), status: "draft" } : null };
  }

  const { data: sheikhs } = await admin.from("sheikhs").select("id, name, city, is_verified").limit(500);
  const list = sheikhs || [];

  let best = null;
  let bestScore = 0;
  for (const s of list) {
    const sc = scoreMatch(name, s.name);
    if (sc > bestScore) {
      bestScore = sc;
      best = s;
    }
  }

  if (best && bestScore >= 0.72) {
    return { matched: best, score: bestScore, proposedDraft: null };
  }

  return {
    matched: null,
    score: bestScore,
    proposedDraft: {
      name: String(name).trim(),
      status: "pending",
      is_verified: false,
      needs_verification: true,
    },
  };
}
