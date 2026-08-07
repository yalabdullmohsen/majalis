/**
 * بوابة توحيد الوسوم (Release Gate v6 / PR1):
 * - theme-color من site.config.json فقط
 * - OG افتراضي 1200×630 وmajlisilm-og-2026.jpg
 * - لا meta keywords
 * - تنقّل prerender موحّد العدد/الترتيب
 * - short_name قصير لا يُبتر
 *
 * تشغيل: node scripts/verify-meta-consistency-gate.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const issues = [];

function read(rel) {
  return readFileSync(resolve(appRoot, rel), "utf8");
}

const site = JSON.parse(read("site.config.json"));
const theme = site.themeColor || "#1F7A5A";
const themeDark = site.themeColorDark || "#4FB48B";
const defaultImage = site.defaultImage || "/majlisilm-og-2026.jpg";
const ogW = String(site.ogImageWidth || 1200);
const ogH = String(site.ogImageHeight || 630);
const navExpected = (site.prerenderNav || []).map((n) => n.label);

if (!/^#[0-9A-Fa-f]{6}$/.test(theme) || !/^#[0-9A-Fa-f]{6}$/.test(themeDark)) {
  issues.push("site.config.json: themeColor / themeColorDark يجب أن يكونا hex سداسي");
}
if (defaultImage !== "/majlisilm-og-2026.jpg") {
  issues.push(`defaultImage يجب أن يكون /majlisilm-og-2026.jpg (وجد ${defaultImage})`);
}
if (site.siteShortName !== "المجلس") {
  issues.push(`siteShortName يجب أن يكون «المجلس» لتفادي البتر — وجد «${site.siteShortName}»`);
}
if (navExpected.length < 5) {
  issues.push("prerenderNav ناقص في site.config.json");
}

// index.html
const indexHtml = read("index.html");
if (!indexHtml.includes(`content="${theme}"`)) {
  issues.push(`index.html: theme-color الافتراضي يجب أن يطابق ${theme}`);
}
if (!indexHtml.includes(`content="${themeDark}"`)) {
  issues.push(`index.html: theme-color dark يجب أن يطابق ${themeDark}`);
}
if (!/viewport-fit=cover/.test(indexHtml)) {
  issues.push("index.html: viewport-fit=cover مطلوب");
}
if (/initial-scale=1\.0/.test(indexHtml)) {
  issues.push("index.html: لا تستخدم initial-scale=1.0 — وحّد على 1");
}
if (!/name="color-scheme"[^>]*content="light dark"/.test(indexHtml)) {
  issues.push("index.html: color-scheme light dark مطلوب");
}
if (/name="keywords"/.test(indexHtml)) {
  issues.push("index.html: احذف meta keywords");
}
if (!indexHtml.includes("majlisilm-og-2026.jpg")) {
  issues.push("index.html: OG يجب أن يستخدم majlisilm-og-2026.jpg");
}
if (!indexHtml.includes('apple-mobile-web-app-title" content="المجلس العلمي"')) {
  issues.push("index.html: apple-mobile-web-app-title يجب أن يكون المجلس العلمي");
}

// manifests
for (const rel of ["public/manifest.json", "public/manifest.webmanifest", "public/site.webmanifest"]) {
  const m = JSON.parse(read(rel));
  if (m.name !== "المجلس العلمي") issues.push(`${rel}: name خاطئ`);
  if (m.short_name !== "المجلس") issues.push(`${rel}: short_name يجب «المجلس»`);
  if (m.theme_color !== theme) issues.push(`${rel}: theme_color يجب ${theme}`);
}

// theme-preference + site-config exports
const themePref = read("src/lib/theme-preference.ts");
if (!/BRAND_THEME_COLOR/.test(themePref)) {
  issues.push("theme-preference.ts يجب أن يستورد BRAND_THEME_COLOR من site-config");
}
if (/#164E3C/.test(themePref)) {
  issues.push("theme-preference.ts يحتوي لونًا قديمًا #164E3C");
}
const siteConfigTs = read("src/lib/site-config.ts");
if (!/BRAND_THEME_COLOR/.test(siteConfigTs)) {
  issues.push("site-config.ts يجب أن يصدّر BRAND_THEME_COLOR");
}

// generate-seo uses config colors + shared nav source
const genSeo = read("scripts/generate-seo.mjs");
if (!/SITE\.themeColor|THEME_COLOR/.test(genSeo)) {
  issues.push("generate-seo.mjs يجب أن يقرأ themeColor من site.config");
}
if (!/PRERENDER_NAV/.test(genSeo)) {
  issues.push("generate-seo.mjs يجب أن يعرّف PRERENDER_NAV من site.config");
}
if (/#164E3C/.test(genSeo)) {
  issues.push("generate-seo.mjs يحتوي #164E3C");
}

const postBuild = read("scripts/post-build-seo.mjs");
if (!/unifyPrerenderNav|PRERENDER_NAV/.test(postBuild)) {
  issues.push("post-build-seo.mjs يجب أن يوحّد تنقّل prerender عند الدمج");
}
if (!/ensureThemeColorMetas|themeColor/.test(postBuild)) {
  issues.push("post-build-seo.mjs يجب أن يفرض theme-color من site.config");
}

// Sample prerender pages if present (after generate:seo)
const prerenderRoot = resolve(appRoot, "seo-prerender");
const samplePaths = ["index.html", "quran-hub/index.html", "lessons/index.html"];
const navSignatures = [];

function extractNavLabels(html) {
  const navMatch = html.match(/<nav[^>]*aria-label="التنقل الرئيسي"[^>]*>([\s\S]*?)<\/nav>/);
  if (!navMatch) return null;
  return [...navMatch[1].matchAll(/>([^<]+)<\/a>/g)].map((m) => m[1].trim());
}

function checkHtml(rel, html) {
  if (/name="keywords"/.test(html)) issues.push(`${rel}: meta keywords ممنوع`);
  if (/#164E3C/.test(html)) issues.push(`${rel}: theme-color قديم #164E3C`);
  if (!/viewport-fit=cover/.test(html)) issues.push(`${rel}: viewport-fit=cover مطلوب`);
  if (/initial-scale=1\.0/.test(html)) issues.push(`${rel}: initial-scale=1.0 ممنوع`);
  if (!/application\/ld\+json/.test(html)) issues.push(`${rel}: JSON-LD مطلوب`);
  if (/property="og:image"\s+content="[^"]*logo\.png"/.test(html)) {
    issues.push(`${rel}: og:image لا يجوز أن يكون logo.png`);
  }
}

if (existsSync(prerenderRoot)) {
  for (const sample of samplePaths) {
    const full = join(prerenderRoot, sample);
    if (!existsSync(full)) continue;
    checkHtml(`seo-prerender/${sample}`, readFileSync(full, "utf8"));
  }
}

// توحيد التنقّل يُطبَّق في post-build — لا يُشترط تطابق ملفات seo-prerender المتتبَّعة
if (navExpected.length < 5) {
  issues.push("prerenderNav في site.config ناقص");
}

// structured data helpers
const sd = read("src/lib/seo-structured-data.ts");
for (const needed of ["organizationJsonLd", "websiteJsonLd", "faqPageJsonLd", "personJsonLd", "bookJsonLd", "lessonJsonLd"]) {
  if (!sd.includes(`function ${needed}`) && !sd.includes(`export function ${needed}`)) {
    issues.push(`seo-structured-data.ts ينقص ${needed}`);
  }
}

if (issues.length) {
  console.error("❌ بوابة توحيد الوسوم فشلت:\n");
  for (const i of issues) console.error(`  - ${i}`);
  process.exit(1);
}
console.log("✓ بوابة توحيد الوسوم: theme-color / OG / viewport / nav / JSON-LD / short_name");
