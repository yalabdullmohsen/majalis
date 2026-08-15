#!/usr/bin/env node
/**
 * تدقيق قابلية الفهرسة للإنتاج — seo-prerender + dist + sitemap
 * يفشل فقط عند دليل مثبت في المخرجات المبنية.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const fail = (m: string) => errors.push(m);

const ALLOWED_EMAIL = "Majlisilm.app@gmail.com";
const FORBIDDEN_EMAILS = [/info@majlisilm\.com/i, /yalabdullmohsen1@gmail\.com/i];
const GENERIC_SOURCE = ["رابط القراءة", "المصدر: رابط القراءة", "مصدر غير محدد", "المصدر غير متوفر"];
const REVIEW_MARKERS = ["قيد المراجعة الشرعية", "لم يُسجَّل مراجِع شرعي", "للاطلاع لا للاحتجاج"];
const SETUP_MARKERS = ["قيد الإعداد"];
const UI_IN_META = ["Esc للقائمة", "اختصارات:", "نسخ النص", "سناب شات", "← التالي", "→ السابق"];

function walk(dir: string, pred: (n: string, p: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".backup") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, pred, out);
    else if (pred(name, p)) out.push(p);
  }
  return out;
}

function robotsOf(html: string): string {
  return (html.match(/name=["']robots["'][^>]*content=["']([^"']+)/i) || [])[1]?.toLowerCase() || "";
}

function metaDesc(html: string): string {
  return (html.match(/name=["']description["'][^>]*content=["']([^"']*)/i) || [])[1] || "";
}

function urlPathFromRel(rel: string, base: string): string {
  return (
    ("/" + rel.replace(new RegExp(`^${base}[/\\\\]`), "").replace(/[/\\]index\.html$/, "").replace(/\\/g, "/")).replace(
      /\/$/,
      "",
    ) || "/"
  );
}

const sitemapPaths = new Set<string>();
const smFile = path.join(root, "public/sitemap.xml");
if (!fs.existsSync(smFile)) fail("public/sitemap.xml مفقود");
else {
  const xml = fs.readFileSync(smFile, "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      sitemapPaths.add(new URL(m[1]!).pathname.replace(/\/$/, "") || "/");
    } catch {
      fail(`loc غير صالح: ${m[1]}`);
    }
  }
}

let scanned = 0;
let noindexReview = 0;
let noindexSetup = 0;

for (const base of ["seo-prerender", "dist"] as const) {
  const dir = path.join(root, base);
  if (!fs.existsSync(dir)) continue;

  for (const file of walk(dir, (n) => n === "index.html")) {
    scanned++;
    const rel = path.relative(root, file);
    const html = fs.readFileSync(file, "utf8");
    const robots = robotsOf(html);
    const noindex = /\bnoindex\b/.test(robots);
    const desc = metaDesc(html);
    const urlPath = urlPathFromRel(rel, base);
    const inSitemap = sitemapPaths.has(urlPath) || sitemapPaths.has(urlPath + "/");
    const isMethodology = /[/\\]methodology[/\\]/.test(rel) || urlPath === "/methodology";

    for (const re of FORBIDDEN_EMAILS) {
      if (re.test(html)) fail(`${rel}: بريد غير مسموح في HTML الإنتاج`);
    }

    for (const ph of UI_IN_META) {
      if (desc.includes(ph)) fail(`${rel}: نص واجهة داخل meta description («${ph}»)`);
    }

    for (const g of GENERIC_SOURCE) {
      if (html.includes(g)) fail(`${rel}: مصدر عام غير صالح «${g}»`);
    }

    // قيد مراجعة في صفحة مفهرسة (methodology مستثناة كتوثيق للمنهج)
    if (!isMethodology) {
      const hasReview = REVIEW_MARKERS.some((m) => html.includes(m) || desc.includes(m));
      if (hasReview) {
        if (!noindex) fail(`${rel}: «قيد المراجعة» مفهرسة بلا noindex`);
        else noindexReview++;
        if (inSitemap) fail(`${rel}: قيد مراجعة داخل sitemap`);
      }
    }

    const hasSetup = SETUP_MARKERS.some((m) => desc.includes(m) || /قيد الإعداد/.test(html));
    if (hasSetup && /knowledge-graph|features-in-progress|قيد الإعداد/.test(html + desc)) {
      // صفحة قيد إعداد مع وصف/محتوى يحمل العبارة
      if (desc.includes("قيد الإعداد") || /<article[\s\S]{0,4000}قيد الإعداد/.test(html)) {
        if (!noindex) fail(`${rel}: «قيد الإعداد» مفهرسة بلا noindex`);
        else noindexSetup++;
        if (inSitemap && !noindex) fail(`${rel}: قيد إعداد داخل sitemap`);
      }
    }

    if (/جميع العلاقات موثقة/.test(html) && /قيد الإعداد/.test(html)) {
      fail(`${rel}: تناقض «جميع العلاقات موثقة» مع قيد الإعداد`);
    }

    if (!noindex && /الموضوع غير موجود|الصفحة غير موجودة/.test(html) && /<article/.test(html)) {
      fail(`${rel}: صفحة 200 تعرض «غير موجود» ومفهرسة`);
    }

    // JSON-LD ناقص
    for (const block of html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) {
      const ld = block[1] || "";
      if (/TODO|placeholder|رابط القراءة|undefined|null/.test(ld)) {
        fail(`${rel}: JSON-LD يحتوي نصاً ناقصاً`);
      }
      if (/جميع العلاقات موثقة/.test(ld) && /قيد الإعداد/.test(html)) {
        fail(`${rel}: JSON-LD يدّعي توثيقاً كاملاً مع قيد إعداد`);
      }
    }

    // كتب بلا مصدر يجب أن تكون noindex وخارج sitemap
    if (/[/\\]library[/\\]book-/.test(rel) && /<dt>المصدر:<\/dt><dd>قيد الإضافة<\/dd>/.test(html)) {
      if (!noindex) fail(`${rel}: كتاب بلا مصدر مفهرس`);
      if (inSitemap) fail(`${rel}: كتاب بلا مصدر داخل sitemap`);
    }
  }
}

// knowledge-graph: يجب أن يكون خارج sitemap
if (sitemapPaths.has("/knowledge-graph") || sitemapPaths.has("/knowledge-graph/")) {
  fail("knowledge-graph موجود في sitemap رغم قيد الإعداد");
}

// البريد الرسمي في الإعداد
const siteCfg = fs.readFileSync(path.join(root, "site.config.json"), "utf8");
if (!siteCfg.includes(ALLOWED_EMAIL)) fail(`site.config.json يجب أن يحتوي ${ALLOWED_EMAIL}`);

// مصدر التوليد لا يعيد «رابط القراءة»
const genSeo = fs.readFileSync(path.join(root, "scripts/generate-seo.mjs"), "utf8");
if (/رابط القراءة/.test(genSeo)) fail("generate-seo.mjs ما زال يولّد «رابط القراءة»");

// كتب بلا external_url → noindex في المولّد
const { LIBRARY_CATALOG } = await import(pathToFileURL(path.join(root, "src/lib/library-catalog.ts")).href);
const sampleNeed = (LIBRARY_CATALOG as Array<{ id: string; external_url?: string }>)
  .filter((b) => !String(b.external_url || "").trim())
  .slice(0, 8);
for (const b of sampleNeed) {
  const htmlPath = path.join(root, "seo-prerender/library", b.id, "index.html");
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  if (!/\bnoindex\b/i.test(robotsOf(html))) fail(`library/${b.id}: بلا مصدر ويجب noindex`);
  if (sitemapPaths.has(`/library/${b.id}`)) fail(`library/${b.id}: بلا مصدر وما زال في sitemap`);
}

console.log(
  JSON.stringify(
    {
      scanned,
      sitemapUrls: sitemapPaths.size,
      noindexReviewPagesSeen: noindexReview,
      noindexSetupPagesSeen: noindexSetup,
      errors: errors.length,
    },
    null,
    2,
  ),
);

if (errors.length) {
  console.error(`audit:production-indexability FAILED\n- ${errors.slice(0, 50).join("\n- ")}`);
  process.exit(1);
}
console.log("audit:production-indexability OK");
