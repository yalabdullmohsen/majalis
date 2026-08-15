#!/usr/bin/env node
/**
 * تدقيق النص المعروض والمفهرس — audit:rendered-content
 * يفحص HTML النهائي (seo-prerender + dist) وليس البيانات الخام وحدها.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const warnings: string[] = [];
const fail = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const FIELD_STICK_RE =
  /(القوم \/ البلد|الحقبة|الذِّكر في القرآن|أبرز سورة|مواضع في القرآن|(?<![\u0600-\u06FF])المؤلف(?!ات)|(?<![\u0600-\u06FF])التصنيف(?!ات)|(?<![\u0600-\u06FF])المصدر)(?=[\u0621-\u064A0-9\u0660-\u0669])/gu;

const UI_LEAK = [
  "اختصارات",
  "Esc للقائمة",
  "← التالي",
  "→ السابق",
  "نسخ النص",
  "واتساب",
  "سناب شات",
  "اختبر معلوماتك",
  "قيّم هذا",
  "قيّم",
  "\u25BD", // ▽
];

const BANNED_PUBLISHED = [
  "undefined",
  "null",
  "NaN",
  "TODO",
  "placeholder",
  "lorem",
  "قيد الإعداد",
  "قيد المراجعة الشرعية",
];

const INCOMPLETE_MARKERS = [
  "قيد المراجعة الشرعية",
  "قيد الإعداد",
  "محتوى ناقص",
  "رابط القراءة",
  "الموضوع غير موجود",
];

const SCHOLARLY_PATH =
  /[/\\](prophets|library|scholars|rulings|topics|fiqh-council|sins-and-rights|hadith|adhkar|quran|lessons|prophet-stories)[/\\]/i;

type PageHit = {
  path: string;
  file: string;
  title: string;
  description: string;
  robots: string;
  mainText: string;
  articleText: string;
  jsonLdText: string;
  breadcrumbText: string;
  rawArticle: string;
  stickHits: string[];
  uiHits: string[];
  bannedHits: string[];
};

const summary = {
  routesFromSitemap: 0,
  routesFromApp: 0,
  pagesScanned: 0,
  stickFailures: 0,
  uiLeakFailures: 0,
  bannedFailures: 0,
  incompleteWithoutNoindex: 0,
};

function walk(dir: string, pred: (name: string, p: string) => boolean, out: string[] = []): string[] {
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

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ");
}

/** إزالة الوسوم دون إدخال مسافات — يكشف التصاق الحقول كما يراه زاحف ساذج */
function stripTagsTight(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, "");
}

function extractBlock(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  return m?.[1] || "";
}

