/**
 * Knowledge graph relation builder — links adhkar, hadith, lessons, books, topics.
 */

import { createRelation, getRelationStats } from "../global-reference/relations.mjs";
import { registerGlobalRef } from "../global-reference/ids.mjs";

const REL = {
  CATEGORY: "topic",
  NARRATOR: "scholar",
  SOURCE: "same_source",
  RELATED: "related",
  EXPLAINS: "explains",
  HADITH: "hadith",
  ADHKAR: "keyword",
};

export async function linkContentToRef(admin, fromRefId, toRefId, relationType, metadata = {}) {
  if (!admin || !fromRefId || !toRefId || fromRefId === toRefId) return { created: false };
  try {
    return await createRelation(admin, {
      from_ref_id: fromRefId,
      to_ref_id: toRefId,
      relation_type: relationType,
      relevance_score: metadata.relevance_score ?? 0.7,
      metadata,
    });
  } catch {
    return { created: false };
  }
}

async function ensureGlobalRef(admin, item) {
  try {
    const reg = await registerGlobalRef(admin, item);
    return reg.ref?.ref_id ?? null;
  } catch {
    return null;
  }
}

export async function rebuildKnowledgeRelations(admin, opts = {}) {
  if (!admin) return { ok: false, error: "admin required", created: 0 };

  const limit = opts.limit ?? 200;
  let created = 0;
  const errors = [];

  const [{ data: adhkar }, { data: hadith }, { data: categories }] = await Promise.all([
    admin.from("verified_adhkar_items").select("*").is("deleted_at", null).limit(limit),
    admin.from("verified_hadith_items").select("*").is("deleted_at", null).limit(limit),
    admin.from("verified_adhkar_categories").select("*").is("deleted_at", null),
  ]).catch(() => [{ data: [] }, { data: [] }, { data: [] }]);

  const catMap = new Map((categories ?? []).map((c) => [c.id, c]));

  for (const item of adhkar ?? []) {
    try {
      const refId = item.global_ref_id ?? await ensureGlobalRef(admin, {
        content_kind: "adhkar",
        record_id: item.id,
        title: item.text?.slice(0, 80),
        verification_status: item.verification_status,
        author: item.narrator,
        references: [{ url: item.source_url, name: item.source_name }],
      });

      const cat = catMap.get(item.category_id);
      if (cat && refId) {
        const catRef = await ensureGlobalRef(admin, {
          content_kind: "topic",
          record_id: cat.id,
          title: cat.name,
          verification_status: cat.verification_status,
        });
        if (catRef) {
          const r = await linkContentToRef(admin, refId, catRef, REL.CATEGORY, { auto: true });
          if (r.created) created += 1;
        }
      }
    } catch (err) {
      errors.push(String(err?.message || err));
    }
  }

  for (const item of hadith ?? []) {
    try {
      const refId = item.global_ref_id ?? await ensureGlobalRef(admin, {
        content_kind: "hadith",
        record_id: item.id,
        title: item.title ?? item.text?.slice(0, 80),
        verification_status: item.verification_status,
        author: item.narrator,
        references: [{ url: item.source_url, name: item.source_name }],
      });

      if (refId && item.source_url) {
        const srcRef = await ensureGlobalRef(admin, {
          content_kind: "source",
          record_id: item.source_name,
          title: item.source_name,
          references: [{ url: item.source_url, name: item.source_name }],
        });
        if (srcRef) {
          const r = await linkContentToRef(admin, refId, srcRef, REL.SOURCE, { auto: true });
          if (r.created) created += 1;
        }
      }
    } catch (err) {
      errors.push(String(err?.message || err));
    }
  }

  let stats = {};
  try {
    stats = await getRelationStats(admin);
  } catch {
    stats = {};
  }

  return { ok: errors.length === 0, created, errors, stats };
}
