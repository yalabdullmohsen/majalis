#!/usr/bin/env node
/**
 * زحف روابط داخلية على مخرجات dist/ (بلا خادم).
 * يفشل عند روابط /path تشير إلى صفحة بلا ملف HTML مطابق وبلا قاعدة redirect.
 *
 * التشغيل: node scripts/crawl-internal-links.mjs
 * يتطلب: dist/ بعد البناء.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(appRoot, "dist");

if (!existsSync(dist)) {
  console.error("✗ dist/ غير موجود — شغّل البناء أولاً");
  process.exit(1);
}

const vercel = JSON.parse(readFileSync(resolve(appRoot, "vercel.json"), "utf8"));
const redirectSources = new Set((vercel.redirects || []).map((r) => r.source.replace(/:\w+/g, "*")));

function walkHtml(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkHtml(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

function normalizePath(href) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  if (/^https?:\/\//i.test(href)) {
    try {
      const u = new URL(href);
      if (!/majlisilm\.com$/i.test(u.hostname)) return null;
      href = u.pathname;
    } catch {
      return null;
    }
  }
  if (!href.startsWith("/")) return null;
  // تجاهل الأصول والـAPI
  if (
    href.startsWith("/api/") ||
    href.startsWith("/assets/") ||
    href.startsWith("/data/") ||
    href.startsWith("/fonts/") ||
    href.startsWith("/icon") ||
    href.startsWith("/favicon") ||
    href.startsWith("/logo") ||
    href.startsWith("/manifest") ||
    href.startsWith("/sw") ||
    href.startsWith("/.well-known")
  ) {
    return null;
  }
  // أصول ثابتة (خطوط/صور/صوت) — ليست صفحات HTML
  if (/\.(woff2?|ttf|otf|eot|png|jpe?g|gif|webp|avif|svg|mp3|mp4|webm|pdf|json|xml|txt|ico)$/i.test(href.split("?")[0])) {
    return null;
  }
  const path = href.split("?")[0].split("#")[0];
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

function htmlExistsFor(path) {
  if (path === "/") return existsSync(join(dist, "index.html"));
  const candidates = [
    join(dist, path.slice(1), "index.html"),
    join(dist, `${path.slice(1)}.html`),
  ];
  return candidates.some((p) => existsSync(p));
}

function matchesRedirect(path) {
  for (const src of redirectSources) {
    if (!src.includes("*")) {
      if (src === path) return true;
      continue;
    }
    const re = new RegExp("^" + src.replace(/\*/g, "[^/]+") + "$");
    if (re.test(path)) return true;
  }
  return false;
}

// مسارات SPA ديناميكية معروفة — لا تُعامل ككسور إن وُجدت قشرة فهرس القسم
const DYNAMIC_PREFIXES = [
  "/library/",
  "/scholars/",
  "/lessons/",
  "/rulings/",
  "/prophets/",
  "/nations/",
  "/topics/",
  "/qa/",
  "/fiqh-council/",
  "/annual-courses/",
  "/learning/paths/",
  "/mushaf/",
  "/quran/surah-stories/",
  "/sins-and-rights/",
  "/universities/",
  "/c/",
  "/updates/",
];

function isCoveredDynamic(path) {
  return DYNAMIC_PREFIXES.some((p) => path.startsWith(p));
}

const htmlFiles = walkHtml(dist);
const hrefRe = /href=["']([^"']+)["']/gi;
const broken = new Set();
const seen = new Set();
let checked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  let m;
  while ((m = hrefRe.exec(html))) {
    const path = normalizePath(m[1]);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    checked++;
    if (htmlExistsFor(path) || matchesRedirect(path) || isCoveredDynamic(path)) continue;
    // صفحة بحث/حساب لا تُفهرس — إن لم تُبنَ كـprerender تُحسب كسرًا فقط إن وُجدت في قائمة عامة
    if (path.startsWith("/admin") || path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/search")) {
      continue;
    }
    broken.add(path);
  }
}

const report = {
  htmlFiles: htmlFiles.length,
  uniqueInternalHrefs: seen.size,
  checked,
  broken: [...broken].sort(),
};

const outPath = resolve(appRoot, "reports/crawl-internal-links.json");
import { writeFileSync, mkdirSync } from "node:fs";
mkdirSync(resolve(appRoot, "reports"), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

if (broken.size) {
  console.error(`✗ روابط داخلية بلا صفحة/تحويل: ${broken.size}`);
  [...broken].slice(0, 40).forEach((p) => console.error("  " + p));
  if (broken.size > 40) console.error(`  … و${broken.size - 40}`);
  console.error(`التقرير: ${outPath}`);
  process.exit(1);
}

console.log(`✓ زحف الروابط: ${htmlFiles.length} HTML · ${seen.size} رابط فريد · 0 مكسور`);
console.log(`التقرير: ${outPath}`);
