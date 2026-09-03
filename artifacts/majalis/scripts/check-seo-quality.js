#!/usr/bin/env node
/**
 * فحص SEO — title/description/canonical/og + sitemap policy.
 *
 * Usage:
 *   node scripts/check-seo-quality.js
 *   node scripts/check-seo-quality.js --url=https://www.ssunnah.com
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ROOT,
  parseBaseUrl,
  readJson,
  hasNoindex,
  canonicalHref,
  ogImage,
  parseSitemapLocs,
  forbiddenSitemapPaths,
  fetchText,
  isSitemapDenied,
} from "./monitoring-utils.mjs";

const base = parseBaseUrl();
const failures = [];

function titleFromHtml(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() || "";
}

function descriptionFromHtml(html) {
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (m) return m[1].trim();
  return html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim() || "";
}

function loadIndexedRoutes() {
  const seo = readJson("src/lib/seo-routes.json");
  return (seo.routes || []).filter((r) => {
    const robots = String(r.robots || "");
    if (robots.includes("noindex")) return false;
    if (r.sitemap === false) return false;
    const p = String(r.path || "").replace(/\/$/, "") || "/";
    return !isSitemapDenied(p);
  });
}

function prerenderPath(routePath) {
  if (routePath === "/") return resolve(ROOT, "dist/index.html");
  const clean = routePath.replace(/^\//, "");
  return resolve(ROOT, "dist", clean, "index.html");
}

async function checkRoute(route) {
  const path = String(route.path || "").replace(/\/$/, "") || "/";
  const expectedTitle = route.title || "";
  const expectedDesc = route.description || "";

  let html = "";
  if (base) {
    const { status, text } = await fetchText(base, path);
    if (status !== 200) {
      failures.push(`${path}: HTTP ${status}`);
      return;
    }
    html = text;
  } else {
    const file = prerenderPath(path);
    if (!existsSync(file)) {
      failures.push(`${path}: prerender مفقود (${file}) — شغّل build أو --url`);
      return;
    }
    html = readFileSync(file, "utf8");
  }

  const title = titleFromHtml(html);
  const desc = descriptionFromHtml(html);
  const canon = canonicalHref(html);
  const og = ogImage(html);

  if (!title) failures.push(`${path}: title مفقود`);
  else if (expectedTitle && !title.includes(expectedTitle.replace(/\s*\|\s*سُنّة.*/, "").trim())) {
    failures.push(`${path}: title غير متوقع «${title}»`);
  }

  if (!desc) failures.push(`${path}: description مفقود`);
  else if (expectedDesc && desc !== expectedDesc && !desc.includes(expectedDesc.slice(0, 40))) {
    failures.push(`${path}: description غير متطابق`);
  }

  if (!canon) failures.push(`${path}: canonical مفقود`);
  else if (base && !canon.startsWith("https://")) failures.push(`${path}: canonical غير مطلق`);

  if (!og) failures.push(`${path}: og:image مفقود`);
  if (hasNoindex(html)) failures.push(`${path}: noindex رغم أنه مفهرس`);
}

console.log(`▶ check-seo-quality${base ? ` — ${base}` : " (dist prerender)"}\n`);

const routes = loadIndexedRoutes().slice(0, 40);
const descriptions = new Map();

for (const route of routes) {
  await checkRoute(route);
  const desc = route.description || "";
  if (desc) {
    if (descriptions.has(desc)) {
      failures.push(`description مكرر: ${route.path} و ${descriptions.get(desc)}`);
    } else {
      descriptions.set(desc, route.path);
    }
  }
}

const sitemapLocal = resolve(ROOT, "public/sitemap.xml");
if (base) {
  const { status, text } = await fetchText(base, "/sitemap.xml");
  if (status !== 200) failures.push(`sitemap: HTTP ${status}`);
  else {
    const bad = forbiddenSitemapPaths(parseSitemapLocs(text));
    if (bad.length) failures.push(`sitemap: مسارات ممنوعة ${bad.slice(0, 5).join(", ")}`);
  }
} else if (existsSync(sitemapLocal)) {
  const xml = readFileSync(sitemapLocal, "utf8");
  const bad = forbiddenSitemapPaths(parseSitemapLocs(xml));
  if (bad.length) failures.push(`sitemap: مسارات ممنوعة ${bad.slice(0, 5).join(", ")}`);
} else {
  failures.push("public/sitemap.xml مفقود");
}

if (failures.length) {
  console.error("❌ check-seo-quality فشل:");
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log(`✅ check-seo-quality — ${routes.length} مسار مفهرس`);
