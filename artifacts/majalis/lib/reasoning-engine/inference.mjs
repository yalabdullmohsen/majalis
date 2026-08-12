/**
 * Relation inference — auto-link entities in the knowledge graph.
 */

import { createRelation } from "../global-reference/relations.mjs";
import { registerGlobalRef, buildGlobalRef, identityFromItem } from "../global-reference/ids.mjs";
import { matchTopicsToContent } from "../scholarly-intelligence/topics.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

async function linkIfNew(admin, fromRefId, toRefId, relationType, metadata = {}) {
  if (!fromRefId || !toRefId || fromRefId === toRefId) return false;
  const result = await createRelation(admin, {
    fromRefId,
    toRefId,
    relationType,
    score: metadata.relevance_score ?? 0.65,
    metadata,
  });
  return result.ok === true;
}

export async function inferRelationsForItem(admin, item) {
  const identity = identityFromItem(item);
  const fromRefId = identity.ref_id;
  let created = 0;

  await registerGlobalRef(admin, item);

  const text = [identity.title, item.text, item.summary, item.explanation].filter(Boolean).join(" ");
  const keywords = item.keywords || item.ai_keywords || [];

  const topics = matchTopicsToContent(text, keywords);
  for (const { topic, score } of topics.slice(0, 4)) {
    const ok = await linkIfNew(admin, fromRefId, buildGlobalRef("topic", topic.slug), "topic", {
      topic_title: topic.title,
      relevance_score: score / 100,
      auto: true,
    });
    if (ok) created += 1;
  }

  if (item.narrator || item.author || item.scholar) {
    const name = item.narrator || item.author || item.scholar;
    const ok = await linkIfNew(admin, fromRefId, buildGlobalRef("scholar", name), "scholar", {
      scholar_name: name,
      auto: true,
    });
    if (ok) created += 1;
  }

  if (item.source_name || item.source_url) {
    const slug = String(item.source_name || "source").toLowerCase().replace(/\s+/g, "-").slice(0, 40);
    const ok = await linkIfNew(admin, fromRefId, buildGlobalRef("source", slug), "same_source", {
      source_name: item.source_name,
      source_url: item.source_url,
      auto: true,
    });
    if (ok) created += 1;
  }

  const kind = identity.content_kind;
  if (kind === "hadith" || kind === "verified_hadith") {
    for (const kw of keywords.slice(0, 5)) {
      if (/قرآن|آية|سورة|quran/i.test(kw)) {
        const ok = await linkIfNew(admin, fromRefId, buildGlobalRef("topic", "quran"), "quran", { keyword: kw });
        if (ok) created += 1;
      }
    }
  }

  return { fromRefId, created };
}

export async function runRelationInference(admin, opts = {}) {
  admin = admin ?? getSupabaseAdmin();
  if (!admin) return { ok: false, error: "admin required", created: 0 };

  const limit = opts.limit ?? 150;
  let created = 0;
  let processed = 0;
  const errors = [];

  const sources = [];

  if (opts.includeAdhkar !== false) {
    const { data } = await admin.from("verified_adhkar_items").select("*").is("deleted_at", null).limit(limit);
    for (const row of data ?? []) {
      sources.push({ ...row, content_kind: "adhkar", title: row.text?.slice(0, 80) });
    }
  }

  if (opts.includeHadith !== false) {
    const { data } = await admin.from("verified_hadith_items").select("*").is("deleted_at", null).limit(limit);
    for (const row of data ?? []) {
      sources.push({ ...row, content_kind: "hadith", title: row.title || row.text?.slice(0, 80) });
    }
  }

  if (opts.includeRefs !== false) {
    const { data } = await admin
      .from("global_content_refs")
      .select("*")
      .neq("verification_status", "rejected")
      .limit(limit);
    for (const row of data ?? []) {
      sources.push({ ...row, content_kind: row.content_kind });
    }
  }

  for (const item of sources) {
    try {
      const result = await inferRelationsForItem(admin, item);
      created += result.created;
      processed += 1;
    } catch (err) {
      errors.push(String(err?.message || err));
    }
  }

  return { ok: errors.length === 0, created, processed, errors };
}
