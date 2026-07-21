/**
 * test-seo.mjs — SEO Regression Test Suite
 *
 * يفحص ملفات seo-prerender/ ويتحقق من:
 *   1. وجود <title> وأنه غير فارغ وغير مكرر مع الرئيسية
 *   2. وجود <meta name="description"> وطولها المناسب (50-300)
 *   3. وجود <link rel="canonical"> صحيح
 *   4. وجود <h1> واحد ومحتوى نصي كافٍ
 *   5. توجيه robots صحيح (noindex للصفحات المعفاة)
 *   6. وجود JSON-LD لجميع الصفحات المفهرسة
 *   7. عدم تكرار محتوى الرئيسية في صفحات أخرى
 *   8. وجود og:title, og:description, og:url
 *
 * التشغيل: node scripts/test-seo.mjs
 * يخرج بـ exit code 1 إذا وُجدت مشكلة P0
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const prerenderDir = resolve(appRoot, "seo-prerender");
const seoConfigPath = resolve(appRoot, "src/lib/seo-routes.json");
const siteConfigPath = resolve(appRoot, "site.config.json");

const seoConfig = JSON.parse(await readFile(seoConfigPath, "utf8"));
const siteConfig = JSON.parse(await readFile(siteConfigPath, "utf8"));
const siteUrl = seoConfig.siteUrl;
const TITLE_SUFFIX = siteConfig.titleSuffix;
const SITE_NAME = siteConfig.siteName;

// ── مسارات يجب أن تكون noindex
const NOINDEX_PATHS = new Set(
  seoConfig.routes
    .filter((r) => r.robots && r.robots.includes("noindex"))
    .map((r) => r.path)
);

// ── خريطة path → title المتوقع، بمحاكاة pageTitle() في generate-seo.mjs
// (عناوين seo-routes.json عارية؛ اللاحقة "| المجلس العلمي" تُضاف برمجياً إلا
// إذا كان route.suffix === false). يكشف ملفات seo-prerender/ "المتجمدة" التي
// لم تُعَد توليدها بعد تعديل seo-routes.json (السبب الجذري لتجمّد H1 سابقاً).
function pageTitle(route) {
  const name = String(route.title || "").trim();
  if (route.suffix === false || !name) return name || SITE_NAME;
  if (name.endsWith(TITLE_SUFFIX)) return name;
  return `${name}${TITLE_SUFFIX}`;
}
const EXPECTED_TITLES = new Map(seoConfig.routes.map((r) => [r.path, pageTitle(r)]));

// ── قراءة الملفات
async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkDir(full));
    else if (entry.name === "index.html") files.push(full);
  }
  return files;
}

// ── استخراج من HTML
function extract(html, pattern) {
  const m = html.match(pattern);
  return m ? (m[1] ?? m[0]).trim() : null;
}

function extractAll(html, pattern) {
  return [...html.matchAll(pattern)].map((m) => (m[1] ?? m[0]).trim());
}

// ── فحص صفحة واحدة
function checkPage(relPath, html, homepageBody) {
  const issues = [];
  const warns = [];
  const path = "/" + relPath.replace(/\/index\.html$/, "").replace(/index\.html$/, "");
  const normalizedPath = path === "" ? "/" : path;
  const expectedCanonical = siteUrl + (normalizedPath === "/" ? "" : normalizedPath);

  // 1. Title
  const title = extract(html, /<title[^>]*>([^<]+)<\/title>/i);
  const expectedTitle = EXPECTED_TITLES.get(normalizedPath);
  if (expectedTitle && title !== expectedTitle) {
    issues.push(`❌ [P0] ملف seo-prerender/ متجمد — العنوان "${title}" لا يطابق seo-routes.json الحالي "${expectedTitle}" (شغّل node scripts/generate-seo.mjs)`);
  }
  if (!title) {
    issues.push("❌ [P0] لا يوجد <title>");
  } else if (title.length < 10) {
    issues.push(`❌ [P0] <title> قصير جداً: "${title}"`);
  } else if (title.length > 120) {
    warns.push(`⚠️ <title> طويل جداً (${title.length}): "${title.slice(0, 60)}..."`);
  }

  // 2. Meta Description
  const desc = extract(html, /<meta\s+name="description"\s+content="([^"]+)"/i)
             || extract(html, /<meta\s+content="([^"]+)"\s+name="description"/i);
  if (!desc) {
    issues.push("❌ [P0] لا توجد <meta name=\"description\">");
  } else if (desc.length < 50) {
    warns.push(`⚠️ meta description قصيرة جداً (${desc.length})`);
  } else if (desc.length > 320) {
    warns.push(`⚠️ meta description طويلة جداً (${desc.length})`);
  }

  // 3. Canonical
  const canonical = extract(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i)
                 || extract(html, /<link\s+href="([^"]+)"\s+rel="canonical"/i);
  if (!canonical) {
    issues.push("❌ [P0] لا توجد <link rel=\"canonical\">");
  } else if (canonical !== expectedCanonical && canonical !== expectedCanonical + "/") {
    warns.push(`⚠️ canonical مختلف: "${canonical}" ≠ "${expectedCanonical}"`);
  }

  // 4. H1
  const h1s = extractAll(html, /<h1[^>]*>([^<]+)<\/h1>/gi);
  if (h1s.length === 0) {
    warns.push("⚠️ لا يوجد <h1>");
  } else if (h1s.length > 1) {
    warns.push(`⚠️ أكثر من <h1> في الصفحة (${h1s.length})`);
  }
  // H1 يجب ألا يحمل اسم العلامة التجارية — هذا خاص بـ<title> فقط.
  // اكتُشف فعلياً في /courses وغيرها: ملف seo-prerender/ متجمد لم يُعَد توليده
  // فبقي H1 يحمل "... | المجلس العلمي" كاملاً بدل اسم الصفحة وحده.
  if (h1s.some((h) => h.includes("المجلس العلمي")) && normalizedPath !== "/") {
    issues.push(`❌ [P0] <h1> يحتوي اسم العلامة التجارية (يجب أن يكون في <title> فقط): "${h1s[0]}"`);
  }

  // 5. Robots
  const robotsMeta = extract(html, /<meta\s+name="robots"\s+content="([^"]+)"/i)
                  || extract(html, /<meta\s+content="([^"]+)"\s+name="robots"/i);
  if (NOINDEX_PATHS.has(normalizedPath)) {
    if (!robotsMeta || !robotsMeta.includes("noindex")) {
      issues.push(`❌ [P0] مسار محمي (${normalizedPath}) يجب أن يكون noindex، الحالي: "${robotsMeta}"`);
    }
  } else {
    if (robotsMeta && robotsMeta.includes("noindex")) {
      warns.push(`⚠️ صفحة عامة تحمل noindex: "${normalizedPath}"`);
    }
  }

  // 6. JSON-LD
  const jsonLdBlocks = extractAll(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (jsonLdBlocks.length === 0 && !NOINDEX_PATHS.has(normalizedPath)) {
    warns.push("⚠️ لا يوجد JSON-LD structured data");
  }
  // فحص صحة JSON-LD
  for (const block of jsonLdBlocks) {
    try { JSON.parse(block); } catch {
      issues.push("❌ [P0] JSON-LD غير صحيح (parse error)");
    }
  }

  // 7. OG tags
  const ogTitle = extract(html, /<meta\s+property="og:title"\s+content="([^"]+)"/i);
  const ogDesc  = extract(html, /<meta\s+property="og:description"\s+content="([^"]+)"/i);
  const ogUrl   = extract(html, /<meta\s+property="og:url"\s+content="([^"]+)"/i);
  if (!ogTitle) warns.push("⚠️ لا يوجد og:title");
  if (!ogDesc)  warns.push("⚠️ لا يوجد og:description");
  if (!ogUrl)   warns.push("⚠️ لا يوجد og:url");

  // 8. تكرار محتوى الرئيسية (فحص سريع — عنوان الرئيسية)
  if (normalizedPath !== "/" && homepageBody) {
    const homeTitle = extract(homepageBody, /<title[^>]*>([^<]+)<\/title>/i) || "";
    if (title && title === homeTitle && normalizedPath !== "/") {
      issues.push(`❌ [P0] عنوان الصفحة مطابق لعنوان الرئيسية: "${title}"`);
    }
  }

  // 9. محتوى نصي كافٍ في body
  const body = extract(html, /<body[^>]*>([\s\S]*?)<\/body>/i) ?? "";
  const textLength = body.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length;
  if (textLength < 80) {
    warns.push(`⚠️ محتوى نصي قليل جداً في الصفحة (${textLength} حرف)`);
  }

  return { path: normalizedPath, issues, warns, title: title ?? "", h1: h1s[0] ?? "" };
}

// ── التشغيل الرئيسي
let files;
try {
  files = await walkDir(prerenderDir);
} catch {
  console.error("❌ seo-prerender/ غير موجود — شغّل pnpm build أولاً");
  process.exit(1);
}

console.log(`\n🔍 فحص ${files.length} صفحة مُحددة مسبقاً...\n`);

// قراءة الرئيسية للمقارنة
const homepagePath = resolve(prerenderDir, "index.html");
let homepageHtml = "";
try { homepageHtml = await readFile(homepagePath, "utf8"); } catch { /* ok */ }

