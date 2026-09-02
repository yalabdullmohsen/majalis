/**
 * أدوات مشتركة لفحوصات المراقبة والجودة.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isSitemapDenied, SITEMAP_DENY_PATHS } from "./seo-index-policy.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function parseBaseUrl(argv = process.argv) {
  const fromUrl = argv.find((a) => a.startsWith("--url="))?.slice(6);
  const fromBase = argv.find((a) => a.startsWith("--base="))?.slice(7);
  return (fromUrl || fromBase || "").replace(/\/+$/, "");
}

export function readText(rel) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

export function readJson(rel) {
  return JSON.parse(readText(rel));
}

export const FORBIDDEN_BRAND = [/majlisilm/i, /المجلس\s*العلمي/i];
export const BETA_MARKERS = [/قيد\s*الإضافة/i, /نسخة\s*تجريب/i, /^\s*تجريبي\s*$/i];
export const WEAK_MARKERS = [/\bweak\b/i, /(?<![\u0627\u0671])ضعيف/i];

export const PUBLIC_PAGES = [
  "/",
  "/lessons",
  "/quran-hub",
  "/mushaf",
  "/fiqh",
  "/hadith",
  "/adhkar",
  "/library",
  "/prayer-times",
  "/contact",
  "/privacy",
  "/terms",
];

export const PRIVATE_NOINDEX_PAGES = [
  "/search",
  "/profile",
  "/settings",
  "/assistant",
  "/login",
  "/register",
  "/admin",
  "/internal/status",
];

export const STATIC_ASSETS = [
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/sw.js",
];

export const API_PATHS = ["/api/healthz", "/api/readyz"];

export function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function metaContent(html, name) {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
    "i",
  );
  return html.match(re2)?.[1] || "";
}

export function hasNoindex(html) {
  const robots = metaContent(html, "robots").toLowerCase();
  return robots.includes("noindex");
}

export function canonicalHref(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (m) return m[1];
  return html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1] || "";
}

export function ogImage(html) {
  return metaContent(html, "og:image");
}

export function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    try {
      return new URL(m[1]).pathname.replace(/\/$/, "") || "/";
    } catch {
      return m[1];
    }
  });
}

export function forbiddenSitemapPaths(locs) {
  const failures = [];
  const patterns = [
    /login/i,
    /register/i,
    /profile/i,
    /settings/i,
    /\/search/i,
    /assistant/i,
    /\/api/i,
    /admin/i,
    /dashboard/i,
    /internal/i,
  ];
  for (const loc of locs) {
    if (isSitemapDenied(loc)) failures.push(loc);
    for (const re of patterns) {
      if (re.test(loc)) failures.push(`${loc} (${re})`);
    }
  }
  return [...new Set(failures)];
}

export function normalizeArabic(text) {
  return String(text || "")
    .replace(/[ً-ٟؐ-ؚۖ-ۜ۟-ۤۧ-ٰۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export function localSearchCount(term) {
  const indexPath = resolve(ROOT, "public/data/search/index.json");
  if (!existsSync(indexPath)) return null;
  const { docs = [] } = JSON.parse(readFileSync(indexPath, "utf8"));
  const q = normalizeArabic(term);
  if (!q) return 0;
  let count = 0;
  for (const doc of docs) {
    const hay = normalizeArabic(
      [doc.title, doc.summary, doc.text, doc.meta, doc.kind].filter(Boolean).join(" "),
    );
    if (hay.includes(q)) count++;
  }
  return count;
}

export async function fetchText(base, path, opts = {}) {
  const url = new URL(path, `${base}/`).toString();
  const res = await fetch(url, { redirect: "follow", ...opts });
  const text = await res.text();
  return { url, status: res.status, text, ok: res.ok };
}

export { isSitemapDenied, SITEMAP_DENY_PATHS };
