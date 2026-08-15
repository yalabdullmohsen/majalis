#!/usr/bin/env node
/**
 * تدقيق محتوى الموقع الكامل من sitemap + prerender + بوابات جودة.
 * يكتب: reports/full-site-final-content-audit.md
 * يفشل عند: homepage fallback، «المصدر: رابط القراءة»، ادعاءات توثيق بلا دليل، إلخ.
 *
 * تشغيل: node scripts/audit-full-site-content.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reportsDir = join(root, "reports");
mkdirSync(reportsDir, { recursive: true });

const failures = [];
const warnings = [];
const rows = [];

function fail(msg) {
  failures.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

const sitemapPath = join(root, "public", "sitemap.xml");
if (!existsSync(sitemapPath)) fail("public/sitemap.xml مفقود");
const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, "utf8") : "";
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const paths = locs.map((u) => {
  try {
    return new URL(u).pathname.replace(/\/$/, "") || "/";
  } catch {
    return u;
  }
});

const homePrerender = join(root, "seo-prerender/index.html");
const homeHtml = existsSync(homePrerender) ? readFileSync(homePrerender, "utf8") : "";
const homeTitle = homeHtml.match(/<title>([^<]*)<\/title>/i)?.[1] || "";
const homeH1 = homeHtml.match(/<h1[^>]*>([^<]*)<\/h1>/i)?.[1] || "";

function prerenderFile(pathname) {
  const rel = pathname === "/" ? "index.html" : `${pathname.replace(/^\//, "")}/index.html`;
  return join(root, "seo-prerender", rel);
}

function analyzePath(pathname) {
  const file = prerenderFile(pathname);
  const hasPrerender = existsSync(file);
  let html = "";
  let title = "";
  let h1 = "";
  let meta = "";
  let status = "ok";
  let homepageFallback = false;
  let placeholder = false;
  let trustClaim = false;
  let needsEnrichment = false;

  if (!hasPrerender) {
    status = "missing_prerender";
    needsEnrichment = true;
    // Critical public hubs must have prerender
    if (
      pathname === "/nations" ||
      pathname.startsWith("/nations/") ||
      pathname === "/quran/people" ||
      pathname.startsWith("/quran/people/")
    ) {
      fail(`${pathname}: بلا prerender (homepage fallback للزواحف)`);
      homepageFallback = true;
      status = "homepage_fallback_risk";
    }
  } else {
    html = readFileSync(file, "utf8");
    title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || "";
    h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
    meta =
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] ||
      html.match(/content=["']([^"']*)["']\s+name=["']description["']/i)?.[1] ||
      "";

    if (
      pathname !== "/" &&
      homeTitle &&
      title === homeTitle &&
      (!h1 || h1 === homeH1)
    ) {
      homepageFallback = true;
      status = "homepage_fallback";
      fail(`${pathname}: title/h1 يطابقان الرئيسية (homepage fallback)`);
    }

    if (/المصدر:\s*<a[^>]*>\s*رابط القراءة\s*<\/a>/i.test(html) || /المصدر:\s*رابط القراءة/i.test(html)) {
      fail(`${pathname}: يظهر «المصدر: رابط القراءة»`);
      status = "bad_library_source";
    }

    if (/موث[ّ]?قة بالأدلة/i.test(html) && pathname.startsWith("/fiqh")) {
      // hub claim without per-item evidence gate in HTML
      fail(`${pathname}: ادّعاء «موثقة بالأدلة» على صفحة فقه عامة`);
      trustClaim = true;
    }

    if (pathname === "/methodology") {
      if (/منهجيتنا\s+قيد المراجعة|المنهج(?:ية)?\s+كله[ا]?\s+قيد المراجعة|المنهج(?:ية)?\s+غير معتمد(?!\.)/u.test(html.replace(/\s+/g, " "))) {
        // السماح بنفي صريح مثل «لا يعني أن المنهج كله غير معتمد»
        if (!/لا يعني ذلك أن المنهج كله غير معتمد/.test(html)) {
          fail("/methodology: صياغة توحي أن المنهج كله قيد المراجعة");
        }
      }
      if (/قيد المراجعة الشرعية/.test(meta || "")) {
        fail("/methodology: meta description تستخدم قيد المراجعة كوصف عام");
      }
    }

    if (/قيد الإثراء|قيد الإضافة|source_pending|جاري الربط/i.test(html)) {
      needsEnrichment = true;
      if (/مكتمل(?:ة)?\s*التوثيق|موث[ّ]?ق(?:ة)?\s*بالكامل/i.test(html)) {
        fail(`${pathname}: صفحة partial تدّعي الكمال`);
      }
    }

    if (/TODO|lorem ipsum|placeholder|قيد الإنشاء قريبًا/i.test(html)) {
      placeholder = true;
      status = status === "ok" ? "placeholder" : status;
    }

    if (/موث[ّ]?ق|معتمد|موثوقة/.test(html)) trustClaim = true;
  }

  rows.push({
    path: pathname,
    status,
    title: title || "(لا prerender)",
    h1: h1 || "—",
    meta: meta || "—",
    homepageFallback,
    placeholder,
    trustClaim,
    needsEnrichment,
  });
}

for (const p of paths) analyzePath(p);

// Extra critical paths even if not yet in old sitemap snapshot
for (const extra of ["/nations", "/quran/people", "/quran/people/azar", "/methodology", "/fiqh", "/library/book-bukhari"]) {
  if (!paths.includes(extra)) analyzePath(extra);
}

// Data completeness gates
const peoplePath = join(root, "public/data/quran-people/people.json");
if (existsSync(peoplePath)) {
  const people = JSON.parse(readFileSync(peoplePath, "utf8"));
  const list = people.people || people;
  const azar = list.find((p) => p.slug === "azar");
  if (!azar) fail("people.json لا يحتوي آزر (azar)");
  const dhul = list.find((p) => p.slug === "dhul-kifl");
  if (!dhul?.cautionNote) fail("ذو الكفل بلا cautionNote");
  const harut = list.find((p) => p.slug === "harut");
  if (harut && /إسرائيل|هاروت.*قصة طويلة/i.test(JSON.stringify(harut))) {
    fail("هاروت يحتوي توسعًا إسرائيليًا محظورًا");
  }
} else {
  fail("people.json مفقود");
}

const libCat = readFileSync(join(root, "src/lib/library-catalog.ts"), "utf8");
if (/رابط القراءة/.test(libCat) && /المصدر:.*رابط/.test(libCat)) {
  fail("library-catalog.ts ما زال يخلط المصدر برابط القراءة");
}
if (!/sourceStatus/.test(libCat)) fail("library-catalog.ts بلا sourceStatus");

const fiqhHub = readFileSync(join(root, "src/lib/fiqh-hub-topics.ts"), "utf8");
if (/موثّقة بالأدلة/.test(fiqhHub)) fail("fiqh-hub-topics ما زال يقول موثّقة بالأدلة");

const genSeo = readFileSync(join(root, "scripts/generate-seo.mjs"), "utf8");
if (/المصدر: <a[^>]*>رابط القراءة<\/a>/.test(genSeo)) {
  fail("generate-seo.mjs ما زال يولّد المصدر: رابط القراءة");
}

const seoRoutes = readFileSync(join(root, "src/lib/seo-routes.json"), "utf8");
if (!/"path"\s*:\s*"\/nations"/.test(seoRoutes)) fail("seo-routes بلا /nations");
if (!/"path"\s*:\s*"\/quran\/people"/.test(seoRoutes)) fail("seo-routes بلا /quran/people");

// Report markdown
const md = [];
md.push("# تدقيق محتوى الموقع الكامل — Majlisilm");
md.push("");
md.push(`تاريخ: ${new Date().toISOString().slice(0, 10)}`);
md.push(`عدد روابط sitemap: **${paths.length}**`);
md.push(`إخفاقات: **${failures.length}** · تحذيرات: **${warnings.length}**`);
md.push("");
md.push("## معايير الفشل");
md.push("- homepage fallback / title يطابق الرئيسية");
md.push("- «المصدر: رابط القراءة»");
md.push("- ادعاء «موثقة بالأدلة» على فقه عام بلا evidence");
md.push("- methodology كمنهج قيد مراجعة عام");
md.push("- آزر / cautionNote لذي الكفل");
md.push("");
if (failures.length) {
  md.push("## إخفاقات");
  for (const f of failures) md.push(`- ${f}`);
  md.push("");
}
md.push("## عيّنة المسارات (كل روابط sitemap)");
md.push("");
md.push("| path | status | title | homepageFallback | needsEnrichment |");
md.push("|---|---|---|---|---|");
for (const r of rows.slice(0, 900)) {
  md.push(
    `| ${r.path} | ${r.status} | ${String(r.title).replace(/\|/g, "/").slice(0, 60)} | ${r.homepageFallback} | ${r.needsEnrichment} |`,
  );
}
md.push("");
md.push("## ملاحظات");
md.push("- الصفحات ذات `source_pending` يجب ألا تُعرض كمصدر موثوق.");
md.push("- الأمم والذين في القرآن يجب أن تكون في sitemap بعد `generate:seo`.");
md.push("");

const out = join(reportsDir, "full-site-final-content-audit.md");
writeFileSync(out, md.join("\n"), "utf8");
console.log(`كتب التقرير: ${out}`);
console.log(`sitemap URLs: ${paths.length}`);
console.log(`failures: ${failures.length}`);

if (failures.length) {
  console.error("\n❌ audit:full-site-data فشل:");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}
console.log("✓ audit:full-site-data ok");