let totalIssues = 0;
let totalWarns = 0;
const results = [];

for (const file of files) {
  const relPath = relative(prerenderDir, file);
  const html = await readFile(file, "utf8");
  const result = checkPage(relPath, html, homepageHtml);
  results.push(result);
  totalIssues += result.issues.length;
  totalWarns += result.warns.length;
}

// ── تقرير المشكلات الحرجة
const failing = results.filter((r) => r.issues.length > 0);
if (failing.length > 0) {
  console.log("═══════════════════════════════════════");
  console.log("  ❌ مشكلات P0 (حرجة — تؤثر على الفهرسة)");
  console.log("═══════════════════════════════════════");
  for (const r of failing) {
    console.log(`\n📄 ${r.path}`);
    for (const issue of r.issues) {
      console.log(`   ${issue}`);
    }
  }
}

// ── تقرير التحذيرات
const withWarns = results.filter((r) => r.warns.length > 0 && r.issues.length === 0);
if (withWarns.length > 0) {
  console.log("\n═══════════════════════════════════════");
  console.log("  ⚠️  تحذيرات (غير حرجة)");
  console.log("═══════════════════════════════════════");
  for (const r of withWarns.slice(0, 20)) {
    console.log(`\n📄 ${r.path}`);
    for (const w of r.warns) {
      console.log(`   ${w}`);
    }
  }
  if (withWarns.length > 20) {
    console.log(`\n   ... و ${withWarns.length - 20} صفحة أخرى بتحذيرات`);
  }
}

