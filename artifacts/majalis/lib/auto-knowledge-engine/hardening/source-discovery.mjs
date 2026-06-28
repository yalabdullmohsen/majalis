/**
 * Autonomous source discovery — crawl organizations, sitemaps, feeds, social.
 */

import { akeLog } from "../monitoring.mjs";

const FEED_PATTERNS = [
  /href=["']([^"']*(?:rss|feed|atom)[^"']*)["']/gi,
  /href=["']([^"']*\.xml)["']/gi,
  /<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/gi,
];

const SOURCE_TYPE_HINTS = [
  { pattern: /university|جامعة|كلية/i, type: "university" },
  { pattern: /gov\.|وزارة|ministry/i, type: "government" },
  { pattern: /fatwa|ifta|فتوى|إفتاء/i, type: "fatwa_portal" },
  { pattern: /youtube\.com|youtu\.be/i, type: "youtube" },
  { pattern: /instagram\.com/i, type: "instagram" },
  { pattern: /t\.me|telegram/i, type: "telegram" },
  { pattern: /podcast|soundcloud|anchor\.fm/i, type: "podcast" },
  { pattern: /sitemap/i, type: "sitemap" },
  { pattern: /conference|مؤتمر|ندوة/i, type: "conference" },
  { pattern: /library|مكتبة|maktaba/i, type: "library" },
];

export function classifySourceType(url, html = "") {
  const combined = `${url} ${html.slice(0, 2000)}`;
  for (const hint of SOURCE_TYPE_HINTS) {
    if (hint.pattern.test(combined)) return hint.type;
  }
  return "website";
}

export function discoverFeedsFromHtml(html, baseUrl) {
  const feeds = new Set();
  for (const pattern of FEED_PATTERNS) {
    let match;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(html)) !== null) {
      const href = match[1] || match[2];
      if (href) feeds.add(resolveUrl(href, baseUrl));
    }
  }
  return [...feeds];
}

export function discoverSitemapUrls(html, baseUrl) {
  const sitemaps = [];
  const re = /href=["']([^"']*sitemap[^"']*\.xml)["']/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    sitemaps.push(resolveUrl(match[1], baseUrl));
  }
  if (sitemaps.length === 0) {
    try {
      const origin = new URL(baseUrl).origin;
      sitemaps.push(`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`);
    } catch { /* ignore */ }
  }
  return sitemaps;
}

function resolveUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

export async function crawlOrganizationForSources(orgUrl, options = {}) {
  const results = { url: orgUrl, feeds: [], sitemaps: [], links: [], sourceType: "website" };
  const timeout = options.timeoutMs || 12000;

  try {
    const response = await fetch(orgUrl, {
      signal: AbortSignal.timeout(timeout),
      headers: { "User-Agent": "MajlisIlmBot/2.0 (+https://majlisilm.com)" },
    });
    if (!response.ok) return results;

    const html = await response.text();
    results.sourceType = classifySourceType(orgUrl, html);
    results.feeds = discoverFeedsFromHtml(html, orgUrl);
    results.sitemaps = discoverSitemapUrls(html, orgUrl);

    const linkRe = /href=["'](https?:\/\/[^"']+)["']/gi;
    let match;
    const seen = new Set();
    while ((match = linkRe.exec(html)) !== null && results.links.length < 50) {
      const link = match[1];
      if (!seen.has(link) && isTrustedDomain(link)) {
        seen.add(link);
        results.links.push(link);
      }
    }
  } catch (err) {
    results.error = err.message;
  }

  return results;
}

function isTrustedDomain(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const blocked = ["facebook.com", "twitter.com", "x.com", "tiktok.com", "google.com", "amazon.com"];
    return !blocked.some((b) => host.includes(b));
  } catch {
    return false;
  }
}

export async function registerDiscoveredSource(admin, discovery) {
  if (!admin || !discovery.discovered_url) return null;
  try {
    const { data, error } = await admin.from("ake_discovered_sources").upsert({
      organization_name: discovery.organization_name || null,
      discovered_url: discovery.discovered_url,
      feed_url: discovery.feed_url || discovery.feeds?.[0] || null,
      feed_format: discovery.feed_format || "rss",
      source_type: discovery.source_type || "website",
      verification_status: "pending",
      trust_score: discovery.trust_score || 0,
      discovery_method: discovery.discovery_method || "crawler",
      metadata: discovery.metadata || {},
    }, { onConflict: "discovered_url" }).select("id").single();

    if (error) throw error;
    return data?.id;
  } catch {
    return null;
  }
}

export async function runSourceDiscoveryCycle(admin, seedUrls = [], options = {}) {
  const stats = { crawled: 0, discovered: 0, errors: [] };
  const urls = seedUrls.length > 0 ? seedUrls : await loadDiscoverySeeds(admin);

  for (const url of urls.slice(0, options.limit || 5)) {
    stats.crawled++;
    const crawl = await crawlOrganizationForSources(url);
    if (crawl.error) {
      stats.errors.push(crawl.error);
      continue;
    }

    const feedUrl = crawl.feeds[0] || crawl.sitemaps[0];
    if (feedUrl || crawl.sourceType !== "website") {
      const id = await registerDiscoveredSource(admin, {
        discovered_url: url,
        feed_url: feedUrl,
        source_type: crawl.sourceType,
        discovery_method: "periodic_crawl",
        metadata: { feeds: crawl.feeds, sitemaps: crawl.sitemaps },
      });
      if (id) stats.discovered++;
    }
  }

  akeLog("source-discovery", stats);
  return stats;
}

async function loadDiscoverySeeds(admin) {
  if (!admin) return [];
  try {
    const { data } = await admin
      .from("knowledge_official_sources")
      .select("official_url")
      .gte("trust_level", 4)
      .limit(10);
    return (data || []).map((s) => s.official_url).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getPendingDiscoveredSources(admin, limit = 20) {
  if (!admin) return [];
  try {
    const { data } = await admin
      .from("ake_discovered_sources")
      .select("*")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