function metaContent(html: string, name: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`,
    "i",
  );
  const m = html.match(re);
  return (m?.[1] || m?.[2] || "").trim();
}

function robotsOf(html: string): string {
  return metaContent(html, "robots").toLowerCase();
}

function collectSitemapPaths(): string[] {
  const files = ["public/sitemap.xml", "dist/sitemap.xml", "seo-prerender/sitemap.xml"];
  const paths = new Set<string>();
  for (const rel of files) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) continue;
    const xml = fs.readFileSync(p, "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      try {
        const u = new URL(m[1]!);
        paths.add(u.pathname.replace(/\/$/, "") || "/");
      } catch {
        /* ignore */
      }
    }
  }
  summary.routesFromSitemap = paths.size;
  return [...paths];
}

function collectAppRoutes(): string[] {
  const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
  const routes = [...app.matchAll(/path=["'`]([^"'`]+)["'`]/g)].map((m) => m[1]!);
  summary.routesFromApp = routes.length;
  return routes;
}

function isNoindex(robots: string): boolean {
  return /\bnoindex\b/i.test(robots);
}

function scanHtmlFile(file: string, label: string): PageHit | null {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  const urlPath = ("/" + rel.replace(/^(seo-prerender|dist)[/\\]/, "").replace(/[/\\]index\.html$/, "").replace(/\\/g, "/")).replace(
    /\/$/,
    "",
  ) || "/";

  const title = (html.match(/<title>([^<]*)<\/title>/i)?.[1] || "").trim();
  const description = metaContent(html, "description");
  const robots = robotsOf(html);
  const mainRaw = extractBlock(html, "main");
  const articleRaw = extractBlock(html, "article");
  const mainText = stripTags(mainRaw);
  const articleText = stripTags(articleRaw);
  const jsonLdChunks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1] || "",
  );
  const jsonLdText = jsonLdChunks.join("\n");
  const breadcrumbText = jsonLdChunks.filter((j) => /BreadcrumbList/i.test(j)).join("\n");

  const indexedSurfaces = [description, articleText, jsonLdText, stripTagsTight(articleRaw)].join("\n");
  const scholarly = SCHOLARLY_PATH.test(rel) || SCHOLARLY_PATH.test(urlPath);

  const stickHits: string[] = [];
  // فحص الالتصاق على: (1) نص المقالة بعد إزالة الوسوم مع الإبقاء على الفواصل
  // (2) كتل <dl> بعد ضغط المسافات — يكشف dt+dd بلا فاصل حقيقي (مثل :)
  const articleLoose = stripTags(articleRaw || mainRaw);
  FIELD_STICK_RE.lastIndex = 0;
  let mStick: RegExpExecArray | null;
  while ((mStick = FIELD_STICK_RE.exec(articleLoose))) {
    stickHits.push(articleLoose.slice(Math.max(0, mStick.index - 2), mStick.index + mStick[0].length + 18));
  }
  for (const dl of (articleRaw || mainRaw).matchAll(/<dl[\s\S]*?<\/dl>/gi)) {
    const tight = stripTagsTight(dl[0] || "");
    FIELD_STICK_RE.lastIndex = 0;
    let m2: RegExpExecArray | null;
    while ((m2 = FIELD_STICK_RE.exec(tight))) {
      stickHits.push(tight.slice(Math.max(0, m2.index - 2), m2.index + m2[0].length + 18));
    }
  }
  const descTight = description.replace(/\s+/g, "");
  FIELD_STICK_RE.lastIndex = 0;
  while ((mStick = FIELD_STICK_RE.exec(descTight))) {
    const label = mStick[1] || "";
    if (/^(القوم \/ البلد|الحقبة|الذِّكر في القرآن|أبرز سورة|مواضع في القرآن)$/.test(label)) {
      stickHits.push(descTight.slice(Math.max(0, mStick.index), mStick.index + 28));
    }
  }

  const uiHits: string[] = [];
  const uiScan = scholarly
    ? [description, articleText, jsonLdText].join("\n")
    : [description, jsonLdText].join("\n");
  const skipUiPath = /\/(quiz|cards|login|account)\b/.test(urlPath);
  if (!skipUiPath) {
    for (const phrase of UI_LEAK) {
      if (phrase === "قيّم" && !/قيّم/.test(uiScan)) continue;
      if (phrase === "اختبر معلوماتك" && !scholarly) continue;
      if (uiScan.includes(phrase)) uiHits.push(phrase);
    }
  }
  // لا تفشل على «قيّم» داخل كلمات أخرى بلا سياق تقييم
  const filteredUi = uiHits.filter((p) => p !== "قيّم" || /قيّم\s|قيّم هذا|للتقييم/.test(uiScan));

  const bannedHits: string[] = [];
  const publishedScan = [title, description, articleText, jsonLdText].join("\n");
  const skipBannedPath = /[/\\](methodology|admin|learning-paths|discover-islam)[/\\]/i.test(rel) || /\/(methodology|admin)\b/.test(urlPath);
  if (!isNoindex(robots) && !skipBannedPath) {
    for (const b of BANNED_PUBLISHED) {
      if (b === "null" || b === "undefined" || b === "NaN" || b === "TODO" || b === "placeholder" || b === "lorem") {
        const re = new RegExp(`\\b${b}\\b`, "i");
        if (re.test(publishedScan)) bannedHits.push(b);
      } else if (scholarly || /prophets|library|scholars|rulings|topics|sins-and-rights|knowledge-graph/.test(urlPath)) {
        if (publishedScan.includes(b)) bannedHits.push(b);
      }
    }
  }

  for (const marker of INCOMPLETE_MARKERS) {
    if (skipBannedPath) continue;
    const inIndexedSurface = [description, articleText, jsonLdText].join("\n").includes(marker);
    if (inIndexedSurface && !isNoindex(robots)) {
      summary.incompleteWithoutNoindex++;
      fail(`${label} ${urlPath}: «${marker}» بلا noindex (${rel})`);
    }
  }

  if (stickHits.length) {
    summary.stickFailures += stickHits.length;
    for (const s of stickHits.slice(0, 5)) {
      fail(`${label} ${urlPath}: التصاق حقول «${s}» (${rel})`);
    }
  }
  if (filteredUi.length) {
    summary.uiLeakFailures += filteredUi.length;
    fail(`${label} ${urlPath}: تسرّب واجهة في محتوى مفهرس: ${filteredUi.join(" · ")} (${rel})`);
  }
  if (bannedHits.length) {
    summary.bannedFailures += bannedHits.length;
    fail(`${label} ${urlPath}: عبارة ممنوعة في صفحة مفهرسة: ${bannedHits.join(" · ")} (${rel})`);
  }

  // اختصارات لوحة المفاتيح داخل <article>
  if (/اختصارات|Esc للقائمة|← التالي|→ السابق/.test(articleText)) {
    fail(`${label} ${urlPath}: اختصارات/تنقل داخل <article> (${rel})`);
  }

  return {
    path: urlPath,
    file: rel,
    title,
    description,
    robots,
    mainText: mainText.slice(0, 400),
    articleText: articleText.slice(0, 400),
    jsonLdText: jsonLdText.slice(0, 300),
    breadcrumbText: breadcrumbText.slice(0, 200),
    rawArticle: articleRaw.slice(0, 200),
    stickHits,
    uiHits: filteredUi,
    bannedHits,
  };
}

