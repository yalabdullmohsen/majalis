/**
 * Enrich sheikh from official source URLs only (no random web search).
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

  let bio = "";
  let imageUrl = "";

  for (const url of urls.slice(0, 2)) {
    try {
      const page = await importFromUrl(url);
      if (page.description && !bio) bio = page.description.slice(0, 500);
      if (page.imageUrl && !imageUrl) imageUrl = page.imageUrl;
    } catch {
      /* skip */
    }
  }

  const patch = {};
  if (bio) patch.bio = bio;
  if (imageUrl) patch.avatar_url = imageUrl;
  if (sourceConfig.country) patch.country = sourceConfig.country;

  if (!Object.keys(patch).length) return { ok: false, reason: "no_data" };

  await admin.from("sheikhs").update(patch).eq("id", sheikhId);
  return { ok: true, patch };
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
    })
    .select("id")
    .single();

  if (created?.id) {
    await enrichSheikhFromOfficialSources({ sheikhId: created.id, name, sourceConfig: sourceConfig || {} });
    return created.id;
  }

  return null;
}