// ── فحص توحيد النطاق: index.html (جذر Vite، خارج seo-prerender لأن
// prerender.mjs يتخطّى "/" عمدًا) وpublic/ يجب ألا يحملا نطاقًا مخالفًا لـsiteUrl.
// اكتُشف فعليًا: index.html كان يحمل canonical/og:url/JSON-LD بالنطاق المجرّد
// (majlisilm.com) بينما siteUrl الحقيقي www.majlisilm.com — كل زاحف يقرأ HTML
// الرئيسية الخام (بلا JS) كان يرى canonical مخالفًا لما تعلنه بقية الموقع.
{
  const wrongDomainIssues = [];
  const bareDomain = new URL(siteUrl).hostname.replace(/^www\./, "");
  const wrongDomainPattern = new RegExp(`https?://(?!www\\.)${bareDomain.replace(/\./g, "\\.")}\\b`, "g");

  const rootIndexPath = resolve(appRoot, "index.html");
  const rootIndexHtml = await readFile(rootIndexPath, "utf8");
  const rootMatches = rootIndexHtml.match(wrongDomainPattern);
  if (rootMatches) {
    wrongDomainIssues.push(`❌ [P0] index.html (جذر Vite) يحتوي ${rootMatches.length} رابطًا بالنطاق المجرّد بدل ${siteUrl}`);
  }

  async function scanPublicForWrongDomain(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) { await scanPublicForWrongDomain(full); continue; }
      if (!entry.name.endsWith(".html") && !entry.name.endsWith(".xml")) continue;
      const content = await readFile(full, "utf8");
      if (wrongDomainPattern.test(content)) {
        wrongDomainIssues.push(`❌ [P0] ${relative(appRoot, full)} يحتوي رابطًا بالنطاق المجرّد بدل ${siteUrl}`);
      }
      wrongDomainPattern.lastIndex = 0;
    }
  }
  await scanPublicForWrongDomain(resolve(appRoot, "public"));

  if (wrongDomainIssues.length > 0) {
    console.log("\n═══════════════════════════════════════");
    console.log("  ❌ توحيد النطاق");
    console.log("═══════════════════════════════════════");
    for (const issue of wrongDomainIssues) console.log(`   ${issue}`);
    totalIssues += wrongDomainIssues.length;
  }
}

// ── ملخص
console.log("\n═══════════════════════════════════════");
console.log("  📊 ملخص فحص SEO");
console.log("═══════════════════════════════════════");
console.log(`   الصفحات المفحوصة:  ${files.length}`);
console.log(`   مشكلات P0:         ${totalIssues > 0 ? "❌ " : "✓ "}${totalIssues}`);
console.log(`   تحذيرات:           ${totalWarns}`);
console.log(`   صفحات بلا مشكلة:  ${results.filter((r) => r.issues.length === 0 && r.warns.length === 0).length}`);
console.log("");

if (totalIssues > 0) {
  console.log("❌ يوجد مشكلات SEO حرجة — راجع التقرير أعلاه\n");
  process.exit(1);
} else {
  console.log("✅ جميع الصفحات اجتازت فحص SEO الحرج\n");
  process.exit(0);
}
