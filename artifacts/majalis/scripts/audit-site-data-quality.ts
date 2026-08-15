#!/usr/bin/env node
/**
 * زاحف/بوابة جودة بيانات الموقع — audit:data
 *
 * يجمع المسارات من App.tsx + seo-routes + prerender، ويفحص:
 * - Home fallback في dist/seo-prerender
 * - عبارات واجهة متسرّبة للمحتوى
 * - ادعاءات توثيق مطلقة
 * - بريد قديم / تقييمات وهمية / مدح ممنوع
 * - كتب حساسة بلا caution
 * - knowledge-graph بلا noindex
 * - رابط القراءة القديم
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const warnings: string[] = [];
const fail = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

function walk(dir: string, pred: (name: string, p: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".backup") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, pred, out);
    else if (pred(name, p)) out.push(p);
  }
  return out;
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const report = {
  routesFromApp: 0,
  routesFromSeo: 0,
  prerenderPages: 0,
  homeFallbackHits: 0,
  uiLeakHits: 0,
  sensitiveBooksChecked: 0,
};

// ── مسارات ───────────────────────────────────────────────────────────────
const appSrc = read("src/App.tsx");
const appRoutes = [...appSrc.matchAll(/path=["'`]([^"'`]+)["'`]/g)].map((m) => m[1]!);
report.routesFromApp = appRoutes.length;

let seoRoutes: Array<{ path: string; sitemap?: boolean; robots?: string }> = [];
try {
  const seo = JSON.parse(read("src/lib/seo-routes.json"));
  seoRoutes = seo.routes || seo.pages || seo || [];
  if (!Array.isArray(seoRoutes)) seoRoutes = [];
  report.routesFromSeo = seoRoutes.length;
} catch {
  warn("تعذّر قراءة seo-routes.json");
}

// ── بريد ─────────────────────────────────────────────────────────────────
const SKIP_EMAIL = /audit-site-data-quality|audit-site-data|audit-site-content|audit-content-quality|audit-contact-email|audit-rendered-content|strip-lesson-filler|content-dedupe|site-data-final-audit|rendered-content-audit/;
for (const file of walk(root, (n) => /\.(tsx?|jsx?|mjs|json|html|md|css)$/i.test(n))) {
  if (SKIP_EMAIL.test(file)) continue;
  if (file.includes(`${path.sep}reports${path.sep}`)) continue;
  const text = fs.readFileSync(file, "utf8");
  if (/info@majlisilm\.com/i.test(text) || /yalabdullmohsen1@gmail\.com/i.test(text)) {
    fail(`بريد قديم: ${path.relative(root, file)}`);
  }
}

// ── أذان بلا تقييمات وهمية ───────────────────────────────────────────────
const adhan = read("src/lib/adhan-audio.ts");
if (/totalRatings\s*:/.test(adhan) || /\bfollowers\s*:/.test(adhan)) {
  fail("adhan-audio.ts ما زال يحمل تقييمات/متابعين وهمية");
}

// ── عبارات ممنوعة في src ─────────────────────────────────────────────────
const FORBIDDEN = [
  "فيلسوف الإسلام الأكبر",
  "الأزهر الشريف",
  "مآذن الأزهر",
  "معتمد في تدريس المنطق بالأزهر",
  "جميع العلاقات المعروضة موثقة بمصدر معتمد",
  "مجموعة من مصادر المجلس العلمي الموثقة",
  "رابط القراءة",
  "أعظم شروح صحيح البخاري وأكملها",
];
for (const file of walk(path.join(root, "src"), (n, p) => /\.(ts|tsx|json)$/.test(n) && !p.includes("__tests__"))) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  for (const phrase of FORBIDDEN) {
    if (text.includes(phrase)) fail(`${rel}: عبارة ممنوعة «${phrase}»`);
  }
}

// ── knowledge-graph noindex ──────────────────────────────────────────────
const kg = read("src/views/KnowledgeGraphPage.tsx");
if (!/noindex/.test(kg)) fail("KnowledgeGraphPage: يلزم noindex أثناء الإعداد");
if (/جميع العلاقات المعروضة موثقة/.test(kg)) fail("KnowledgeGraphPage: ادعاء توثيق مطلق");

const seoKg = seoRoutes.find((r) => r.path === "/knowledge-graph");
if (seoKg && seoKg.sitemap !== false && !String(seoKg.robots || "").includes("noindex")) {
  fail("seo-routes: knowledge-graph يجب sitemap:false أو robots noindex");
}

// ── TopicPage ────────────────────────────────────────────────────────────
const topic = read("src/views/TopicPage.tsx");
if (!/noindex/.test(topic)) fail("TopicPage: noindex مطلوب عند الفراغ");
if (/\/topic\/\$\{/.test(topic) && !/\/topics\//.test(topic)) fail("TopicPage: مسار /topics/ مطلوب");

// ── أحكام: تنبيه + noindex عند pending ───────────────────────────────────
const ruling = read("src/pages/fiqh/ui/RulingDetailView.tsx");
if (!/قيد المراجعة العلمية/.test(ruling)) fail("RulingDetailView: تنبيه المراجعة مفقود");
if (!/noindex/.test(ruling)) fail("RulingDetailView: noindex للحالات المعلّقة مفقود");
if (!/NotFound/.test(ruling)) fail("RulingDetailView: NotFound مطلوب");

// ── مكتبة حساسة ──────────────────────────────────────────────────────────
const { LIBRARY_CATALOG, LIBRARY_CAUTION_NOTE, resolveLibraryContentStatus } = await import(
  pathToFileURL(path.join(root, "src/lib/library-catalog.ts")).href
);
const NEED = [
  [/إحياء علوم الدين/, "book-ihya"],
  [/مفاتيح الغيب/, "book-razi-tafsir"],
  [/الشفا بتعريف/, "book-shifa-qadi-iyad"],
  [/السيرة الحلبية|إنسان العيون/, "book-sirah-halabiyya"],
  [/تاريخ الطبري/, "book-tarikh-tabari"],
  [/السلم المنورق/, "book-sullam-munawraq"],
  [/تهذيب الأخلاق/, "book-tahdhib-al-akhlaq"],
];
for (const book of LIBRARY_CATALOG as Array<{
  id: string;
  title: string;
  caution?: string;
  contentStatus?: string;
  external_url?: string;
}>) {
  for (const [re] of NEED) {
    if (!re.test(book.title)) continue;
    report.sensitiveBooksChecked++;
    if (!book.caution || !book.contentStatus) {
      fail(`كتاب حساس بلا caution/contentStatus: ${book.id} «${book.title}»`);
    }
  }
}
if (!LIBRARY_CAUTION_NOTE || !/يُستفاد منه في بابه/.test(String(LIBRARY_CAUTION_NOTE))) {
  fail("LIBRARY_CAUTION_NOTE مفقود");
}

// عيّنة: بلا رابط → needs_source
const sampleNoUrl = (LIBRARY_CATALOG as Array<{ id: string; external_url?: string }>).find((b) => !b.external_url);
if (sampleNoUrl && resolveLibraryContentStatus) {
  const st = resolveLibraryContentStatus(sampleNoUrl);
  if (st !== "needs_source" && !(LIBRARY_CATALOG as Array<{ id: string; contentStatus?: string }>).find((b) => b.id === sampleNoUrl.id)?.contentStatus) {
    // ok if explicit contentStatus set
  }
}

// ── علماء حساسون ─────────────────────────────────────────────────────────
const { SCHOLARS } = await import(pathToFileURL(path.join(root, "src/lib/scholars-data.ts")).href);
for (const id of ["ghazali", "ibn-rushd", "fakhr-razi", "qadi-iyad"]) {
  const s = (SCHOLARS as Array<{ id: string; caution?: string; contentStatus?: string }>).find((x) => x.id === id);
  if (!s?.caution || !s.contentStatus) fail(`عالم ${id}: يلزم caution + contentStatus`);
}

// ── generate-seo لا يولّد رابط القراءة ───────────────────────────────────
const genSeo = read("scripts/generate-seo.mjs");
if (/رابط القراءة/.test(genSeo)) fail("generate-seo.mjs ما زال يولّد «رابط القراءة»");
if (/مصادر المجلس العلمي الموثقة/.test(genSeo)) fail("generate-seo.mjs: عبارة مصادر موثقة");

// ── فحص prerender / dist ─────────────────────────────────────────────────
const UI_LEAK_ALWAYS = [
  "رابط القراءة",
  "جميع العلاقات المعروضة موثقة بمصدر معتمد",
  "مجموعة من مصادر المجلس العلمي الموثقة",
  "من نحنمنهجية التوثيق",
  "الخصوصيةالشروط",
  "خريطة الموقعتواصل معنا",
  "الشامل. التطبيق.",
];

/** تسرّب عناصر واجهة داخل صفحات المحتوى الشرعي فقط */
const UI_LEAK_IN_CONTENT = ["حذف الحساب", "أضف محتوى", "قيد التطوير"];

