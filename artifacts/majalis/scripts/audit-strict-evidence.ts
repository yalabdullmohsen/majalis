#!/usr/bin/env node
/**
 * تدقيق STRICT_EVIDENCE — يفحص dist (+ seo-prerender) وsitemap فقط.
 * يفشل عند نصوص محظورة مثبتة في المخرجات المبنية.
 * يكتب: reports/strict-evidence-audit.json + reports/strict-evidence-audit.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const notes: string[] = [];
const fail = (m: string) => errors.push(m);
const note = (m: string) => notes.push(m);

const ALLOWED_EMAIL = ["Majlisilm", ".", "app", "@", "gmail", ".", "com"].join("");
const FORBIDDEN = [
  ["info", "@", "majlisilm", ".", "com"].join(""),
  ["yalabdullmohsen1", "@", "gmail", ".", "com"].join(""),
  "المصدر: رابط القراءة",
  "رابط القراءة",
  "مصدر غير محدد",
  "المصدر غير متوفر",
  "جميع العلاقات المعروضة موثقة",
  "فيلسوف الإسلام الأكبر",
  "فقيه المذهب غير المنازع",
  "أعظم شروح صحيح البخاري وأكملها",
] as const;

const UI_SURFACE = ["Esc للقائمة", "اختصارات:", "واتساب سناب شات", "lorem ipsum"];
const PLACEHOLDER_RE = /\b(undefined|TODO|placeholder)\b/i;
// null/NaN ككلمات منفصلة داخل نص ظاهر — تجنّب JSON-LD false positives عبر فحص article/meta فقط

function walk(dir: string, pred: (n: string, p: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".backup" || name === "assets") continue;
    const p = path.join(dir, name);
    let st: fs.Stats;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
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

function articleText(html: string): string {
  return html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] || "";
}

function urlPathFromRel(rel: string, base: string): string {
  return (
    ("/" + rel.replace(new RegExp(`^${base}[/\\\\]`), "").replace(/[/\\]index\.html$/, "").replace(/\\/g, "/")).replace(
      /\/$/,
      "",
    ) || "/"
  );
}

const distDir = path.join(root, "dist");
if (!fs.existsSync(distDir)) {
  fail("مجلد dist مفقود — شغّل build أولاً");
}

const sitemapPaths = new Set<string>();
const smFile = path.join(root, "public/sitemap.xml");
const distSitemap = path.join(distDir, "sitemap.xml");
const sitemapSource = fs.existsSync(distSitemap) ? distSitemap : smFile;
if (!fs.existsSync(sitemapSource)) fail("sitemap.xml مفقود");
else {
  const xml = fs.readFileSync(sitemapSource, "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      sitemapPaths.add(new URL(m[1]!).pathname.replace(/\/$/, "") || "/");
    } catch {
      fail(`loc غير صالح: ${m[1]}`);
    }
  }
}

type Hit = { file: string; path: string; needle: string; context: string };
const hits: Hit[] = [];
let scannedHtml = 0;
let scannedJs = 0;

function pushHit(file: string, urlPath: string, needle: string, ctx: string) {
  hits.push({ file, path: urlPath, needle, context: ctx.slice(0, 120) });
  fail(`${file}: «${needle}»`);
}

// ── HTML في dist (+ seo-prerender للمطابقة) ───────────────────────────────
for (const base of ["dist", "seo-prerender"] as const) {
  const dir = path.join(root, base);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir, (n) => n === "index.html" || n.endsWith(".html"))) {
    scannedHtml++;
    const rel = path.relative(root, file);
    const html = fs.readFileSync(file, "utf8");
    const robots = robotsOf(html);
    const noindex = /\bnoindex\b/.test(robots);
    const desc = metaDesc(html);
    const art = articleText(html);
    const urlPath = urlPathFromRel(rel, base);
    const inSitemap = sitemapPaths.has(urlPath) || sitemapPaths.has(urlPath + "/");
    const isMethodology = urlPath === "/methodology" || /[/\\]methodology[/\\]/.test(rel);

    for (const needle of FORBIDDEN) {
      if (html.includes(needle)) {
        // methodology قد تذكر وسم المراجعة كنص توثيقي — لا تفشل على ذلك الوسم وحده هناك
        if (isMethodology && /قيد المراجعة|للاطلاع لا للاحتجاج/.test(needle)) continue;
        pushHit(rel, urlPath, needle, html.slice(Math.max(0, html.indexOf(needle) - 20), html.indexOf(needle) + needle.length + 20));
      }
    }

    for (const ph of UI_SURFACE) {
      if (desc.includes(ph) || /<article[\s\S]{0,8000}/.test(html) && art.includes(ph)) {
        pushHit(rel, urlPath, ph, desc || art.slice(0, 80));
      }
    }

    const surface = `${desc}\n${art}`;
    if (PLACEHOLDER_RE.test(surface) && !noindex) {
      pushHit(rel, urlPath, "placeholder/TODO/undefined في سطح مفهرس", surface.match(PLACEHOLDER_RE)?.[0] || "");
    }
    if (/\bNaN\b/.test(surface) && !noindex) {
      pushHit(rel, urlPath, "NaN", "NaN في title/desc/article");
    }

    // قيد مراجعة على صفحة غير methodology
    if (!isMethodology && /قيد المراجعة الشرعية/.test(html)) {
      if (!noindex) fail(`${rel}: قيد مراجعة بلا noindex`);
      if (inSitemap) fail(`${rel}: قيد مراجعة داخل sitemap`);
    }

    // قيد إعداد في description أو article → must noindex + out of sitemap
    if (/قيد الإعداد/.test(desc) || /<article[\s\S]{0,5000}قيد الإعداد/.test(html)) {
      if (!noindex) fail(`${rel}: قيد إعداد بلا noindex`);
      if (inSitemap && !noindex) fail(`${rel}: قيد إعداد داخل sitemap`);
    }

    if (/جميع العلاقات المعروضة موثقة/.test(html) && /قيد الإعداد/.test(html)) {
      fail(`${rel}: تناقض توثيق كامل مع قيد إعداد`);
    }

    // كتب بلا مصدر
    if (/[/\\]library[/\\]book-/.test(rel) && /<dt>المصدر:<\/dt><dd>قيد الإضافة<\/dd>/.test(html)) {
      if (!noindex) fail(`${rel}: كتاب بلا مصدر مفهرس`);
      if (inSitemap) fail(`${rel}: كتاب بلا مصدر في sitemap`);
    }

    // noindex يجب ألا يكون في sitemap (ما عدا أخطاء توليد)
    if (noindex && inSitemap && base === "dist") {
      // بعض الصفحات قد تُستثنى إن وُجدت بالخطأ — نسجّل فشلاً
      fail(`${rel}: noindex وما زال في sitemap`);
    }
  }
}

// ── JS المجمّع في dist/assets — بريد ومصدر وهمي فقط (لا null في كود) ───────
const assetsDir = path.join(distDir, "assets");
if (fs.existsSync(assetsDir)) {
  for (const file of walk(assetsDir, (n) => /\.(js|css|html|json)$/.test(n))) {
    scannedJs++;
    const rel = path.relative(root, file);
    const text = fs.readFileSync(file, "utf8");
    for (const needle of [
      ["info", "@", "majlisilm", ".", "com"].join(""),
      ["yalabdullmohsen1", "@", "gmail", ".", "com"].join(""),
      "رابط القراءة",
      "المصدر: رابط القراءة",
      "جميع العلاقات المعروضة موثقة",
      "فيلسوف الإسلام الأكبر",
      "فقيه المذهب غير المنازع",
    ] as const) {
      if (text.includes(needle)) pushHit(rel, "(asset)", needle, "");
    }
  }
}

// knowledge-graph خارج sitemap
if (sitemapPaths.has("/knowledge-graph")) {
  fail("knowledge-graph موجود في sitemap");
}

const siteCfg = path.join(root, "site.config.json");
if (fs.existsSync(siteCfg)) {
  const cfg = fs.readFileSync(siteCfg, "utf8");
  if (!cfg.includes(ALLOWED_EMAIL)) fail(`site.config بلا ${ALLOWED_EMAIL}`);
  if (/info@majlisilm\.com|yalabdullmohsen1@gmail\.com/i.test(cfg)) fail("site.config يحتوي بريداً قديماً");
} else {
  fail("site.config.json مفقود");
}

const summary = {
  mode: "STRICT_EVIDENCE_ONLY",
  scannedHtml,
  scannedJs,
  sitemapUrls: sitemapPaths.size,
  forbiddenHits: hits.length,
  errors: errors.length,
  notes: notes.length,
  hits: hits.slice(0, 80),
  errorSample: errors.slice(0, 60),
};

const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(reportsDir, "strict-evidence-audit.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");

const md = `# تدقيق STRICT_EVIDENCE

تاريخ: ${new Date().toISOString().slice(0, 10)}

## ملخص

| المقياس | القيمة |
|---|---|
| HTML ممسوح | ${scannedHtml} |
| أصول JS/CSS | ${scannedJs} |
| عناوين sitemap | ${sitemapPaths.size} |
| مطابقات محظورة | ${hits.length} |
| أخطاء | ${errors.length} |

## الحالة

${errors.length ? "**FAILED**" : "**OK** — لا نصوص محظورة مثبتة في dist/prerender ضمن نطاق الفحص"}

## عيّنة أخطاء

${errors.length ? errors.slice(0, 40).map((e) => `- ${e}`).join("\n") : "_لا أخطاء_"}

## ملاحظات

${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "_لا ملاحظات_"}

راجع أيضاً: \`reports/evidence-register.md\`
`;
fs.writeFileSync(path.join(reportsDir, "strict-evidence-audit.md"), md, "utf8");

console.log(JSON.stringify({ scannedHtml, scannedJs, sitemapUrls: sitemapPaths.size, errors: errors.length, report: "reports/strict-evidence-audit.md" }, null, 2));

if (errors.length) {
  console.error(`audit:strict-evidence FAILED\n- ${errors.slice(0, 40).join("\n- ")}`);
  process.exit(1);
}
console.log("audit:strict-evidence OK");
note("انظر evidence-register.md للقرارات");
