/**
 * Sheikh Profile Enrichment Engine.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { enrichSheikhBio } from "../ai-extractors.mjs";
import { enrichSheikhFromOfficialSources } from "../../cms/sheikh-enricher.mjs";
import { startEngineRun, finishEngineRun, createRunLogger, auditPublish } from "../run-manager.mjs";

const ENGINE_ID = "sheikh-enrichment";

export async function run({ runType = "incremental", maxItems = 15 } = {}) {
  const admin = getSupabaseAdmin();
  const { runId, startedAt } = await startEngineRun(ENGINE_ID, runType);
  const log = createRunLogger(runId, ENGINE_ID);
  const stats = {
    items_fetched: 0,
    items_parsed: 0,
    items_enriched: 0,
    items_duplicate: 0,
    items_rejected: 0,
    items_review: 0,
    items_published: 0,
    errors: 0,
  };

  if (!admin) {
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: "no_admin" });
    return { ok: false, error: "no_admin", stats };
  }

  try {
    const { data: sheikhs } = await admin
      .from("sheikhs")
      .select("id, name, bio, specialties, official_website, image_url, photo_url")
      .order("updated_at", { ascending: true })
      .limit(maxItems);

    stats.items_fetched = sheikhs?.length || 0;

    for (const sheikh of sheikhs || []) {
      stats.items_parsed++;

      const { data: lessons } = await admin
        .from("lessons")
        .select("title, category")
        .eq("status", "approved")
        .ilike("speaker_name", `%${sheikh.name}%`)
        .limit(30);

      const lessonCount = lessons?.length || 0;
      const categories = [...new Set((lessons || []).map((l) => l.category).filter(Boolean))];
      const lessonTitles = (lessons || []).map((l) => l.title).filter(Boolean);

      if (!lessonCount && sheikh.bio?.trim()) {
        stats.items_duplicate++;
        continue;
      }

      const patch = {};

      if (!sheikh.bio?.trim() && lessonCount > 0) {
        const bioResult = await enrichSheikhBio({
          name: sheikh.name,
          lessonTitles,
          categories,
          lessonCount,
        });
        if (bioResult.bio) {
          patch.bio = bioResult.bio;
          stats.items_enriched++;
        } else {
          stats.items_rejected++;
        }
      }

      if (categories.length && (!sheikh.specialties || sheikh.specialties.length === 0)) {
        patch.specialties = categories.slice(0, 6);
        stats.items_enriched++;
      }

      if (sheikh.official_website) {
        const official = await enrichSheikhFromOfficialSources({
          sheikhId: sheikh.id,
          name: sheikh.name,
          sourceConfig: { official_url: sheikh.official_website, website_url: sheikh.official_website },
        });
        if (official.ok) stats.items_enriched++;
      }

      if (!Object.keys(patch).length) {
        stats.items_duplicate++;
        continue;
      }

      await admin.from("sheikhs").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", sheikh.id);

      await auditPublish({
        runId,
        engineId: ENGINE_ID,
        targetTable: "sheikhs",
        targetId: sheikh.id,
        action: "update",
        metadata: { patch: Object.keys(patch) },
      });

      stats.items_published++;
    }

    await log("publish_or_review", "info", `Sheikhs enriched: ${stats.items_published}`);
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt);
    return { ok: true, engineId: ENGINE_ID, runId, stats };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
