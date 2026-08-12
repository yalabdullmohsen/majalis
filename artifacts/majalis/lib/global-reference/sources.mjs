/**
 * Unified scholarly sources registry — merges 3 existing registries.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";

const SEED_SOURCES = [
  { slug: "iifa", name: "International Islamic Fiqh Academy", name_ar: "مجمع الفقه الإسلامي", source_type: "official", url: "https://iifa-aifi.org", trust_level: 95 },
  { slug: "alifta", name: "Saudi Ifta", name_ar: "الإفتاء السعودية", source_type: "official", url: "https://alifta.gov.sa", trust_level: 95 },
  { slug: "sunnah-com", name: "Sunnah.com", name_ar: "سنّة", source_type: "database", url: "https://sunnah.com", trust_level: 90 },
  { slug: "quran-com", name: "Quran.com", name_ar: "قرآن", source_type: "database", url: "https://quran.com", trust_level: 95 },
  { slug: "majalis-local", name: "Majalis Scientific Council", name_ar: "المجلس العلمي", source_type: "official", url: "https://majalis.app", trust_level: 90 },
];

export async function getAllSources(admin) {
  if (admin) {
    try {
      const { data } = await admin.from("scholarly_sources").select("*").eq("is_active", true).order("trust_level", { ascending: false });
      if (data?.length) return data;
    } catch {
      /* fallback */
    }

    try {
      const { data: trusted } = await admin.from("trusted_sources").select("*").eq("is_active", true).limit(50);
      if (trusted?.length) {
        return trusted.map((s) => ({
          slug: s.slug || s.id,
          name: s.name,
          source_type: s.source_type || "rss",
          url: s.feed_url || s.url,
          trust_level: s.trust_level || 50,
          connection_status: s.health_status || "unknown",
          items_imported: s.items_imported || 0,
        }));
      }
    } catch {
      /* fallback */
    }
  }

  return SEED_SOURCES;
}

export async function getSourceBySlug(admin, slug) {
  const sources = await getAllSources(admin);
  return sources.find((s) => s.slug === slug) || null;
}

export async function getSourceTrust(admin, slug) {
  const source = await getSourceBySlug(admin, slug);
  return source?.trust_level ?? 50;
}

export async function updateSourceHealth(admin, slug, { connection_status, last_checked_at, items_imported, items_rejected }) {
  if (!admin) return { ok: false };

  try {
    await admin
      .from("scholarly_sources")
      .update({
        connection_status,
        last_checked_at: last_checked_at || new Date().toISOString(),
        items_imported,
        items_rejected,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function checkSourceConnection(source) {
  if (!source.url) return { status: "unknown", ok: false };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(source.url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    return { status: res.ok ? "healthy" : "degraded", ok: res.ok, statusCode: res.status };
  } catch {
    return { status: "broken", ok: false };
  }
}

export async function auditAllSources(admin) {
  const sources = await getAllSources(admin);
  const results = [];

  for (const source of sources.slice(0, 10)) {
    const check = await checkSourceConnection(source);
    results.push({ slug: source.slug, name: source.name, ...check });

    if (admin) {
      await updateSourceHealth(admin, source.slug, {
        connection_status: check.status,
        last_checked_at: new Date().toISOString(),
      });
    }
  }

  return results;
}
