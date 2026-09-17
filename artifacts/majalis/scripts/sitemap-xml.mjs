/**
 * مولّد/مدقّق sitemap.xml وفق schema.org sitemaps 0.9.
 * مصدر واحد لـ generate-seo.mjs و sitemap-builder.mjs.
 */
import { isSitemapDenied } from "./seo-index-policy.mjs";

const CHANGEFREQ = new Set([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
]);

export function escapeXml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function normalizeSitemapPath(path) {
  const raw = String(path || "").split("?")[0].split("#")[0].trim();
  if (!raw || raw === "/") return "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

/** مسارات ومحتوى مستبعد إضافي (مسودات / مجمع / مراجعة). */
export function isExcludedFromSitemap(path) {
  const p = normalizeSitemapPath(path);
  if (isSitemapDenied(p)) return true;
  if (p === "/fiqh-council" || p.startsWith("/fiqh-council/")) return true;
  if (p === "/library" || p.startsWith("/library/")) return true;
  if (p === "/more" || p.startsWith("/more/")) return true;
  if (/(^|\/)(draft|pending[_-]review|pending-review)(\/|$)/i.test(p)) return true;
  if (/(^|\/)(excluded|unsupported)(\/|$)/i.test(p)) return true;
  return false;
}

function clampPriority(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function normalizeChangefreq(value) {
  const v = String(value || "weekly").toLowerCase();
  return CHANGEFREQ.has(v) ? v : "weekly";
}

function normalizeLastmod(value, fallbackIsoDate) {
  if (!value) return fallbackIsoDate;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallbackIsoDate;
  return d.toISOString().slice(0, 10);
}

/**
 * @param {Array<{ loc: string, lastmod?: string, changefreq?: string, priority?: number }>} entries
 * @param {{ siteUrl: string, lastmodFallback?: string, stylesheetHref?: string|null }} opts
 */
export function buildSitemapXmlDocument(entries, opts) {
  const siteUrl = String(opts.siteUrl || "https://www.ssunnah.com").replace(/\/+$/, "");
  const lastmodFallback =
    opts.lastmodFallback || new Date().toISOString().slice(0, 10);
  const stylesheetHref =
    opts.stylesheetHref === null ? null : opts.stylesheetHref || "/sitemap.xsl";

  const seen = new Set();
  const rows = [];

  for (const raw of entries || []) {
    let pathOrUrl = String(raw.loc || "").trim();
    if (!pathOrUrl) continue;

    let abs;
    let path;
    if (/^https?:\/\//i.test(pathOrUrl)) {
      abs = pathOrUrl;
      try {
        path = normalizeSitemapPath(new URL(abs).pathname);
      } catch {
        continue;
      }
    } else {
      path = normalizeSitemapPath(pathOrUrl);
      abs = `${siteUrl}${path === "/" ? "/" : path}`;
    }

    if (!abs.startsWith(siteUrl)) continue;
    if (isExcludedFromSitemap(path)) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);

    const lastmod = normalizeLastmod(raw.lastmod, lastmodFallback);
    const changefreq = normalizeChangefreq(raw.changefreq);
    const priority = clampPriority(raw.priority).toFixed(1);

    rows.push(
      [
        "  <url>",
        `    <loc>${escapeXml(abs)}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
        `    <changefreq>${escapeXml(changefreq)}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n"),
    );
  }

  const stylesheet =
    stylesheetHref != null
      ? `<?xml-stylesheet type="text/xsl" href="${escapeXml(stylesheetHref)}"?>\n`
      : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
${stylesheet}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.join("\n")}
</urlset>
`;

  const validation = validateSitemapXml(xml, { siteUrl });
  if (!validation.ok) {
    throw new Error(`sitemap.xml invalid: ${validation.errors.join("; ")}`);
  }
  return xml;
}

/**
 * @param {string} xml
 * @param {{ siteUrl?: string }} [opts]
 */
export function validateSitemapXml(xml, opts = {}) {
  const errors = [];
  const text = String(xml || "");
  const siteUrl = String(opts.siteUrl || "https://www.ssunnah.com").replace(/\/+$/, "");

  if (!text.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")) {
    errors.push("missing XML declaration");
  }
  if (!/<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(text)) {
    errors.push("missing urlset xmlns");
  }
  if (!text.trimEnd().endsWith("</urlset>")) {
    errors.push("urlset not closed");
  }
  if (/^[\s\S]*<(html|body|!DOCTYPE)/i.test(text)) {
    errors.push("HTML document instead of XML sitemap");
  }

  const open = (text.match(/<url>/g) || []).length;
  const close = (text.match(/<\/url>/g) || []).length;
  if (open !== close) errors.push(`url tag mismatch open=${open} close=${close}`);
  if (open < 1) errors.push("no url entries");

  const locs = [...text.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  if (locs.length !== open) errors.push("loc count mismatch");

  for (const loc of locs) {
    if (!loc.startsWith(siteUrl)) {
      errors.push(`loc outside site: ${loc}`);
      break;
    }
    if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(loc)) {
      errors.push(`unescaped amp in loc: ${loc}`);
      break;
    }
    try {
      const path = normalizeSitemapPath(new URL(loc.replace(/&amp;/g, "&")).pathname);
      if (isExcludedFromSitemap(path)) {
        errors.push(`excluded path present: ${path}`);
        break;
      }
    } catch {
      errors.push(`bad loc URL: ${loc}`);
      break;
    }
  }

  const lastmods = [...text.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((m) => m[1]);
  if (lastmods.length !== open) errors.push("every url must include lastmod");
  for (const lm of lastmods.slice(0, 20)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lm)) {
      errors.push(`bad lastmod: ${lm}`);
      break;
    }
  }

  const priorities = [...text.matchAll(/<priority>([^<]*)<\/priority>/g)].map((m) => m[1]);
  for (const pr of priorities.slice(0, 50)) {
    if (!/^\d\.\d$/.test(pr)) {
      errors.push(`priority must be X.X got ${pr}`);
      break;
    }
    const n = Number(pr);
    if (n < 0 || n > 1) {
      errors.push(`priority out of range: ${pr}`);
      break;
    }
  }

  return { ok: errors.length === 0, errors, urlCount: open };
}
