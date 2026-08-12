/**
 * AI Relationship Builder — auto-link cross-type knowledge graph edges.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { buildGlobalRef, identityFromItem } from "../global-reference/ids.mjs";
import { createRelation, autoLinkRelations, getRelations } from "../global-reference/relations.mjs";
import { aiSuggestRelations } from "../global-reference/ai-assist.mjs";
import { matchTopicsToContent } from "../scholarly-intelligence/topics.mjs";

const RELATION_PATTERNS = [
  { from: "hadith", to: "ayah", type: "related", label: "حديث ↔ آية" },
  { from: "fatwa", to: "decision", type: "supports", label: "فتوى ↔ قرار فقهي" },
  { from: "book", to: "scholar", type: "derived_from", label: "كتاب ↔ مؤلف" },
  { from: "lesson", to: "scholar", type: "related", label: "درس ↔ شيخ" },
  { from: "article", to: "topic", type: "same_topic", label: "مقال ↔ موضوع" },
  { from: "faida", to: "hadith", type: "cites", label: "فائدة ↔ حديث" },
  { from: "qa", to: "fatwa", type: "related", label: "سؤال ↔ فتوى" },
];

function tokenOverlap(a, b) {
  const wordsA = String(a || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const wordsB = String(b || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  return wordsA.filter((w) => wordsB.includes(w));
}

export async function runRelationshipBuilder(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const maxItems = opts.maxItems || 50;

  const result = {
    id: runId,
    agent: "relationship_builder",
    status: "running",
    started_at: new Date().toISOString(),
    items_processed: 0,
    relations_created: 0,
    relations_suggested: [],
    patterns: RELATION_PATTERNS,
  };

  if (!admin) {
    result.status = "completed";
    result.finished_at = new Date().toISOString();
    return result;
  }

  try {
    const { data: refs } = await admin.from("global_content_refs").select("*").limit(maxItems);
    const items = refs || [];

    if (!items.length) {
      const tables = [
        { table: "fawaid", kind: "faida", title: "title", author: "author_name" },
        { table: "library_items", kind: "book", title: "title", author: "author" },
        { table: "qa_questions", kind: "qa", title: "question", author: null },
      ];

      for (const { table, kind, title, author } of tables) {
        const { data: rows } = await admin.from(table).select("*").limit(20);
        for (const row of rows || []) {
          items.push(identityFromItem({ ...row, content_kind: kind, title: row[title], author: author ? row[author] : null }));
        }
      }
    }

    const candidates = items.slice(0, maxItems);

    for (const item of candidates) {
      result.items_processed++;
      const fromRefId = item.ref_id || buildGlobalRef(item.content_kind, item.record_id);

      const autoResult = await autoLinkRelations(admin, { ...item, ref_id: fromRefId });
      result.relations_created += autoResult.created || 0;

      const text = [item.title, item.summary, item.author, item.publisher].filter(Boolean).join(" ");
      const topicMatches = matchTopicsToContent(text, item.ai_keywords || []);
      for (const { topic, score } of topicMatches.slice(0, 3)) {
        await createRelation(admin, {
          fromRefId,
          toRefId: buildGlobalRef("topic", topic.slug),
          relationType: "topic",
          score: score / 100,
          metadata: { topic_title: topic.title, pattern: "مقال ↔ موضوع" },
        });
        result.relations_created++;
      }

      if (item.author || item.speaker_name) {
        const scholarSlug = (item.author || item.speaker_name).toLowerCase().replace(/\s+/g, "-").slice(0, 40);
        const relType = item.content_kind === "lesson" ? "related" : "derived_from";
        await createRelation(admin, {
          fromRefId,
          toRefId: buildGlobalRef("scholar", scholarSlug),
          relationType: relType,
          score: 0.85,
          metadata: { scholar_name: item.author || item.speaker_name, pattern: relType === "related" ? "درس ↔ شيخ" : "كتاب ↔ مؤلف" },
        });
        result.relations_created++;
      }

      const suggestions = await aiSuggestRelations(item, candidates.filter((c) => c.ref_id !== fromRefId));
      for (const sug of suggestions) {
        result.relations_suggested.push({ from: fromRefId, ...sug });
        if (sug.score >= 0.4) {
          await createRelation(admin, {
            fromRefId,
            toRefId: sug.to_ref_id,
            relationType: sug.relation_type || "related",
            score: sug.score,
            metadata: { reason: sug.reason, auto: true },
          });
          result.relations_created++;
        }
      }

      for (const other of candidates) {
        if (other.ref_id === fromRefId) continue;
        const overlap = tokenOverlap(item.title, other.title);
        if (overlap.length >= 2) {
          const pattern = RELATION_PATTERNS.find(
            (p) => p.from === item.content_kind && p.to === other.content_kind,
          );
          if (pattern) {
            await createRelation(admin, {
              fromRefId,
              toRefId: other.ref_id || buildGlobalRef(other.content_kind, other.record_id),
              relationType: pattern.type,
              score: Math.min(overlap.length / 5, 1),
              metadata: { pattern: pattern.label, shared: overlap.slice(0, 3) },
            });
            result.relations_created++;
          }
        }
      }
    }

    const existingRelations = await getRelations(admin, candidates[0]?.ref_id || "");
    result.existing_sample = existingRelations.slice(0, 5);
  } catch {
    /* processing optional */
  }

  result.status = "completed";
  result.finished_at = new Date().toISOString();

  if (admin) {
    try {
      await admin.from("intelligence_runs").insert({
        id: runId,
        agent_id: "relationship_builder",
        status: "completed",
        items_checked: result.items_processed,
        issues_found: 0,
        fixes_suggested: result.relations_created,
        report: {
          relations_created: result.relations_created,
          suggested: result.relations_suggested.slice(0, 30),
        },
        started_at: result.started_at,
        finished_at: result.finished_at,
      });
    } catch {
      /* table may not exist */
    }
  }

  return result;
}
