/**
 * Monitor trusted content_sources and create drafts from new RSS/API items.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { importFromUrl } from "./url-importer.mjs";
import { extractLessonFromText } from "./lesson-extractor.mjs";
import { matchSheikhByName } from "./sheikh-matcher.mjs";

async function parseRssItems(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks.slice(0, 10)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    if (title && link) items.push({ title, link, description: desc || "" });
  }
  return items;
}

export async function monitorContentSources() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing", created: 0 };

  const { data: sources } = await admin
    .from("content_sources")
    .select("*")
    .eq("is_active", true);

  let created = 0;
  const log = [];

  for (const source of sources || []) {
    try {
      const feedUrl = source.base_url || source.config?.feed_url;
      if (!feedUrl) continue;

      const imported = await importFromUrl(feedUrl);
      const rssItems = await parseRssItems(imported.rawText || imported.description || "");

      for (const item of rssItems) {
        const { data: existing } = await admin
          .from("content_drafts")
          .select("id")
          .eq("source_url", item.link)
          .maybeSingle();

        if (existing?.id) continue;

        const { extracted, validation, aiSuggestions } = await extractLessonFromText({
          text: `${item.title}\n${item.description}`,
          sourceUrl: item.link,
        });

        const sheikhMatch = await matchSheikhByName(extracted.speaker_name);

        const { error } = await admin.from("content_drafts").insert({
          content_kind: "lesson",
          source_type: "cron",
          source_url: item.link,
          extracted_data: extracted,
          ai_suggestions: aiSuggestions,
          validation_errors: validation.errors,
          validation_warnings: validation.warnings,
          matched_sheikh_id: sheikhMatch.matched?.id || null,
          proposed_sheikh: sheikhMatch.proposedDraft,
          workflow_status: "pending",
          metadata: { source_slug: source.slug, source_name: source.name },
        });

        if (!error) {
          created += 1;
          log.push({ source: source.slug, title: item.title, url: item.link });
        }
      }

      await admin
        .from("content_sources")
        .update({ last_sync_at: new Date().toISOString(), last_sync_status: "ok" })
        .eq("id", source.id);
    } catch (err) {
      await admin
        .from("content_sources")
        .update({ last_sync_at: new Date().toISOString(), last_sync_status: String(err.message || err) })
        .eq("id", source.id);
      log.push({ source: source.slug, error: String(err.message || err) });
    }
  }

  return { ok: true, created, log };
}
