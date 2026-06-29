/**
 * Enrich sheikh from official source URLs only (no random web search).
 * Imported biography fields stay unverified until admin review.
 */
import { importFromUrl } from "./url-importer.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function enrichSheikhFromOfficialSources({ sheikhId, name, sourceConfig = {} }) {
  const admin = getSupabaseAdmin();
  if (!admin || !sheikhId) return { ok: false };

  const urls = [
    sourceConfig.website_url,
    sourceConfig.scholar_website,
    sourceConfig.official_url,
  ].filter(Boolean);

  if (!urls.length) return { ok: false, reason: "no_official_url" };

  const { data: existing } = await admin
    .from("sheikhs")
    .select("bio, biography_data, biography_status, biography_sources, image_url, photo_url, country")
    .eq("id", sheikhId)
    .maybeSingle();

  let bio = "";
  let imageUrl = "";
  const sourceUrl = urls[0];

  for (const url of urls.slice(0, 2)) {
    try {
      const page = await importFromUrl(url);
      if (page.description && !bio) bio = page.description.slice(0, 2000);
      if (page.imageUrl && !imageUrl) imageUrl = page.imageUrl;
    } catch {
      /* skip */
    }
  }

  const patch = {};
  const biographyData = { ...(existing?.biography_data || {}) };
  const sources = Array.isArray(existing?.biography_sources) ? [...existing.biography_sources] : [];

  if (bio && !biographyData.extended_bio?.verified) {
    biographyData.extended_bio = { value: bio, verified: false, source: sourceUrl };
    patch.biography_data = biographyData;
    if (!existing?.biography_status || existing.biography_status === "draft") {
      patch.biography_status = "review";
    }
  }

  if (imageUrl && !existing?.photo_url && !existing?.image_url) {
    patch.avatar_url = imageUrl;
  }
  if (sourceConfig.country && !existing?.country) {
    patch.country = sourceConfig.country;
  }

  if (sourceUrl && !sources.some((s) => s?.url === sourceUrl)) {
    sources.push({ url: sourceUrl, label: "official_website", fetched_at: new Date().toISOString() });
    patch.biography_sources = sources;
  }

  if (!Object.keys(patch).length) return { ok: false, reason: "no_data" };

  patch.biography_updated_at = new Date().toISOString();
  await admin.from("sheikhs").update(patch).eq("id", sheikhId);
  return { ok: true, patch, reviewRequired: patch.biography_status === "review" };
}

export async function createAndEnrichSheikh({ name, sourceConfig, userId }) {
  const admin = getSupabaseAdmin();
  if (!admin || !name?.trim()) return null;

  const { data: existing } = await admin.from("sheikhs").select("id").ilike("name", name.trim()).maybeSingle();
  if (existing?.id) {
    await enrichSheikhFromOfficialSources({ sheikhId: existing.id, name, sourceConfig });
    return existing.id;
  }

  const { data: created } = await admin
    .from("sheikhs")
    .insert({
      name: name.trim(),
      bio: "",
      is_verified: false,
      status: "pending",
      needs_verification: true,
      country: sourceConfig?.country || "الكويت",
      biography_status: "draft",
      biography_data: {},
    })
    .select("id")
    .single();

  if (created?.id) {
    await enrichSheikhFromOfficialSources({ sheikhId: created.id, name, sourceConfig: sourceConfig || {} });
    return created.id;
  }

  return null;
}
