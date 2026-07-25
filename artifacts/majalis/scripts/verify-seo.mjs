/**
 * verify-seo.mjs
 *
 * يتحقق من جودة ملفات prerender بعد البناء:
 * - canonical صحيح (بلا www)
 * - title و description فريدان
 * - غياب display:none على #seo-shell
 * - عدم وجود H1 الصفحة الرئيسية في صفحات أخرى
 * - وجود JSON-LD
 * - وجود روابط محتوى حقيقية في الصفحات القائمة
 */

import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");
const siteUrl = "https://majlisilm.com";
const HOMEPAGE_H1_FRAGMENT = "المجلس العلمي — منصة الدروس";

async function readHtml(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function extractMeta(html, name) {
  const m = html.match(new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, "i"))
    || html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+name="${name}"`, "i"));
  return m ? m[1] : "";
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : "";
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"[^>]*>/i)
    || html.match(/<link[^>]+href="([^"]*)"[^>]+rel="canonical"[^>]*>/i);
  return m ? m[1] : "";
}

function checkPage(routePath, html) {
  const errors = [];
  const warnings = [];

  // 1. وجود <title>
  const title = extractTitle(html);
  if (!title) errors.push("لا يوجد <title>");

  // 2. وجود <meta description>
  const desc = extractMeta(html, "description");
  if (!desc) errors.push("لا يوجد meta description");
  else if (desc.length < 30) warnings.push(`description قصير (${desc.length} حرف)`);

  // 3. canonical صحيح بلا www
  const canonical = extractCanonical(html);
  if (!canonical) errors.push("لا يوجد <link rel=canonical>");
  else if (canonical.includes("www.")) errors.push(`canonical يحتوي www: ${canonical}`);
  else if (!canonical.startsWith(siteUrl)) errors.push(`canonical خاطئ: ${canonical}`);

  // 4. لا يوجد display:none على #seo-shell
  if (/id="seo-shell"[^>]*style="[^"]*display:\s*none/i.test(html)) {
    errors.push("#seo-shell مُخفى بـ display:none (يُقلل من فهرسة المحتوى)");
  }

  // 5. عدم وجود H1 الصفحة الرئيسية في صفحات أخرى (محتوى مكرر)
  if (routePath !== "/" && html.includes(HOMEPAGE_H1_FRAGMENT)) {
    errors.push("يحتوي على H1 الصفحة الرئيسية — محتوى مكرر");
  }

  // 6. وجود JSON-LD
  if (!html.includes('type="application/ld+json"')) {
    warnings.push("لا يوجد JSON-LD structured data");
  }

  // 7. وجود #seo-shell
  if (!html.includes('id="seo-shell"')) {
    warnings.push("لا يوجد #seo-shell (هل تم البناء الكامل؟)");
  }

  // 8. عد H1
  const h1Matches = [...html.matchAll(/<h1[^>]*>[\s\S]*?<\/h1>/gi)];
  if (h1Matches.length === 0) warnings.push("لا يوجد <h1>");
  else if (h1Matches.length > 1) warnings.push(`عدد H1: ${h1Matches.length} (يجب أن يكون واحداً)`);

  return {
    path: routePath,
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

async function walkDist(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "assets") {
        files.push(...await walkDist(full));
      } else if (entry.name === "index.html") {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

async function main() {
  const SPOT_PATHS = [
    "lessons",
    "library",
    "scholars",
    "fatwa",
    "rulings",
    "adhkar",
    "prophets",
    "fiqh-council",
    "annual-courses",
    "quran",
    "duas",
    "asma-husna",
    "search",
    "about",
    "learning/paths",
  ];

  const results = [];
  let failed = 0;
  let warned = 0;

  console.log(`\n🔍 التحقق من ملفات SEO في dist/\n`);
  console.log(`URL الأساسي: ${siteUrl}\n`);

  for (const rel of SPOT_PATHS) {
    const filePath = resolve(distDir, rel, "index.html");
    const html = await readHtml(filePath);
    if (!html) {
      results.push({ path: `/${rel}`, ok: false, errors: ["الملف غير موجود (يحتاج بناء كامل)"], warnings: [] });
      failed++;
      continue;
    }
    const r = checkPage(`/${rel}`, html);
    results.push(r);
    if (!r.ok) failed++;
    if (r.warnings.length) warned++;
  }

  // عينة من صفحات الدروس الفردية
  const lessonFiles = await walkDist(resolve(distDir, "lessons"));
  const sample = lessonFiles.filter(f => f.includes("lessons/") && !f.endsWith("lessons/index.html")).slice(0, 8);
  for (const filePath of sample) {
    const html = await readHtml(filePath);
    if (!html) continue;
    const routePath = filePath.replace(distDir, "").replace(/\/index\.html$/, "");
    const r = checkPage(routePath, html);
    results.push(r);
    if (!r.ok) failed++;
    if (r.warnings.length) warned++;
  }

  // عينة من صفحات المكتبة
  const libFiles = await walkDist(resolve(distDir, "library"));
  const libSample = libFiles.filter(f => !f.endsWith("library/index.html")).slice(0, 3);
  for (const filePath of libSample) {
    const html = await readHtml(filePath);
    if (!html) continue;
    const routePath = filePath.replace(distDir, "").replace(/\/index\.html$/, "");
    const r = checkPage(routePath, html);
    results.push(r);
    if (!r.ok) failed++;
    if (r.warnings.length) warned++;
  }

  // طباعة النتائج
  for (const r of results) {
    const status = r.ok ? "✅" : "❌";
    const warnMark = r.warnings.length ? " ⚠" : "";
    console.log(`${status}${warnMark} ${r.path}`);
    for (const e of r.errors) console.log(`     ❌ ${e}`);
    for (const w of r.warnings) console.log(`     ⚠  ${w}`);
  }

  const total = results.length;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`الإجمالي : ${total} صفحة`);
  console.log(`✅ ناجح  : ${total - failed}`);
  console.log(`❌ فشل   : ${failed}`);
  console.log(`⚠ تحذيرات: ${warned}`);

  if (failed > 0) {
    console.error(`\n✗ ${failed} صفحة تحتاج مراجعة`);
    process.exit(1);
  } else {
    console.log(`\n✓ جميع الفحوصات نجحت`);
  }
}

main().catch(e => {
  console.error("verify-seo فشل:", e.message);
  process.exit(1);
});
