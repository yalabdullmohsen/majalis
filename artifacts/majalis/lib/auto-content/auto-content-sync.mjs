import { createClient } from "@supabase/supabase-js";
import {
  aiAnalyzeContent,
  calculateQualityScore,
  createExternalKey,
  createSlug,
  detectContentType,
  extractRssItems,
} from "./auto-content-utils.mjs";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function runAutoContentSync() {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "Supabase not configured", imported: 0, skipped: 0, failed: 0 };
  }

  const { data: sources, error: sourcesError } = await supabase
    .from("trusted_sources")
    .select("*")
    .eq("is_active", true);

  if (sourcesError) {
    return { ok: false, error: sourcesError.message, imported: 0, skipped: 0, failed: 0 };
  }

  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const source of sources || []) {
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    try {
      const response = await fetch(source.url, {
        headers: { "User-Agent": "MajlisIlmBot/1.0 (+https://majlisilm.com)" },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`Source failed: ${response.status}`);
      }

      const xml = await response.text();
      const rssItems = extractRssItems(xml);

      for (const rssItem of rssItems) {
        try {
          const externalKey = createExternalKey(source.name, rssItem.link, rssItem.title);

          const { data: exists } = await supabase
            .from("auto_imported_content")
            .select("id")
            .eq("external_key", externalKey)
            .maybeSingle();

          if (exists) {
            skipped++;
            continue;
          }

          const analysis = await aiAnalyzeContent({
            title: rssItem.title,
            description: rssItem.description,
            sourceName: source.name,
          });

          const contentType = detectContentType(rssItem.title, rssItem.description);

          const record = {
            external_key: externalKey,
            title: rssItem.title,
            slug: createSlug(rssItem.title),
            content_type: contentType,
            category: analysis.category || source.category || "عام",
            summary: analysis.summary || rssItem.description.slice(0, 500),
            content: rssItem.description,
            source_name: source.name,
            source_url: source.url,
            original_url: rssItem.link,
            tags: Array.isArray(analysis.tags) ? analysis.tags : [],
            verification_status: "needs_review",
            status: "needs_review",
          };

          record.quality_score = calculateQualityScore(record);

          const { error: insertError } = await supabase
            .from("auto_imported_content")
            .insert(record);

          if (insertError) throw insertError;

          imported++;
        } catch {
          failed++;
        }
      }

      await supabase
        .from("trusted_sources")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", source.id);

      await supabase.from("auto_import_logs").insert({
        source_id: source.id,
        status: "success",
        message: "تمت المزامنة بنجاح",
        imported_count: imported,
        skipped_count: skipped,
        failed_count: failed,
      });
    } catch (error) {
      failed++;

      await supabase.from("auto_import_logs").insert({
        source_id: source.id,
        status: "failed",
        message: error.message,
        imported_count: imported,
        skipped_count: skipped,
        failed_count: failed,
      });
    }

    totalImported += imported;
    totalSkipped += skipped;
    totalFailed += failed;
  }

  return {
    ok: true,
    imported: totalImported,
    skipped: totalSkipped,
    failed: totalFailed,
  };
}
