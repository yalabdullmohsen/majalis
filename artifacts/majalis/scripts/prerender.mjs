/**
 * scripts/prerender.mjs
 *
 * Build-time pre-rendering: generates a static HTML shell for each
 * public route defined in seo-routes.json. Vercel serves these files
 * directly (static-file serving takes priority over rewrites), so
 * crawlers and social cards get correct per-route meta tags without
 * needing a running server.
 *
 * Usage: node scripts/prerender.mjs  (runs after vite build)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const SEO_JSON = path.join(ROOT, "src/lib/seo-routes.json");

// ── helpers ──────────────────────────────────────────────────────────────
function esc(s) { return String(s || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function buildJsonLd(route, siteUrl) {
  const url = `${siteUrl}${route.path}`;
  const base = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": route.title.split(" | ")[0],
    "url": url,
    "description": route.description,
    "inLanguage": "ar",
    "isPartOf": { "@type": "WebSite", "url": siteUrl, "name": "المجلس العلمي" },
  };
  if (route.path.startsWith("/lessons")) {
    base["@type"] = "ItemList";
    base["name"] = "الدروس الشرعية";
  }
  if (route.path.startsWith("/library")) base["@type"] = "CollectionPage";
  if (route.path.startsWith("/seerah")) base["@type"] = "Article";
  if (route.path.startsWith("/quran")) base["@type"] = "WebPage";
  if (route.path.startsWith("/fatwa")) base["@type"] = "QAPage";
  return base;
}

function buildBreadcrumb(route, siteUrl) {
  if (route.path === "/") return null;
  const segments = route.path.split("/").filter(Boolean);
  const items = [{ "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": siteUrl }];
  let current = "";
  for (let i = 0; i < segments.length; i++) {
    current += `/${segments[i]}`;
    const label = route.path === current ? route.title.split(" | ")[0] : segments[i];
    items.push({ "@type": "ListItem", "position": i + 2, "name": label, "item": `${siteUrl}${current}` });
  }
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items };
}

// ── main ─────────────────────────────────────────────────────────────────
if (!fs.existsSync(DIST)) {
  console.error("❌  dist/ not found — run vite build first");
  process.exit(1);
}

const seoData = JSON.parse(fs.readFileSync(SEO_JSON, "utf8"));
const routes = seoData.routes;
const siteUrl = seoData.siteUrl;
const defaultImage = `${siteUrl}/opengraph.jpg`;

const baseHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

// Regex helpers to replace meta tags
function replaceMeta(html, attr, attrVal, content) {
  const re = new RegExp(`<meta\\s+${attr}="${escapeRegex(attrVal)}"[^>]*>`, "gi");
  const replacement = `<meta ${attr}="${attrVal}" content="${esc(content)}" />`;
  return re.test(html) ? html.replace(re, replacement) : html;
}
function replaceTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
}
function replaceCanonical(html, url) {
  return html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}" />`);
}
function replaceJsonLd(html, jsonLdArr) {
  const tag = `<script type="application/ld+json">${JSON.stringify(jsonLdArr, null, 0)}</script>`;
  // Remove existing ld+json and inject ours before </head>
  const cleaned = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
  return cleaned.replace("</head>", `${tag}\n</head>`);
}
function injectNoscript(html, route) {
  const h1 = esc(route.title.split(" | ")[0]);
  const desc = esc(route.description);
  const keywords = route.keywords ? route.keywords.slice(0, 5) : [];
  const keywordLinks = keywords
    .map(k => `<a href="${siteUrl}/search?q=${encodeURIComponent(k)}">${esc(k)}</a>`)
    .join(" · ");
  const noscript = [
    `<noscript>`,
    `<div dir="rtl" lang="ar" style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:1rem">`,
    `<h1>${h1}</h1>`,
    `<p>${desc}</p>`,
    keywordLinks ? `<p>${keywordLinks}</p>` : "",
    `<nav><a href="${siteUrl}/">الرئيسية</a> · <a href="${siteUrl}/search">البحث</a></nav>`,
    `</div>`,
    `</noscript>`,
  ].filter(Boolean).join("\n");
  return html.replace('<div id="root">', `${noscript}\n<div id="root">`);
}

/**
 * يُزيل الـnoscript الخاص بالصفحة الرئيسية من القالب قبل استخدامه للصفحات الفرعية.
 * يمنع نقل محتوى الرئيسية (الدروس/المكتبة/العلماء...) إلى كل الصفحات.
 */
function stripHomeNoscript(html) {
  // يزيل كتلة التعليق + noscript الكبيرة التابعة لها
  return html
    .replace(/<!--\s*محتوى للزواحف[^<]*-->\s*<noscript>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<noscript>\s*<\/noscript>/gi, ""); // يزيل الـnoscript الفارغة كذلك
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Skip noindex routes
const SKIP_ROBOTS = ["noindex"];

// نموذج HTML للصفحات الفرعية — بدون noscript الصفحة الرئيسية
const baseHtmlForRoutes = stripHomeNoscript(baseHtml);

let generated = 0;
let skipped = 0;

for (const route of routes) {
  if (route.path === "/" ) { skipped++; continue; } // root is dist/index.html
  if (route.robots && SKIP_ROBOTS.some(r => route.robots.includes(r))) { skipped++; continue; }

  const pageUrl = `${siteUrl}${route.path}`;
  const title = route.title;
  const desc = route.description;
  const ogType = route.ogType || "website";

  let html = baseHtmlForRoutes;
  html = replaceTitle(html, title);
  html = replaceMeta(html, "name", "description", desc);
  html = replaceMeta(html, "property", "og:title", title);
  html = replaceMeta(html, "property", "og:description", desc);
  html = replaceMeta(html, "property", "og:url", pageUrl);
  html = replaceMeta(html, "property", "og:type", ogType);
  html = replaceMeta(html, "property", "og:image", defaultImage);
  html = replaceMeta(html, "name", "twitter:title", title);
  html = replaceMeta(html, "name", "twitter:description", desc);
  html = replaceMeta(html, "name", "robots", route.robots || "index, follow");
  html = replaceCanonical(html, pageUrl);

  const page = buildJsonLd(route, siteUrl);
  const breadcrumb = buildBreadcrumb(route, siteUrl);
  const jsonLdArr = [page, ...(breadcrumb ? [breadcrumb] : [])];
  html = replaceJsonLd(html, jsonLdArr);
  html = injectNoscript(html, route);

  // Write to dist/{path}/index.html
  const segments = route.path.split("/").filter(Boolean);
  const outDir = path.join(DIST, ...segments);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
  generated++;
}

console.log(`✓ Pre-rendered ${generated} routes (${skipped} skipped)`);
