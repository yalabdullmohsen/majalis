/**
 * AI Knowledge Discovery — scan trusted sources for new content.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getAllSources, checkSourceConnection } from "../global-reference/sources.mjs";
import { runIngestPipelines } from "../autonomous-ai/stages.mjs";
import { verifyContentItem } from "../scholarly-verification/orchestrator.mjs";

const DISCOVERY_TYPES = ["book", "fatwa", "decision", "lesson", "course", "article"];

export async function runKnowledgeDiscovery(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const started = new Date().toISOString();

  const discovery = {
    id: runId,
    agent: "knowledge_discovery",
    status: "running",
    started_at: started,
    sources_scanned: 0,
    items_discovered: 0,
    items_queued: 0,
    items_rejected: 0,
    discoveries: [],
  };

  const sources = await getAllSources(admin);
  discovery.sources_scanned = sources.length;

  for (const source of sources.slice(0, opts.maxSources || 8)) {
    const connection = await checkSourceConnection(source);
    if (!connection.ok) continue;

    discovery.discoveries.push({
      source_slug: source.slug,
      source_name: source.name,
      source_type: source.source_type,
      status: "scanned",
      trust_level: source.trust_level,
      url: source.url,
    });
  }

  try {
    const ingest = await runIngestPipelines(admin, runId, {
      triggerType: opts.triggerType || "discovery",
      checkLinks: false,
      skipAutoContent: opts.skipAutoContent ?? false,
      runScholarlyScan: false,
    });

    discovery.items_discovered = ingest.discovered || 0;
    discovery.items_queued = ingest.published || 0;
    discovery.items_rejected = ingest.rejected || 0;
  } catch {
    /* ingest optional */
  }

  if (admin && opts.verifyNew !== false) {
    try {
      const { data: recent } = await admin
        .from("auto_imported_content")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      for (const item of recent || []) {
        if ((item.trust_level || 0) < 60) {
          discovery.items_rejected++;
          continue;
        }

        const verification = await verifyContentItem(
          {
            ...item,
            content_type: item.content_type || "article",
            source_url: item.source_url,
            source_name: item.source_name,
          },
          { checkLinks: false, useAi: false, persist: true, trigger: "discovery" },
        );

        if (verification.can_publish) {
          discovery.items_queued++;
          discovery.discoveries.push({
            type: item.content_type || "article",
            title: item.ai_title || item.title,
            source_slug: item.source_slug,
            status: "queued_for_review",
            trust_level: item.trust_level,
            ref_id: `majalis:${item.content_type || "article"}:${item.id}`,
          });
        } else {
          discovery.items_rejected++;
          discovery.discoveries.push({
            type: item.content_type || "article",
            title: item.ai_title || item.title,
            status: "rejected",
            reason: verification.errors?.[0] || "verification_failed",
          });
        }
      }
    } catch {
      /* auto_import optional */
    }
  }

  discovery.status = "completed";
  discovery.finished_at = new Date().toISOString();
  discovery.disclaimer = "All discoveries queued for human/scholarly review before publish — no unsourced religious text.";

  if (admin) {
    try {
      await admin.from("intelligence_runs").insert({
        id: runId,
        agent_id: "knowledge_discovery",
        status: "completed",
        items_checked: discovery.sources_scanned,
        issues_found: discovery.items_rejected,
        fixes_suggested: discovery.items_queued,
        report: { discoveries: discovery.discoveries.slice(0, 50) },
        started_at: started,
        finished_at: discovery.finished_at,
      });

      for (const item of discovery.discoveries.filter((d) => d.status === "queued_for_review").slice(0, 30)) {
        await admin.from("intelligence_discovery_items").insert({
          run_id: runId,
          item_type: item.type,
          title: item.title,
          source_slug: item.source_slug,
          ref_id: item.ref_id,
          status: "pending_review",
          trust_level: item.trust_level,
        });
      }
    } catch {
      /* tables may not exist */
    }
  }

  return discovery;
}