function scanTree(dirName: string): PageHit[] {
  const dir = path.join(root, dirName);
  if (!fs.existsSync(dir)) {
    warn(`${dirName} غير موجود — شغّل البناء إن لزم`);
    return [];
  }
  const files = walk(dir, (n) => n === "index.html");
  const hits: PageHit[] = [];
  for (const file of files) {
    summary.pagesScanned++;
    const hit = scanHtmlFile(file, dirName);
    if (hit) hits.push(hit);
  }
  return hits;
}

// React source: اختصارات داخل article في صفحات الأنبياء
const prophetSrc = fs.readFileSync(path.join(root, "src/views/ProphetStoriesPage.tsx"), "utf8");
if (/<article[\s\S]*اختصارات[\s\S]*<\/article>/.test(prophetSrc) || /<article[\s\S]*Esc للقائمة/.test(prophetSrc)) {
  fail("ProphetStoriesPage: اختصارات داخل <article>");
}
if (!/aria-label=["']تنقل قصص الأنبياء["']/.test(prophetSrc)) {
  fail("ProphetStoriesPage: يلزم nav aria-label=\"تنقل قصص الأنبياء\"");
}
if (!/<dl[\s\S]*prophet-facts-grid[\s\S]*<\/dl>/.test(prophetSrc) && !/<dl className="prophet-facts-grid"/.test(prophetSrc)) {
  fail("ProphetStoriesPage: يلزم <dl> لبطاقات الحقائق");
}

collectSitemapPaths();
collectAppRoutes();

const prerenderHits = scanTree("seo-prerender");
const distHits = scanTree("dist");

const reportLines: string[] = [
  "# تقرير تدقيق المحتوى المعروض (rendered-content)",
  "",
  `تاريخ: ${new Date().toISOString()}`,
  "",
  "## ملخص",
  "",
  `- مسارات sitemap: ${summary.routesFromSitemap}`,
  `- مسارات App: ${summary.routesFromApp}`,
  `- صفحات مفحوصة: ${summary.pagesScanned}`,
  `- التصاق حقول: ${summary.stickFailures}`,
  `- تسرّب واجهة: ${summary.uiLeakFailures}`,
  `- عبارات ممنوعة في صفحات مفهرسة: ${summary.bannedFailures}`,
  `- ناقص بلا noindex: ${summary.incompleteWithoutNoindex}`,
  `- أخطاء: ${errors.length}`,
  `- تحذيرات: ${warnings.length}`,
  "",
];

if (warnings.length) {
  reportLines.push("## تحذيرات", "", ...warnings.map((w) => `- ${w}`), "");
}

if (errors.length) {
  reportLines.push("## أخطاء", "", ...errors.slice(0, 200).map((e) => `- ${e}`), "");
  if (errors.length > 200) reportLines.push(`- … و${errors.length - 200} أخرى`, "");
}

const sample = [...prerenderHits, ...distHits]
  .filter((h) => h.path.startsWith("/prophets/"))
  .slice(0, 8);
reportLines.push("## عيّنة صفحات الأنبياء", "");
for (const h of sample) {
  reportLines.push(
    `### ${h.path}`,
    `- title: ${h.title}`,
    `- robots: ${h.robots || "(افتراضي)"}`,
    `- description: ${h.description.slice(0, 160)}`,
    `- stick: ${h.stickHits.length ? h.stickHits.join(" | ") : "لا"}`,
    "",
  );
}

const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });
const reportPath = path.join(reportsDir, "rendered-content-audit.md");
fs.writeFileSync(reportPath, reportLines.join("\n"), "utf8");

console.log(JSON.stringify({ ...summary, errors: errors.length, warnings: warnings.length, report: path.relative(root, reportPath) }, null, 2));

if (errors.length) {
  console.error(`audit:rendered-content FAILED (${errors.length})\n- ${errors.slice(0, 40).join("\n- ")}${errors.length > 40 ? `\n… +${errors.length - 40}` : ""}`);
  process.exit(1);
}
console.log("audit:rendered-content OK");
console.log(`📄 ${path.relative(root, reportPath)}`);
