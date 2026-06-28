/**
 * AKP v3 — Automatic Source Discovery (RSS, Atom, Sitemap, WordPress, JSON Feed).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { fetchWithMetrics } from "./health-monitor.mjs";

const FEED_PATTERNS = [
  { type: "rss", regex: /<link[^>]+type=["']application\/rss\+xml["'][^>]+href=["']([^"']+)["']/gi },
  { type: "atom", regex: /<link[^>]+type=["']application\/atom\+xml["'][^>]+href=["']([^"']+)["']/gi },
  { type: "json_feed", regex: /<link[^>]+type=["']application\/json["'][^>]+href=["']([^"']+)["']/gi },
];

const COMMON_PATHS = [
  "/feed", "/rss", "/rss.xml", "/feed.xml", "/atom.xml",
  "/index.xml", "/sitemap.xml", "/wp-json", "/?feed=rss2",
];

const CMS_SIGNATURES = [
  { cms: "wordpress", regex: /wp-content|wordpress|wp-json/i },
  { cms: "drupal", regex: /drupal|sites\/default/i },
];

function resolveUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function detectFeedType(body, url) {
  const lower = String(body || "").slice(0, 2000).toLowerCase();
  if (lower.includes("<rss") || url.includes("rss")) return "rss";
  if (lower.includes("<feed") || lower.includes("atom")) return "atom";
  if (lower.includes('"version"') && lower.includes('"items"')) return "json_feed";
  if (lower.includes("<urlset") || lower.includes("sitemap")) return "sitemap";
  return "website";
}

export async function discoverFeedsFromUrl(startUrl, { maxProbes = 8 } = {}) {
  const discoveries = [];
  const seen = new Set();

  const add = (url, feedType, confidence, meta = {}) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    discoveries.push({
      discovered_url: url,
      feed_type: feedType,
      confidence,
      parent_url: startUrl,
      metadata: meta,
    });
  };

  const main = await fetchWithMetrics(startUrl);
  if (!main.ok) {
    return { ok: false, error: main.error || `HTTP ${main.httpStatus}`, discoveries: [] };
  }

  const body = main.body || "";
  for (const { type, regex } of FEED_PATTERNS) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(body))) {
      const href = resolveUrl(startUrl, m[1]);
      if (href) add(href, type, 90, { method: "html_link" });
    }
  }

  for (const sig of CMS_SIGNATURES) {
    if (sig.regex.test(body)) {
      if (sig.cms === "wordpress") {
        add(resolveUrl(startUrl, "/feed"), "rss", 85, { cms: "wordpress" });
        add(resolveUrl(startUrl, "/wp-json"), "json_api", 75, { cms: "wordpress" });
      }
      if (sig.cms === "drupal") {
        add(resolveUrl(startUrl, "/rss.xml"), "rss", 80, { cms: "drupal" });
      }
    }
  }

  let probed = 0;
  for (const path of COMMON_PATHS) {
    if (probed >= maxProbes) break;
    const probeUrl = resolveUrl(startUrl, path);
    if (!probeUrl || seen.has(probeUrl)) continue;
    probed += 1;
    const probe = await fetchWithMetrics(probeUrl);
    if (probe.ok && probe.body) {
      const ft = detectFeedType(probe.body, probeUrl);
      if (ft !== "website") {
        add(probeUrl, ft, 70, { method: "path_probe", path });
      }
    }
  }

  return { ok: true, parentUrl: startUrl, discoveries };
}

export async function saveDiscoveries(discoveries) {
  const admin = getSupabaseAdmin();
  if (!admin || !discoveries?.length) return { ok: true, saved: 0 };

  let saved = 0;
  for (const d of discoveries) {
    const { error } = await admin.from("akp_source_discoveries").upsert(
      {
        discovered_url: d.discovered_url,
        feed_type: d.feed_type,
        title: d.title || null,
        confidence: d.confidence ?? 70,
        parent_url: d.parent_url,
        status: "pending",
        metadata: d.metadata || {},
      },
      { onConflict: "discovered_url", ignoreDuplicates: true },
    );
    if (!error) saved += 1;
  }
  return { ok: true, saved };
}

export async function listPendingDiscoveries(limit = 30) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, discoveries: [] };

  const { data } = await admin
    .from("akp_source_discoveries")
    .select("*")
    .eq("status", "pending")
    .order("confidence", { ascending: false })
    .limit(limit);

  return { ok: true, discoveries: data || [] };
}

export async function approveDiscovery(id, sourceInput, actor = null) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const { data: disc } = await admin.from("akp_source_discoveries").select("*").eq("id", id).maybeSingle();
  if (!disc) return { ok: false, error: "not_found" };

  const { upsertManagedSource } = await import("./source-manager.mjs");
  const created = await upsertManagedSource(
    {
      name: sourceInput?.name || disc.title || disc.feed_type,
      source_url: disc.discovered_url,
      source_type: disc.feed_type === "json_api" ? "website" : disc.feed_type,
      content_types: sourceInput?.content_types || ["benefits"],
      ...sourceInput,
    },
    actor,
  );

  if (!created.ok) return created;

  await admin.from("akp_source_discoveries").update({
    status: "added",
    resolved_at: new Date().toISOString(),
  }).eq("id", id);

  return { ok: true, source: created.source, discoveryId: id };
}

export async function rejectDiscovery(id) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };
  await admin.from("akp_source_discoveries").update({
    status: "rejected",
    resolved_at: new Date().toISOString(),
  }).eq("id", id);
  return { ok: true };
}
