/**
 * Match mosque name to existing DB records; create if missing.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

function normalizeName(name) {
  return String(name || "")
    .trim()
    .replace(/^(مسجد|جامع|مصلى)\s+/u, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function scoreMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.88;
  const partsA = na.split(" ");
  const partsB = nb.split(" ");
  const overlap = partsA.filter((p) => partsB.some((q) => q.includes(p) || p.includes(q))).length;
  return overlap / Math.max(partsA.length, partsB.length, 1);
}

export async function matchMosqueByName(name, { city, region, country } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin || !name?.trim()) {
    return { matched: null, proposedDraft: name ? { name: name.trim() } : null };
  }

  let list = [];
  try {
    const { data } = await admin.from("mosques").select("id, name, city, region, country").limit(500);
    list = data || [];
  } catch {
    return { matched: null, proposedDraft: { name: name.trim(), city, region, country } };
  }

  let best = null;
  let bestScore = 0;
  for (const m of list) {
    const sc = scoreMatch(name, m.name);
    if (sc > bestScore) {
      bestScore = sc;
      best = m;
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
      city: city || "العاصمة",
      region: region || null,
      country: country || "الكويت",
      status: "pending",
    },
  };
}

export async function resolveMosqueIdForLesson(parsed, source) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const mosqueName = parsed.mosque || parsed.location || source?.name;
  if (!mosqueName) return null;

  const match = await matchMosqueByName(mosqueName, {
    city: parsed.city || source?.city,
    region: parsed.region,
    country: parsed.country || source?.country,
  });

  if (match.matched?.id) return match.matched.id;

  if (match.proposedDraft?.name) {
    try {
      const { data } = await admin
        .from("mosques")
        .insert({
          name: match.proposedDraft.name,
          city: match.proposedDraft.city,
          region: match.proposedDraft.region,
          country: match.proposedDraft.country,
        })
        .select("id")
        .single();
      return data?.id || null;
    } catch {
      return null;
    }
  }

  return null;
}
