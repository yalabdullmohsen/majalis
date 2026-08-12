/**
 * Tiered retrieval — searches platform DB in scholarly priority order.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { unifiedSearch } from "../scholarly-intelligence/unified-search.mjs";
import { processQuery } from "../scholarly-intelligence/query-processor.mjs";
import { SEARCH_TIERS } from "./constants.mjs";
import { toCitation } from "./citations.mjs";

function tierForKind(kind) {
  const k = String(kind || "").toLowerCase();
  for (const tier of SEARCH_TIERS) {
    if (tier.kinds.some((t) => k.includes(t) || t.includes(k))) return tier;
  }
  return SEARCH_TIERS[SEARCH_TIERS.length - 1];
}

function normalizeItem(item, source = "search") {
  return {
    ...item,
    content_kind: item.content_kind || item.kind || item.content_type,
    source_layer: source,
  };
}

async function searchVerifiedCorpus(admin, query, limit = 8) {
  if (!admin) return [];
  const q = String(query || "").trim();
  if (!q) return [];

  const results = [];
  const term = q.slice(0, 60);
  const seen = new Set();

  const pushUnique = (item) => {
    const key = `${item.content_kind}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(item);
  };

  try {
    const { data: hadithText } = await admin
      .from("verified_hadith_items")
      .select("*")
      .is("deleted_at", null)
      .ilike("text", `%${term}%`)
      .limit(limit);

    for (const h of hadithText ?? []) {
      pushUnique(normalizeItem({
        id: h.id,
        content_kind: "verified_hadith",
        kind: "hadith",
        title: h.title || h.text?.slice(0, 80),
        text: h.text,
        source_name: h.source_name,
        source_url: h.source_url,
        book_title: h.source_name,
        hadith_number: h.hadith_number,
        hadith_grade: h.grade,
        grade: h.grade,
        chapter: h.chapter,
        author_name: h.scholar,
        verification_status: h.verification_status,
        trust_level: h.trust_level,
        quality_score: h.quality_score,
        global_ref_id: h.global_ref_id,
        updated_at: h.updated_at,
      }, "verified_db"));
    }

    const { data: hadithTitle } = await admin
      .from("verified_hadith_items")
      .select("*")
      .is("deleted_at", null)
      .ilike("title", `%${term}%`)
      .limit(limit);

    for (const h of hadithTitle ?? []) {
      pushUnique(normalizeItem({
        id: h.id,
        content_kind: "verified_hadith",
        kind: "hadith",
        title: h.title || h.text?.slice(0, 80),
        text: h.text,
        source_name: h.source_name,
        source_url: h.source_url,
        book_title: h.source_name,
        hadith_number: h.hadith_number,
        hadith_grade: h.grade,
        grade: h.grade,
        chapter: h.chapter,
        author_name: h.scholar,
        verification_status: h.verification_status,
        trust_level: h.trust_level,
        quality_score: h.quality_score,
        global_ref_id: h.global_ref_id,
        updated_at: h.updated_at,
      }, "verified_db"));
    }

    const { data: adhkar } = await admin
      .from("verified_adhkar_items")
      .select("*")
      .is("deleted_at", null)
      .ilike("text", `%${term}%`)
      .limit(limit);

    for (const a of adhkar ?? []) {
      pushUnique(normalizeItem({
        id: a.id,
        content_kind: "verified_adhkar",
        kind: "adhkar",
        title: a.text?.slice(0, 80),
        text: a.text,
        source_name: a.source_name,
        source_url: a.source_url,
        book_title: a.source_name,
        author_name: a.narrator,
        hadith_grade: a.grade,
        grade: a.grade,
        verification_status: a.verification_status,
        trust_level: a.trust_level,
        global_ref_id: a.global_ref_id,
        updated_at: a.updated_at,
      }, "verified_db"));
    }
  } catch {
    /* tables may not exist yet */
  }

  return results;
}

export async function retrieveEvidence(query, opts = {}) {
  const admin = opts.admin ?? getSupabaseAdmin();
  const limit = Math.min(Number(opts.limit || 30), 60);
  const queryInfo = processQuery(query);

  const [searchResult, verifiedItems] = await Promise.all([
    unifiedSearch({
      query: queryInfo.searchString || query,
      limit,
      skipCache: opts.skipCache === true,
      sessionId: opts.sessionId,
    }),
    searchVerifiedCorpus(admin, queryInfo.searchString || query, 10),
  ]);

  const seen = new Set();
  const tierBuckets = {};
  const allItems = [];

  for (const tier of SEARCH_TIERS) {
    tierBuckets[tier.tier] = { ...tier, items: [] };
  }

  const merge = (items, source) => {
    for (const raw of items) {
      const item = normalizeItem(raw, source);
      const key = `${item.content_kind}:${item.id || item.slug || item.title}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const tier = tierForKind(item.content_kind || item.kind);
      tierBuckets[tier.tier].items.push(item);
      allItems.push({ ...item, _tier: tier });
    }
  };

  merge(verifiedItems, "verified_db");
  merge(searchResult.results || [], "unified_search");

  const tiers = Object.values(tierBuckets)
    .filter((t) => t.items.length > 0)
    .sort((a, b) => a.tier - b.tier);

  const citations = allItems
    .slice(0, limit)
    .map((item) => toCitation(item, item._tier));

  return {
    query,
    query_info: searchResult.query_info || { normalized: queryInfo.normalized },
    tiers,
    items: allItems.slice(0, limit),
    citations,
    topics: searchResult.topics || [],
    count: allItems.length,
  };
}
