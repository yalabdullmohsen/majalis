/**
 * Dynamic sitemap + RSS from live Supabase (no build snapshot).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "../..");

function loadSeoConfig() {
  try {
    const raw = readFileSync(join(APP_ROOT, "src/lib/seo-routes.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return { siteUrl: "https://majlisilm.com", routes: [] };
  }
}

function escapeXml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function fetchDynamicUrls() {
  const admin = getSupabaseAdmin();
  const urls = [];

  if (!admin) return urls;

  const [lessons, sheikhs, library, qa, fawaid, fatwas, updates] = await Promise.all([
    admin.from("lessons").select("id, updated_at, slug").eq("status", "approved").limit(2000),
    admin.from("sheikhs").select("id, updated_at").eq("is_verified", true).limit(500),
    admin.from("library_items").select("id, updated_at").eq("status", "approved").limit(500),
    admin.from("qa_questions").select("id, updated_at").eq("status", "published").limit(500),
    admin.from("fawaid").select("id, updated_at").eq("status", "approved").limit(500),
    admin.from("fatwas").select("id, slug, updated_at").eq("status", "approved").limit(200),
    admin.from("platform_updates").select("id, updated_at").eq("status", "approved").limit(200),
  ]);

  for (const row of lessons.data || []) {
    urls.push({ loc: `/lessons/${row.slug || row.id}`, lastmod: row.updated_at, priority: 0.85 });
  }
  for (const row of sheikhs.data || []) {
    urls.push({ loc: `/sheikhs/${row.id}`, lastmod: row.updated_at, priority: 0.75 });
  }
  for (const row of library.data || []) {
    urls.push({ loc: `/library`, lastmod: row.updated_at, priority: 0.7 });
    break;
  }
  for (const row of qa.data || []) {
    urls.push({ loc: `/qa/${row.id}`, lastmod: row.updated_at, priority: 0.72 });
  }
  for (const row of fawaid.data || []) {
    urls.push({ loc: `/fawaid/${row.id}`, lastmod: row.updated_at, priority: 0.68 });
  }
  for (const row of fatwas.data || []) {
    urls.push({ loc: `/fatwa/${row.slug || row.id}`, lastmod: row.updated_at, priority: 0.8 });
  }
  for (const row of updates.data || []) {
    urls.push({ loc: `/updates/${row.id}`, lastmod: row.updated_at, priority: 0.65 });
  }

  return urls;
}

export async function buildSitemapXml() {
  const config = loadSeoConfig();
  const base = config.siteUrl.replace(/\/+$/, "");
  const staticRoutes = (config.routes || []).filter((r) => r.sitemap !== false);

  const dynamic = await fetchDynamicUrls();
  const seen = new Set();

  const entries = [];
  for (const r of staticRoutes) {
    const loc = `${base}${r.path}`;
    if (seen.has(loc)) continue;
    seen.add(loc);
    entries.push({
      loc,
      priority: r.priority ?? 0.5,
      changefreq: r.changefreq || "weekly",
    });
  }

  for (const d of dynamic) {
    const loc = `${base}${d.loc}`;
    if (seen.has(loc)) continue;
    seen.add(loc);
    entries.push({
      loc,
      priority: d.priority ?? 0.6,
      changefreq: "weekly",
      lastmod: d.lastmod ? new Date(d.lastmod).toISOString().slice(0, 10) : undefined,
    });
  }

  const body = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${Number(e.priority).toFixed(2)}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export async function buildFeedXml() {
  const config = loadSeoConfig();
  const base = config.siteUrl.replace(/\/+$/, "");
  const admin = getSupabaseAdmin();

  let items = [];
  if (admin) {
    const { data } = await admin
      .from("lessons")
      .select("id, title, description, updated_at, slug")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(30);
    items = data || [];
  }

  const rssItems = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(`${base}/lessons/${item.slug || item.id}`)}</link>
      <description>${escapeXml((item.description || "").slice(0, 300))}</description>
      <pubDate>${item.updated_at ? new Date(item.updated_at).toUTCString() : new Date().toUTCString()}</pubDate>
      <guid isPermaLink="true">${escapeXml(`${base}/lessons/${item.slug || item.id}`)}</guid>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.siteName || "المجلس العلمي")}</title>
    <link>${escapeXml(base)}</link>
    <description>آخر الإضافات العلمية — دروس وفتاوى وقرارات</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;
}
