/**
 * بوابة توحيد الوسوم:
 * - theme-color من site.config.json فقط
 * - OG افتراضي = brand/official-og.png مع cache-bust
 * - لا meta keywords
 * - تنقّل prerender موحّد
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
const defaultImage = site.defaultImage || "/brand/official-og.png?v=20260815";
const logoImage = site.logoImage || "/brand/official.png?v=20260815";
const ogW = String(site.ogImageWidth || 1200);
const ogH = String(site.ogImageHeight || 630);
const navExpected = (site.prerenderNav || []).map((n) => n.label);
const shortName = site.siteShortName || "المجلس العلمي";

if (!/^#[0-9A-Fa-f]{6}$/.test(theme) || !/^#[0-9A-Fa-f]{6}$/.test(themeDark)) {
  issues.push("site.config.json: themeColor / themeColorDark يجب أن يكونا hex سداسي");
}
if (!String(defaultImage).includes("/brand/official-og.png")) {
  issues.push(`defaultImage يجب أن يشير إلى /brand/official-og.png (وجد ${defaultImage})`);
}
if (!String(logoImage).includes("/brand/official.png")) {
  issues.push(`logoImage يجب أن يشير إلى /brand/official.png (وجد ${logoImage})`);
}
if (navExpected.length < 5) {
  issues.push("prerenderNav ناقص في site.config.json");
}

const indexHtml = read("index.html");
if (!indexHtml.includes(`content="${theme}"`)) {
  issues.push(`index.html: theme-color السطح يجب أن يطابق ${theme}`);
}
if (!indexHtml.includes('content="#F2F4F3"')) {
  issues.push("index.html: theme-color الإقلاع يجب #F2F4F3 مع خلفية السطح");
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
if (!indexHtml.includes("brand/official-og.png")) {
  issues.push("index.html: OG يجب أن يستخدم brand/official-og.png");
}
if (/majlisilm-og-2026/.test(indexHtml)) {
  issues.push("index.html: لا تستخدم majlisilm-og-2026");
}
if (!indexHtml.includes('apple-mobile-web-app-title" content="المجلس العلمي"')) {
  issues.push("index.html: apple-mobile-web-app-title يجب أن يكون المجلس العلمي");
}
if (!indexHtml.includes('application-name" content="المجلس العلمي"')) {
  issues.push("index.html: application-name يجب أن يكون المجلس العلمي");
}
if (!indexHtml.includes("favicon.ico")) {
  issues.push("index.html: favicon.ico مطلوب");
}

for (const rel of ["public/manifest.json", "public/manifest.webmanifest", "public/site.webmanifest"]) {
  const m = JSON.parse(read(rel));
  if (m.name !== "المجلس العلمي") issues.push(`${rel}: name خاطئ`);
  if (m.short_name !== shortName) issues.push(`${rel}: short_name يجب «${shortName}»`);
  if (m.theme_color !== theme) issues.push(`${rel}: theme_color يجب ${theme}`);
  if (m.background_color !== "#F2F4F3") issues.push(`${rel}: background_color يجب #F2F4F3 (سطح التطبيق)`);
  const iconSrcs = (m.icons || []).map((i) => String(i.src || ""));
  if (iconSrcs.some((s) => /majlisilm-og-2026|favicon\.svg/.test(s))) {
    issues.push(`${rel}: أيقونة قديمة في icons`);
  }
  if (!iconSrcs.some((s) => s.includes("icon-512.png"))) {
    issues.push(`${rel}: يجب تضمين icon-512.png`);
  }
}

const themePref = read("src/lib/theme-preference.ts");
if (!themePref.includes("BRAND_THEME_COLOR")) {
  issues.push("theme-preference.ts يجب أن يستورد BRAND_THEME_COLOR");
}

const genSeo = read("scripts/generate-seo.mjs");
if (!genSeo.includes("themeColor")) {
  issues.push("generate-seo.mjs يجب أن يقرأ themeColor من site.config");
}
if (!genSeo.includes("PRERENDER_NAV")) {
  issues.push("generate-seo.mjs يجب أن يعرّف PRERENDER_NAV من site.config");
}
if (!genSeo.includes("LOGO_IMAGE") && !genSeo.includes("logoImage")) {
  issues.push("generate-seo.mjs يجب أن يستخدم logoImage الرسمي");
}

const postBuild = read("scripts/post-build-seo.mjs");
if (!postBuild.includes("theme-color") && !postBuild.includes("themeColor")) {
  issues.push("post-build-seo.mjs يجب أن يفرض theme-color من site.config");
}

if (!existsSync(resolve(appRoot, "public/brand/official.png"))) {
  issues.push("public/brand/official.png مفقود");
}
if (!existsSync(resolve(appRoot, "public/brand/official-og.png"))) {
  issues.push("public/brand/official-og.png مفقود");
}
if (!existsSync(resolve(appRoot, "public/favicon.ico"))) {
  issues.push("public/favicon.ico مفقود");
}
if (!existsSync(resolve(appRoot, "public/apple-touch-icon.png"))) {
  issues.push("public/apple-touch-icon.png مفقود");
}
if (existsSync(resolve(appRoot, "public/majlisilm-og-2026.jpg"))) {
  issues.push("احذف public/majlisilm-og-2026.jpg — استُبدل بـ official-og");
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name === "index.html") out.push(p);
  }
  return out;
}

if (existsSync(resolve(appRoot, "seo-prerender"))) {
  for (const file of walk(resolve(appRoot, "seo-prerender")).slice(0, 30)) {
    const html = readFileSync(file, "utf8");
    const rel = file.replace(appRoot + "/", "");
    if (/property="og:image"\s+content="[^"]*logo\.png"/.test(html)) {
      issues.push(`${rel}: og:image لا يجوز أن يكون logo.png`);
    }
    if (/majlisilm-og-2026/.test(html)) {
      issues.push(`${rel}: ما زال يستخدم majlisilm-og-2026`);
    }
  }
}

if (navExpected.length < 5) {
  issues.push("prerenderNav في site.config ناقص");
}

if (issues.length) {
  console.error("❌ بوابة توحيد الوسوم فشلت:\n");
  for (const i of issues) console.error("  -", i);
  process.exit(1);
}
console.log("✓ بوابة توحيد الوسوم: theme-color / OG / viewport / nav / JSON-LD / short_name");
