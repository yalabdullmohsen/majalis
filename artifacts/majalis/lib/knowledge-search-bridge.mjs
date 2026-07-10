/**
 * Bridge for server-side platform search (FTS fallback without client imports).
 */

import { getSupabaseAdmin } from "./supabase-admin.mjs";

function normalizeText(t) {
  return String(t || "")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // \u062A\u0634\u0643\u064A\u0644 + \u062A\u0637\u0648\u064A\u0644
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")                      // \u0647\u0645\u0632\u0627\u062A \u2192 \u0623\u0644\u0641
    .replace(/[\u0624]/g, "\u0648")                          // \u0648\u0627\u0648 \u0647\u0645\u0632\u0629
    .replace(/[\u0626]/g, "\u064A")                          // \u064A\u0627\u0621 \u0647\u0645\u0632\u0629
    .replace(/[\u0629]/g, "\u0647")                          // \u062A\u0627\u0621 \u0645\u0631\u0628\u0648\u0637\u0629
    .replace(/[\u0649]/g, "\u064A")                          // \u0623\u0644\u0641 \u0645\u0642\u0635\u0648\u0631\u0629
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function compactText(t) {
  return normalizeText(t).replace(/\s+/g, "");
}

function matchAny(fields, query) {
  const q = normalizeText(query);
  const qCompact = compactText(query);
  if (!q && !qCompact) return false;
  return fields.some((f) => {
    const n = normalizeText(f);
    const c = compactText(f);
    return (q && n.includes(q)) || (qCompact && c.includes(qCompact));
  });
}

function collectRpcResults(data, limit) {
  const results = [];
  if (!data || typeof data !== "object") return results;
  for (const [kind, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    for (const item of items.slice(0, limit)) {
      results.push({ ...item, kind, rank: 5 });
    }
  }
  return results.slice(0, limit);
}

async function searchPlatformFallback(admin, query, limit) {
  const [{ data: lessons }, { data: qa }, { data: library }, { data: autoContent }, { data: hadith }, { data: stories }] = await Promise.all([
    admin.from("lessons").select("id, title, description, category, external_key").eq("status", "approved").limit(limit * 3),
    admin.from("qa_questions").select("id, question, answer, status").eq("status", "published").limit(limit * 3),
    admin.from("library_items").select("id, title, description, category, type").eq("status", "approved").limit(limit * 3),
    admin
      .from("auto_imported_content")
      .select("id, title, summary, slug, content_type, source_name")
      .eq("status", "published")
      .eq("verification_status", "verified")
      .limit(limit * 2),
    admin.from("verified_hadith_items").select("id, title, text, narrator, collection").eq("status", "published").limit(limit),
    admin.from("akp_stories").select("id, title, topic, summary, category").eq("status", "published").limit(limit),
  ]);

  const lessonResults = (lessons || [])
    .filter((l) => matchAny([l.title, l.description, l.category, l.external_key], query))
    .map((l) => ({
      ...l,
      kind: "lesson",
      href: `/lessons/${l.external_key || l.id}`,
      rank: 3,
    }));

  const qaResults = (qa || [])
    .filter((q) => matchAny([q.question, q.answer], query))
    .map((q) => ({
      id: q.id,
      title: q.question,
      summary: q.answer?.slice(0, 160),
      kind: "qa",
      href: `/qa#${q.id}`,
      rank: 4,
    }));

  const libraryResults = (library || [])
    .filter((b) => matchAny([b.title, b.description, b.category, b.type], query))
    .map((b) => ({
      id: b.id,
      title: b.title,
      summary: b.description,
      kind: "library",
      href: `/library#${b.id}`,
      rank: 3,
    }));

  const autoResults = (autoContent || [])
    .filter((item) => matchAny([item.title, item.summary, item.source_name, item.content_type], query))
    .map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      kind: item.content_type || "update",
      slug: item.slug,
      href: `/updates/auto/${item.slug}`,
      rank: 6,
    }));

  const hadithResults = (hadith || [])
    .filter((h) => matchAny([h.title, h.text, h.narrator, h.collection], query))
    .map((h) => ({
      id: h.id,
      title: h.title || h.text?.slice(0, 100),
      summary: h.narrator ? `الراوي: ${h.narrator}` : undefined,
      kind: "hadith",
      href: "/hadith",
      rank: 5,
    }));

  const storiesResults = (stories || [])
    .filter((s) => matchAny([s.title, s.topic, s.summary, s.category], query))
    .map((s) => ({
      id: s.id,
      title: s.title,
      summary: s.summary?.slice(0, 160),
      kind: "story",
      href: "/stories",
      rank: 4,
    }));

  return [...autoResults, ...lessonResults, ...qaResults, ...hadithResults, ...storiesResults, ...libraryResults]
    .sort((a, b) => (b.rank || 0) - (a.rank || 0))
    .slice(0, limit);
}

export async function searchEverything(query, limit = 20) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  let rpcResults = [];
  try {
    const { data } = await admin.rpc("search_platform", { query });
    rpcResults = collectRpcResults(data, limit);
  } catch {
    /* use fallback */
  }

  if (rpcResults.length >= limit) return rpcResults;

  const fallbackResults = await searchPlatformFallback(admin, query, limit);
  const seen = new Set(rpcResults.map((r) => `${r.kind}:${r.id}`));
  const merged = [...rpcResults];
  for (const row of fallbackResults) {
    const key = `${row.kind}:${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }

  return merged.sort((a, b) => (b.rank || 0) - (a.rank || 0)).slice(0, limit);
}