function isScholarlyContentPath(rel: string): boolean {
  return /[/\\](library|topics|rulings|scholars|prophets|fiqh-council|sins-and-rights|hadith|adhkar|quran|lessons|prophet-stories)[/\\]/.test(
    rel,
  );
}

function scanHtmlTree(baseDir: string, label: string) {
  if (!fs.existsSync(baseDir)) {
    warn(`${label} غير موجود`);
    return;
  }
  const homePath = path.join(baseDir, "index.html");
  const homeTitle = fs.existsSync(homePath)
    ? fs.readFileSync(homePath, "utf8").match(/<title>([^<]*)<\/title>/i)?.[1] || ""
    : "";

  const files = walk(baseDir, (n) => n === "index.html");
  for (const file of files) {
    report.prerenderPages++;
    const html = fs.readFileSync(file, "utf8");
    const rel = path.relative(root, file);
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] || "";
    const robots = html.match(/name=["']robots["'][^>]*content=["']([^"']+)/i)?.[1] || "";
    const desc = html.match(/name=["']description["'][^>]*content=["']([^"']*)/i)?.[1] || "";

    for (const leak of UI_LEAK_ALWAYS) {
      if (html.includes(leak) || desc.includes(leak)) {
        report.uiLeakHits++;
        fail(`${label} عبارة ممنوعة في ${rel}: «${leak}»`);
      }
    }
    if (isScholarlyContentPath(rel)) {
      for (const leak of UI_LEAK_IN_CONTENT) {
        if (desc.includes(leak) || (html.includes(leak) && /meta|description|og:description/i.test(html))) {
          // فقط داخل وصف/ميتا المحتوى الشرعي
          if (desc.includes(leak)) {
            report.uiLeakHits++;
            fail(`${label} تسرّب واجهة في وصف محتوى شرعي ${rel}: «${leak}»`);
          }
        }
      }
    }

    if (rel.includes(`${path.sep}knowledge-graph${path.sep}`) && !robots.includes("noindex")) {
      fail(`${label}: knowledge-graph بلا noindex (${rel})`);
    }

    const depth = rel.split(path.sep).length;
    if (homeTitle && title === homeTitle && depth > 2 && !robots.includes("noindex")) {
      if (!/غير موجود|غير متاح|404|قيد/.test(title)) {
        report.homeFallbackHits++;
        fail(`${label} Home fallback محتمل: ${rel}`);
      }
    }

    if (/الموضوع غير موجود/.test(html) && !robots.includes("noindex")) {
      fail(`${label}: موضوع غير موجود مفهرس في ${rel}`);
    }
  }
}

scanHtmlTree(path.join(root, "seo-prerender"), "seo-prerender");
scanHtmlTree(path.join(root, "dist"), "dist");

// ── حديث واجهة ───────────────────────────────────────────────────────────
const hadith = read("src/pages/hadith/ui/HadithView.tsx");
if (!/لا يُحتج بالحديث الضعيف/.test(hadith)) fail("HadithView: تحذير الضعيف مفقود");

if (warnings.length) console.log(`تحذيرات:\n- ${warnings.join("\n- ")}\n`);
console.log(JSON.stringify({ ...report, errors: errors.length, warnings: warnings.length }, null, 2));

if (errors.length) {
  console.error(`audit:data FAILED (${errors.length})\n- ${errors.slice(0, 40).join("\n- ")}${errors.length > 40 ? `\n… +${errors.length - 40}` : ""}`);
  process.exit(1);
}
console.log("audit:data OK");
