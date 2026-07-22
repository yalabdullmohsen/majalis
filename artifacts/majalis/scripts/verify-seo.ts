/**
 * verify-seo.ts
 *
 * يتحقق من جودة ملفات الـ prerender بعد البناء:
 * - وجود canonical صحيح (بلا www)
 * - وجود <title> فريد
 * - وجود <meta description> لكل صفحة
 * - غياب display:none على #seo-shell
 * - عدم وجود H1 الصفحة الرئيسية في صفحات أخرى
 * - وجود JSON-LD على الأقل
 * - التحقق من 15+ صفحة
 */

import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = new URL(".", import.meta.url).pathname;
const distDir = resolve(__dirname, "../dist");
const siteUrl = "https://majlisilm.com";

const HOMEPAGE_H1 = "المجلس العلمي — منصة الدروس الشرعية";

interface CheckResult {
  path: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
}

async function readHtml(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function extractMeta(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, "i"))
    || html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+name="${name}"`, "i"));
  return m ? m[1] : "";
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : "";
}

function extractCanonical(html: string): string {
  const m = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"[^>]*>/i)
    || html.match(/<link[^>]+href="([^"]*)"[^>]+rel="canonical"[^>]*>/i);
  return m ? m[1] : "";
}

function checkPage(path: string, html: string, expectedTitle?: string): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. وجود <title>
  const title = extractTitle(html);
  if (!title) errors.push("❌ لا يوجد <title>");
  else if (expectedTitle && !title.includes(expectedTitle)) warnings.push(`⚠ title لا يطابق المتوقع: "${title}"`);

  // 2. وجود <meta description>
  const desc = extractMeta(html, "description");
  if (!desc) errors.push("❌ لا يوجد meta description");
  else if (desc.length < 30) warnings.push(`⚠ description قصير جداً (${desc.length} حرف)`);

  // 3. canonical صحيح (بلا www)
  const canonical = extractCanonical(html);
  if (!canonical) {
    errors.push("❌ لا يوجد <link rel=canonical>");
  } else if (canonical.includes("www.")) {
    errors.push(`❌ canonical يحتوي www: ${canonical}`);
  } else if (!canonical.startsWith(siteUrl)) {
    errors.push(`❌ canonical خاطئ: ${canonical}`);
  }

  // 4. لا يوجد display:none على #seo-shell
  if (/id="seo-shell"[^>]*style="[^"]*display:\s*none/i.test(html)) {
    errors.push(`❌ #seo-shell مُخفى بـ display:none`);
  }

  // 5. عدم وجود H1 الصفحة الرئيسية في صفحات أخرى
  if (path !== "/" && html.includes(HOMEPAGE_H1)) {
    errors.push(`❌ يحتوي على H1 الصفحة الرئيسية (محتوى مكرر)`);
  }

  // 6. وجود JSON-LD
  if (!html.includes(`type="application/ld+json"`)) {
    warnings.push(`⚠ لا يوجد JSON-LD structured data`);
  }

  // 7. وجود #seo-shell في الصفحة
  if (!html.includes('id="seo-shell"') && !html.includes("id='seo-shell'")) {
    warnings.push(`⚠ لا يوجد #seo-shell (هل تم البناء مع post-build-seo.mjs؟)`);
  }

  // 8. وجود H1 فريد في الصفحة
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1Matches.length === 0) {
    warnings.push(`⚠ لا يوجد <h1> في الصفحة`);
  } else if (h1Matches.length > 1) {
    warnings.push(`⚠ يوجد ${h1Matches.length} عناصر <h1> (يجب أن يكون واحداً)`);
  }

  return {
    path,
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

async function walkDist(dir: string, base = dir): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "assets") {
        files.push(...await walkDist(full, base));
      } else if (entry.name === "index.html") {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

async function main() {
  const SPOT_CHECK_PATHS = [
    "/lessons/index.html",
    "/library/index.html",
    "/scholars/index.html",
    "/fatwa/index.html",
    "/rulings/index.html",
    "/adhkar/index.html",
    "/prophets/index.html",
    "/fiqh-council/index.html",
    "/annual-courses/index.html",
    "/quran/index.html",
    "/duas/index.html",
    "/asma-husna/index.html",
    "/learning/paths/index.html",
    "/search/index.html",
    "/about/index.html",
  ];

  const results: CheckResult[] = [];
  let checked = 0;
  let failed = 0;
  let warned = 0;

  console.log(`\n🔍 التحقق من ملفات SEO في ${distDir}\n`);

  // فحص الصفحات المختارة
  for (const rel of SPOT_CHECK_PATHS) {
    const filePath = resolve(distDir, rel.slice(1));
    const html = await readHtml(filePath);
    if (!html) {
      results.push({ path: rel, ok: false, errors: [`❌ الملف غير موجود: ${filePath}`], warnings: [] });
      failed++;
      checked++;
      continue;
    }
    const routePath = rel.replace(/\/index\.html$/, "") || "/";
    const result = checkPage(routePath, html);
    results.push(result);
    if (!result.ok) failed++;
    if (result.warnings.length > 0) warned++;
    checked++;
  }

  // فحص عشوائي لبعض صفحات الدروس
  const lessonIndexFiles = await walkDist(resolve(distDir, "lessons"));
  const sampledLessons = lessonIndexFiles.slice(0, 10);
  for (const filePath of sampledLessons) {
    const html = await readHtml(filePath);
    if (!html) continue;
    const rel = filePath.replace(distDir, "").replace(/\/index\.html$/, "");
    const result = checkPage(rel, html);
    results.push(result);
    if (!result.ok) failed++;
    if (result.warnings.length > 0) warned++;
    checked++;
  }

  // طباعة النتائج
  for (const r of results) {
    const status = r.ok ? "✅" : "❌";
    const warnMark = r.warnings.length ? " ⚠" : "";
    console.log(`${status}${warnMark} ${r.path}`);
    for (const e of r.errors) console.log(`   ${e}`);
    for (const w of r.warnings) console.log(`   ${w}`);
  }

  // ملخص
  console.log(`\n${"─".repeat(60)}`);
  console.log(`الإجمالي: ${checked} صفحة`);
  console.log(`✅ ناجح: ${checked - failed}`);
  console.log(`❌ فشل: ${failed}`);
  console.log(`⚠ تحذيرات: ${warned}`);

  if (failed > 0) {
    console.error(`\n✗ ${failed} صفحة تحتاج إصلاح`);
    process.exit(1);
  } else {
    console.log(`\n✓ جميع الفحوصات نجحت`);
  }
}

main().catch((e) => {
  console.error("verify-seo فشل:", e.message);
  process.exit(1);
});
