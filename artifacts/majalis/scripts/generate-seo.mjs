/**
 * scripts/generate-seo.mjs
 *
 * المولّد الوحيد لمحتوى SEO الساكن:
 *   • public/sitemap.xml · public/robots.txt · public/feed.xml
 *   • seo-prerender/**\/index.html — قشرة HTML كاملة المعنى لكل مسار عام،
 *     يدمجها لاحقاً scripts/post-build-seo.mjs مع أصول Vite داخل dist/.
 *
 * قواعد ثابتة:
 *   1. النطاق واسم المنصة واللاحقة تُقرأ حصراً من site.config.json — لا تُكتب يدوياً.
 *   2. عناوين seo-routes.json «عارية» (اسم الصفحة فقط)؛ اللاحقة تُضاف هنا برمجياً،
 *      فتبقى صيغة العنوان موحّدة: «[اسم الصفحة] | المجلس العلمي».
 *   3. لا FAQPage في صفحات القوائم — إجاباتها غير ظاهرة كاملة في الواجهة
 *      (مخالفة صريحة لسياسة Google للبيانات المنظمة). QAPage تبقى في صفحات التفصيل.
 *   4. يُمسح seo-prerender/ في البداية، فلا تبقى صفحات يتيمة من توليد سابق.
 *
 * التشغيل: node scripts/generate-seo.mjs   (يسبق vite build)
 */

import { mkdir, readFile, writeFile, unlink, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const srcDir = resolve(appRoot, "src");

// ─────────────────────────────────────────────────────────────────────────────
// تحميل وحدات TypeScript مباشرة (Node ≥22 يجرّد الأنواع تلقائياً).
// يلزم فقط حلّ الاسم المستعار "@/" وامتدادات .ts الضمنية.
// ─────────────────────────────────────────────────────────────────────────────
registerHooks({
  resolve(specifier, context, nextResolve) {
    let spec = specifier;
    if (spec.startsWith("@/")) spec = pathToFileURL(resolve(srcDir, spec.slice(2))).href;
    else if (spec.startsWith(".") && context.parentURL) spec = new URL(spec, context.parentURL).href;
    if (spec.startsWith("file:")) {
      const p = fileURLToPath(spec);
      for (const cand of [p, `${p}.ts`, `${p}/index.ts`]) {
        if (existsSync(cand)) return { url: pathToFileURL(cand).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

const importSrc = (relPath) => import(pathToFileURL(resolve(appRoot, relPath)).href);

// ─────────────────────────────────────────────────────────────────────────────
// المصادر
// ─────────────────────────────────────────────────────────────────────────────
const SITE = JSON.parse(await readFile(resolve(appRoot, "site.config.json"), "utf8"));
const SITE_URL = SITE.siteUrl;
const SITE_NAME = SITE.siteName;
const TITLE_SUFFIX = SITE.titleSuffix;
const DEFAULT_IMAGE = SITE.defaultImage;

const LESSONS_SEED = JSON.parse(await readFile(resolve(__dirname, "lessons-seed.snapshot.json"), "utf8"));
const PLATFORM_SEED = JSON.parse(await readFile(resolve(__dirname, "platform-seed.snapshot.json"), "utf8"));
const LIBRARY_CATALOG = JSON.parse(await readFile(resolve(appRoot, "src/data/library-catalog.json"), "utf8"));

const seoConfigPath = resolve(appRoot, "src/lib/seo-routes.json");
const seoConfig = JSON.parse(await readFile(seoConfigPath, "utf8"));

if (seoConfig.siteUrl !== SITE_URL || seoConfig.siteName !== SITE_NAME) {
  console.error(
    `❌ seo-routes.json يخالف site.config.json (siteUrl/siteName). صحّح seo-routes.json — site.config.json هو المصدر.`,
  );
  process.exit(1);
}

const { PROPHETS } = await importSrc("src/lib/prophets-data.ts");
const { SINS_TOPICS } = await importSrc("src/lib/sins-rights-data.ts");
const { getAllSurahStories } = await importSrc("src/lib/surah-stories.ts");
const { FIQH_ISSUES_PUBLISHED_SEED } = await importSrc("src/lib/fiqh-issues-seed.ts");
const { isPublicIssue } = await importSrc("src/lib/fiqh-council-trust.ts");
const { SCHOLARS } = await importSrc("src/lib/scholars-data.ts");
const { MUEZZINS } = await importSrc("src/lib/adhan-audio.ts");

const SURAH_STORIES = getAllSurahStories();
const PUBLIC_FIQH_ISSUES = FIQH_ISSUES_PUBLISHED_SEED.filter(isPublicIssue);

/**
 * قوائم ثابتة محقونة داخل مكوّنات React (لا تُستورَد هنا لأن استيراد .tsx يتطلب JSX).
 * تُستخرَج نصياً من المصدر؛ إن فشل الاستخراج نتوقف بدل توليد صفحات ناقصة صامتة.
 */
async function extractSlugTitlePairs(relFile, constName, min) {
  const src = await readFile(resolve(appRoot, relFile), "utf8");
  const start = src.indexOf(constName);
  if (start === -1) throw new Error(`${constName} غير موجود في ${relFile}`);
  const body = src.slice(start);
  const pairs = [...body.matchAll(/\{\s*slug:\s*"([^"]+)",\s*title:\s*"([^"]+)"(?:,\s*description:\s*"([^"]*)")?/g)].map(
    (m) => ({ slug: m[1], title: m[2], description: m[3] || "" }),
  );
  const unique = [...new Map(pairs.map((p) => [p.slug, p])).values()];
  if (unique.length < min) {
    throw new Error(`استخراج ${constName} من ${relFile} أعاد ${unique.length} عنصراً فقط (المتوقع ≥ ${min}) — تغيّرت بنية الملف`);
  }
  return unique;
}

const LEARNING_PATHS = await extractSlugTitlePairs("src/views/learning/LearningPathsPage.tsx", "STATIC_PATHS", 15);
const TOPICS = await extractSlugTitlePairs("src/views/TopicsIndexPage.tsx", "STATIC_TOPICS", 40);

const publicDir = resolve(appRoot, "public");
const seoPrerenderDir = resolve(appRoot, "seo-prerender");
const buildDate = new Date().toISOString().slice(0, 10);

// مُخرَج بناء، لا مصدر: يُمسح كاملاً كي لا تبقى صفحات يتيمة من توليد سابق.
await rm(seoPrerenderDir, { recursive: true, force: true });

// ─────────────────────────────────────────────────────────────────────────────
// أدوات
// ─────────────────────────────────────────────────────────────────────────────
function absoluteUrl(path) {
  return new URL(path, SITE_URL).toString();
}

/** «[اسم الصفحة] | المجلس العلمي» — الصيغة الوحيدة المعتمدة. */
function pageTitle(route) {
  const name = String(route.title || "").trim();
  if (route.suffix === false || !name) return name || SITE_NAME;
  if (name.endsWith(TITLE_SUFFIX)) return name;
  return `${name}${TITLE_SUFFIX}`;
}

function padDesc(text, suffix) {
  if (!text) return suffix;
  return text.length >= 50 ? text : `${text}، ${suffix}`;
}

function clamp(text, max = 300) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function jsonLdScript(payload) {
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function dedupeLessons(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.external_key || row.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function lessonDescription(row) {
  const sheikh = row.speaker_name || "";
  const place = row.mosque || row.region || "";
  const base = [sheikh ? `الشيخ: ${sheikh}` : "", place ? `المكان: ${place}` : "", row.schedule || ""]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 160);
  return base || `${row.title} — درس شرعي على منصة ${SITE_NAME}`;
}

function linkList(heading, items) {
  if (!items?.length) return "";
  return `<h2>${escapeHtml(heading)}</h2>
<ul>
  ${items
    .map((i) => `<li><a href="${escapeHtml(absoluteUrl(i.url))}">${escapeHtml(i.name)}</a>${i.note ? ` — ${escapeHtml(i.note)}` : ""}</li>`)
    .join("\n  ")}
</ul>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD
// ─────────────────────────────────────────────────────────────────────────────
function lessonJsonLdScript(row) {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": row.is_course || row.activity_type === "دورة" ? "Course" : "EducationEvent",
    name: row.title,
    description: row.description || lessonDescription(row),
    url: absoluteUrl(`/lessons/${row.id}`),
    image: absoluteUrl(row.sheikh_image_url || row.poster_image_url || DEFAULT_IMAGE),
    inLanguage: "ar",
    organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    performer: row.speaker_name ? { "@type": "Person", name: row.speaker_name } : undefined,
    location: row.mosque
      ? {
          "@type": "Place",
          name: row.mosque,
          address: {
            "@type": "PostalAddress",
            addressLocality: row.region || row.city || "الكويت",
            addressCountry: "KW",
          },
        }
      : undefined,
    keywords: (row.keywords || [row.category]).filter(Boolean).join(", "),
  });
}

function siteJsonLdScript() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(DEFAULT_IMAGE),
    inLanguage: "ar",
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ar",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return jsonLdScript([org, site]);
}

function bookJsonLdScript(row) {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Book",
    name: row.title,
    author: { "@type": "Person", name: row.author },
    description: row.description || row.title,
    inLanguage: "ar",
    genre: row.category || "فقه إسلامي",
    url: absoluteUrl(`/library/${row.id}`),
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  });
}

function courseJsonLdScript(row) {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "Course",
    name: row.title || row.name,
    description: row.description || row.title || row.name,
    inLanguage: "ar",
    url: absoluteUrl(`/annual-courses/${row.id}`),
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(row.instructor ? { instructor: { "@type": "Person", name: row.instructor } } : {}),
  });
}

/** QAPage تُستعمل فقط حيث السؤال والجواب ظاهران كاملَين في الصفحة. */
function fatwaQaJsonLdScript(row) {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: row.question,
      text: row.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: row.answer || row.question,
        upvoteCount: row.view_count || 1,
      },
    },
  });
}

/**
 * Person للعلماء.
 * ملاحظة مقصودة: لا نُصدِر birthDate/deathDate — البيانات هجرية نصية («١٥٠ هـ»)
 * وschema.org يشترط ISO‑8601، وتحويلها تقريبي يُنتج سنة خاطئة أحياناً.
 * سنة الوفاة تظهر نصاً في متن الصفحة وفي الوصف.
 */
function scholarJsonLdScript(s) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: s.name,
    url: absoluteUrl(`/scholars/${s.id}`),
    inLanguage: "ar",
    description: clamp(s.bio, 300),
    ...(s.fullName ? { alternateName: s.fullName } : {}),
    ...(s.specialty?.length ? { jobTitle: s.specialty.join("، "), knowsAbout: s.specialty } : {}),
    ...(s.died ? { disambiguatingDescription: `توفي سنة ${s.died}` } : {}),
    ...(s.region ? { homeLocation: { "@type": "Place", name: s.region } } : {}),
    ...(s.key_works?.length
      ? { subjectOf: s.key_works.slice(0, 8).map((w) => ({ "@type": "Book", name: w, inLanguage: "ar" })) }
      : {}),
    ...(s.sources?.length ? { citation: s.sources } : {}),
  };
  return jsonLdScript(payload);
}

function itemListJsonLdScript(items, name) {
  if (!items?.length) return "";
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(name ? { name } : {}),
    numberOfItems: items.length,
    itemListElement: items.slice(0, 30).map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.url),
    })),
  });
}

function breadcrumbJsonLdScript(items) {
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// قالب صفحة التصيير المسبق
// ─────────────────────────────────────────────────────────────────────────────
const routesByPath = new Map(seoConfig.routes.map((r) => [r.path, r]));

/** فتات خبز مبني على المسار — يستعمل عناوين المسارات الأب حين تكون معروفة. */
function breadcrumbFor(route, parents = []) {
  if (route.path === "/") return "";
  const items = [{ name: "الرئيسية", path: "/" }];
  if (parents.length) {
    items.push(...parents);
    items.push({ name: route.title, path: route.path });
    return breadcrumbJsonLdScript(items);
  }
  const segs = route.path.split("/").filter(Boolean);
  let cur = "";
  for (const seg of segs) {
    cur += `/${seg}`;
    const isLast = cur === route.path;
    const matched = routesByPath.get(cur);
    // «/quran» لم يعد صفحة قائمة بذاتها (تحويل 301 إلى /quran-hub).
    if (!matched && !isLast && cur === "/quran") {
      items.push({ name: "القرآن الكريم", path: "/quran-hub" });
      continue;
    }
    items.push({ name: matched ? matched.title : isLast ? route.title : seg, path: cur });
  }
  return breadcrumbJsonLdScript(items);
}

const HEAD_ASSETS = `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`;

function prerenderHtml(route, extraJsonLd = "", richBody = "", parents = []) {
  const canonical = absoluteUrl(route.path);
  const image = absoluteUrl(route.image || DEFAULT_IMAGE);
  const keywords = [...new Set([...(route.keywords || []), ...seoConfig.defaultKeywords])].join(", ");
  const robots = route.robots || "index, follow";
  const ogType = route.ogType || "website";
  const title = pageTitle(route);
  const h1 = route.title;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(route.description)}" />
    <meta name="keywords" content="${escapeHtml(keywords)}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="author" content="${escapeHtml(SITE_NAME)}" />
    <meta name="theme-color" content="#164E3C" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="ar" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}" />
    ${HEAD_ASSETS}
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:locale" content="ar_KW" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    ${route.path === "/" ? siteJsonLdScript() : jsonLdScript({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: h1,
      description: route.description,
      url: canonical,
      inLanguage: "ar",
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: absoluteUrl(DEFAULT_IMAGE) },
      },
    })}
    ${breadcrumbFor(route, parents)}
    ${extraJsonLd}
  </head>
  <body>
    <header>
      <nav>
        <a href="${escapeHtml(SITE_URL)}">${escapeHtml(SITE_NAME)}</a>
        <a href="${escapeHtml(absoluteUrl("/lessons"))}">الدروس</a>
        <a href="${escapeHtml(absoluteUrl("/quran-hub"))}">القرآن</a>
        <a href="${escapeHtml(absoluteUrl("/adhkar"))}">الأذكار</a>
        <a href="${escapeHtml(absoluteUrl("/search"))}">البحث</a>
      </nav>
    </header>
    <main>
      <article>
        <h1>${escapeHtml(h1)}</h1>
        <p>${escapeHtml(route.description)}</p>
        ${richBody}
        <nav aria-label="التنقل">
          <a href="${escapeHtml(SITE_URL)}">الرئيسية</a>
          ${route.path !== "/" ? `<a href="${escapeHtml(canonical)}">${escapeHtml(h1)}</a>` : ""}
        </nav>
      </article>
    </main>
    <footer>
      <p>© ${new Date().getFullYear()} ${escapeHtml(SITE_NAME)} — ${escapeHtml(SITE_URL)}</p>
    </footer>
  </body>
</html>`;
}

/** كل صفحة مُصيَّرة تُسجَّل هنا؛ منها تُبنى الخريطة، فلا تتفرّق مصادر الحقيقة. */
const pages = [];
function addPage(route, { extraJsonLd = "", richBody = "", parents = [], sitemap = true, priority = 0.7, changefreq = "weekly" } = {}) {
  pages.push({ route, extraJsonLd, richBody, parents, sitemap, priority, changefreq });
}

// ─────────────────────────────────────────────────────────────────────────────
// ١) المسارات الساكنة من seo-routes.json
// ─────────────────────────────────────────────────────────────────────────────
const lessonRows = dedupeLessons(LESSONS_SEED);
const verifiedFiqhSessions = (PLATFORM_SEED.fiqh_sessions || []).filter(
  (row) => row.verification_status === "verified" && row.publish_status === "published",
);

const ADHKAR_CATEGORIES = [
  { id: "morning", name: "أذكار الصباح" },
  { id: "evening", name: "أذكار المساء" },
  { id: "sleep", name: "أذكار النوم" },
  { id: "wakeup", name: "أذكار الاستيقاظ" },
  { id: "mosque", name: "أذكار المسجد" },
  { id: "salah", name: "أذكار الصلاة" },
  { id: "after-salah", name: "أذكار بعد الصلاة" },
  { id: "travel", name: "أذكار السفر" },
  { id: "distress", name: "أذكار الكرب" },
  { id: "istighfar", name: "أذكار الاستغفار" },
];

const ASMAA_HUSNA = [
  { num: 1, arabic: "الله", meaning: "الاسم الجامع لجميع صفات الألوهية" },
  { num: 2, arabic: "الرحمن", meaning: "واسع الرحمة لجميع الخلق" },
  { num: 3, arabic: "الرحيم", meaning: "خاصّ الرحمة بالمؤمنين" },
  { num: 4, arabic: "الملك", meaning: "المالك الحقيقي لكل شيء" },
  { num: 5, arabic: "القدوس", meaning: "المنزّه عن كل عيب ونقص" },
  { num: 6, arabic: "السلام", meaning: "ذو السلامة من كل نقص" },
  { num: 7, arabic: "المؤمن", meaning: "المصدق عباده، المؤمِّن من خوفه" },
  { num: 8, arabic: "المهيمن", meaning: "الرقيب الشاهد على كل شيء" },
  { num: 9, arabic: "العزيز", meaning: "الغالب الذي لا يُغلب" },
  { num: 10, arabic: "الجبار", meaning: "القاهر الذي يجبر الكسر" },
  { num: 11, arabic: "المتكبر", meaning: "المتعظّم الذي له الكبرياء" },
  { num: 12, arabic: "الخالق", meaning: "المُبدع الموجد من العدم" },
  { num: 13, arabic: "البارئ", meaning: "الخالق المميّز بين الخلق" },
  { num: 14, arabic: "المصوّر", meaning: "واهب الصور والأشكال" },
  { num: 15, arabic: "الغفار", meaning: "كثير المغفرة والعفو" },
  { num: 16, arabic: "القهار", meaning: "الغالب لكل شيء بالقهر والقدرة" },
  { num: 17, arabic: "الوهاب", meaning: "كثير العطاء بلا منّة" },
  { num: 18, arabic: "الرزاق", meaning: "الضامن لأرزاق جميع الخلق" },
  { num: 19, arabic: "الفتّاح", meaning: "فاتح أبواب الخير والرحمة" },
  { num: 20, arabic: "العليم", meaning: "المحيط علمه بكل شيء" },
];

const DUAS_SEED = [
  { id: "sabah-1", title: "دعاء الصباح الأول" },
  { id: "sabah-2", title: "سيد الاستغفار في الصباح" },
  { id: "masa-1", title: "أذكار المساء، الآية الكريمة" },
  { id: "salah-1", title: "دعاء الاستفتاح" },
  { id: "salah-2", title: "دعاء الركوع" },
  { id: "salah-3", title: "دعاء السجود" },
  { id: "salah-4", title: "دعاء التشهد الأخير" },
  { id: "safar-1", title: "دعاء السفر" },
  { id: "karb-1", title: "دعاء الكرب" },
  { id: "karb-2", title: "دعاء الهمّ والحزن" },
  { id: "nawm-1", title: "دعاء النوم" },
  { id: "nawm-2", title: "دعاء الاستيقاظ" },
  { id: "akl-1", title: "دعاء الطعام" },
  { id: "akl-2", title: "دعاء الفراغ من الطعام" },
  { id: "masjid-1", title: "دعاء دخول المسجد" },
  { id: "masjid-2", title: "دعاء الخروج من المسجد" },
  { id: "wudu-1", title: "دعاء الوضوء" },
  { id: "shifa-1", title: "دعاء الشفاء" },
  { id: "ziyara-1", title: "دعاء زيارة المريض" },
  { id: "duha-1", title: "دعاء صلاة الضحى" },
];

// ⚠️ لا FAQPage هنا: الواجهة تعرض مقتطف الإجابة فقط (answer.slice(0,120))،
// وحقن الإجابة كاملة في البيانات المنظّمة مخالفة لسياسة Google.
const LIST_JSON_LD = {
  "/library": itemListJsonLdScript(LIBRARY_CATALOG.map((b) => ({ name: b.title, url: `/library/${b.id}` })), "المكتبة العلمية"),
  "/fiqh-council": itemListJsonLdScript(
    (PLATFORM_SEED.fiqh_decisions || []).map((r) => ({ name: r.title, url: `/fiqh-council/${r.slug || r.id}` })),
    "قرارات المجمع الفقهي",
  ),
  "/fatwa": itemListJsonLdScript((PLATFORM_SEED.fatwas || []).map((r) => ({ name: r.question, url: `/fatwa/${r.id}` })), "الفتاوى الشرعية"),
  "/qa": itemListJsonLdScript(
    (PLATFORM_SEED.qa_items || []).map((r) => ({ name: r.question, url: `/qa#${r.id}` })),
    "الأسئلة والأجوبة الشرعية",
  ),
  "/rulings": itemListJsonLdScript((PLATFORM_SEED.rulings || []).map((r) => ({ name: r.title, url: `/rulings/${r.id}` })), "الأحكام الشرعية"),
  "/lessons": itemListJsonLdScript(lessonRows.slice(0, 30).map((r) => ({ name: r.title, url: `/lessons/${r.id}` })), "الدروس الشرعية"),
  "/adhkar": itemListJsonLdScript(ADHKAR_CATEGORIES.map((c) => ({ name: c.name, url: `/adhkar?cat=${c.id}` })), "أقسام الأذكار"),
  "/prophets": itemListJsonLdScript(
    PROPHETS.map((p) => ({ name: `قصة نبي الله ${p.arabicName} عليه السلام`, url: `/prophets/${p.slug}` })),
    "قصص الأنبياء",
  ),
  "/scholars": itemListJsonLdScript(SCHOLARS.map((s) => ({ name: s.name, url: `/scholars/${s.id}` })), "أعلام العلماء المسلمين"),
  "/learning/paths": itemListJsonLdScript(
    LEARNING_PATHS.map((p) => ({ name: p.title, url: `/learning/paths/${p.slug}` })),
    "المسارات العلمية",
  ),
  "/topics": itemListJsonLdScript(TOPICS.map((t) => ({ name: t.title, url: `/topics/${t.slug}` })), "المواضيع الإسلامية"),
  "/muezzins": itemListJsonLdScript(MUEZZINS.map((m) => ({ name: m.name, url: `/muezzins/${m.id}` })), "المؤذنون"),
  "/quran/surah-stories": itemListJsonLdScript(
    SURAH_STORIES.map((s) => ({ name: `سورة ${s.name}`, url: `/quran/surah-stories/${s.number}` })),
    "قصص سور القرآن",
  ),
  "/sins-and-rights": itemListJsonLdScript(
    SINS_TOPICS.map((t) => ({ name: t.title, url: `/sins-and-rights/${t.slug}` })),
    "الذنوب والحقوق",
  ),
  "/fiqh-council/issues": itemListJsonLdScript(
    PUBLIC_FIQH_ISSUES.map((i) => ({ name: i.title, url: `/fiqh-council/issues/${i.slug}` })),
    "المسائل الفقهية",
  ),
  "/asma-husna": itemListJsonLdScript(
    ASMAA_HUSNA.map((a) => ({ name: `${a.arabic} — ${a.meaning}`, url: `/asma-husna#name-${a.num}` })),
    "أسماء الله الحسنى",
  ),
  "/duas": itemListJsonLdScript(DUAS_SEED.map((d) => ({ name: d.title, url: `/duas#${d.id}` })), "الأدعية الشرعية الموثقة"),
};

const RICH_BODY_MAP = {
  "/lessons": linkList(
    "أبرز الدروس والدورات",
    lessonRows.slice(0, 15).map((r) => ({ name: r.title, url: `/lessons/${r.id}`, note: r.speaker_name })),
  ),
  "/library": linkList(
    "من الكتب المتاحة",
    LIBRARY_CATALOG.slice(0, 15).map((b) => ({ name: b.title, url: `/library/${b.id}`, note: b.author })),
  ),
  "/adhkar": linkList("أقسام الأذكار", ADHKAR_CATEGORIES.map((c) => ({ name: c.name, url: `/adhkar?cat=${c.id}` }))),
  "/scholars": linkList(
    "من علماء المسلمين",
    SCHOLARS.slice(0, 30).map((s) => ({ name: s.name, url: `/scholars/${s.id}`, note: s.died })),
  ),
  "/fatwa": linkList(
    "فتاوى شرعية",
    (PLATFORM_SEED.fatwas || []).slice(0, 12).map((f) => ({ name: f.question, url: `/fatwa/${f.id}` })),
  ),
  "/qa": linkList(
    "أسئلة وأجوبة شرعية",
    (PLATFORM_SEED.qa_items || []).slice(0, 12).map((q) => ({ name: q.question, url: `/qa#${q.id}` })),
  ),
  "/prophets": linkList(
    "قصص الأنبياء",
    PROPHETS.map((p) => ({ name: `نبي الله ${p.arabicName} عليه السلام`, url: `/prophets/${p.slug}` })),
  ),
  "/learning/paths": linkList(
    "المسارات العلمية المتاحة",
    LEARNING_PATHS.map((p) => ({ name: p.title, url: `/learning/paths/${p.slug}` })),
  ),
  "/topics": linkList("المواضيع الإسلامية", TOPICS.map((t) => ({ name: t.title, url: `/topics/${t.slug}` }))),
  "/muezzins": linkList("المؤذنون", MUEZZINS.map((m) => ({ name: m.name, url: `/muezzins/${m.id}`, note: m.origin }))),
  "/quran/surah-stories": linkList(
    "قصص السور",
    SURAH_STORIES.slice(0, 30).map((s) => ({ name: `سورة ${s.name}`, url: `/quran/surah-stories/${s.number}` })),
  ),
  "/sins-and-rights": linkList("موضوعات الذنوب والحقوق", SINS_TOPICS.map((t) => ({ name: t.title, url: `/sins-and-rights/${t.slug}` }))),
  "/fiqh-council/issues": linkList(
    "المسائل الفقهية المعاصرة",
    PUBLIC_FIQH_ISSUES.slice(0, 25).map((i) => ({ name: i.title, url: `/fiqh-council/issues/${i.slug}` })),
  ),
  "/learning-path": `<h2>كيف تعمل خارطة طالب العلم؟</h2>
<p>تنظّم الخارطة العلوم الشرعية عبر أربعة مستويات متدرجة: التمهيدي، ثم المبتدئ، ثم المتوسط، ثم المتقدم. كل علم يضم كتباً ودروساً مرتبة بحسب المستوى مع تقدير الوقت اللازم لكل كتاب، ويحفظ النظام تقدّم الطالب ويقترح الخطوة التالية المناسبة له.</p>
${linkList("روابط ذات صلة", [
  { name: "مسارات التعلّم المنظّمة", url: "/learning/paths" },
  { name: "لوحتي التعليمية ومتابعة التقدّم", url: "/my-learning" },
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "مكتبة الكتب الشرعية", url: "/library" },
])}`,
  "/scholarly-research": `<h2>ما الباحث الشرعي؟</h2>
<p>أداة بحث تعتمد على الذكاء الاصطناعي للإجابة عن الأسئلة الشرعية بالاستناد إلى مصادر موثّقة من محتوى المنصة (الكتب والفتاوى والدروس)، مع ذكر مصدر كل معلومة. لا تصدر الأداة فتوى شخصية في المسائل التي تحتاج تفصيلاً دقيقاً؛ عند الحاجة تُوجّه السائل لعالم مؤهل.</p>
${linkList("روابط ذات صلة", [
  { name: "الفتاوى الشرعية الموثقة", url: "/fatwa" },
  { name: "الأسئلة والأجوبة", url: "/qa" },
  { name: "مصادر المكتبة العلمية", url: "/library" },
])}`,
  "/knowledge-graph": `<h2>ما خريطة المعرفة؟</h2>
<p>عرض بصري تفاعلي يربط بين مفاهيم العلوم الشرعية (كالفقه والعقيدة والحديث والتفسير) ويُظهر علاقاتها ببعضها، ليساعد طالب العلم على فهم كيف يتصل كل علم بغيره بدل دراسته منعزلاً.</p>
${linkList("روابط ذات صلة", [
  { name: "خارطة طالب العلم", url: "/learning-path" },
  { name: "الفقه الإسلامي", url: "/fiqh" },
  { name: "أعلام العلماء المسلمين", url: "/scholars" },
])}`,
};

for (const route of seoConfig.routes) {
  if (route.path.includes(":")) continue; // لا يوجد الآن؛ حراسة احتياطية
  addPage(route, {
    extraJsonLd: LIST_JSON_LD[route.path] || "",
    richBody: RICH_BODY_MAP[route.path] || "",
    sitemap: Boolean(route.sitemap),
    priority: route.priority ?? 0.7,
    changefreq: route.changefreq ?? "weekly",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ٢) الدروس
// ─────────────────────────────────────────────────────────────────────────────
for (const row of lessonRows) {
  addPage(
    {
      path: `/lessons/${row.id}`,
      title: row.title,
      description: padDesc(lessonDescription(row), `درس شرعي على منصة ${SITE_NAME}`),
      keywords: [row.title, row.speaker_name, row.category, "دروس شرعية", "محاضرات إسلامية", "دورات شرعية"].filter(Boolean),
      image: row.sheikh_image_url || row.poster_image_url || DEFAULT_IMAGE,
      ogType: "article",
    },
    {
      extraJsonLd: lessonJsonLdScript(row),
      parents: [{ name: "الدروس الشرعية", path: "/lessons" }],
      priority: 0.72,
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ٣) محتوى المنصّة (قرارات، فتاوى، أحكام، دورات، كتب، جلسات)
// ─────────────────────────────────────────────────────────────────────────────
for (const row of PLATFORM_SEED.fiqh_decisions || []) {
  addPage(
    {
      path: `/fiqh-council/${row.slug || row.id}`,
      title: row.title,
      description: padDesc(row.title, "قرار من المجمع الفقهي الإسلامي الدولي"),
      ogType: "article",
      robots: "index, follow",
    },
    { parents: [{ name: "المجمع الفقهي الإسلامي", path: "/fiqh-council" }], priority: 0.7 },
  );
}

for (const row of PLATFORM_SEED.fatwas || []) {
  addPage(
    {
      path: `/fatwa/${row.id}`,
      title: row.question,
      description: padDesc(row.answer ? clamp(row.answer, 160) : row.question, `فتوى شرعية من ${SITE_NAME}`),
      ogType: "article",
    },
    {
      extraJsonLd: fatwaQaJsonLdScript(row),
      parents: [{ name: "الفتاوى الشرعية", path: "/fatwa" }],
      priority: 0.71,
    },
  );
}

for (const row of verifiedFiqhSessions) {
  addPage(
    {
      path: `/fiqh-council/sessions/${row.slug}`,
      title: row.title,
      description: padDesc(row.title, "جلسة فقهية في المجمع الفقهي الإسلامي الدولي"),
      ogType: "article",
      robots: "index, follow",
    },
    { parents: [{ name: "المجمع الفقهي الإسلامي", path: "/fiqh-council" }], priority: 0.69 },
  );
}

for (const row of PLATFORM_SEED.rulings || []) {
  addPage(
    {
      path: `/rulings/${row.id}`,
      title: row.title,
      description: padDesc(row.title, `حكم شرعي موثّق من الموسوعة الفقهية في ${SITE_NAME}`),
      ogType: "article",
    },
    { parents: [{ name: "الأحكام الشرعية", path: "/rulings" }], priority: 0.69 },
  );
}

for (const row of PLATFORM_SEED.courses || []) {
  addPage(
    {
      path: `/annual-courses/${row.id}`,
      title: row.title || row.name,
      description: padDesc(row.description || row.title || row.name, `دورة علمية شرعية من ${SITE_NAME}`),
    },
    {
      extraJsonLd: courseJsonLdScript(row),
      parents: [{ name: "الدورات العلمية", path: "/annual-courses" }],
      priority: 0.68,
    },
  );
}

for (const row of LIBRARY_CATALOG) {
  addPage(
    {
      path: `/library/${row.id}`,
      title: row.title,
      description: padDesc(row.description || row.title, `كتاب من المكتبة الشرعية في ${SITE_NAME}`),
      ogType: "book",
    },
    {
      extraJsonLd: bookJsonLdScript(row),
      parents: [{ name: "المكتبة العلمية", path: "/library" }],
      priority: 0.7,
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ٤) المسارات الديناميكية التي كانت تسقط على الرئيسية (صفر صفحات مُصيَّرة سابقاً)
// ─────────────────────────────────────────────────────────────────────────────

// العلماء — Person JSON-LD (٩٦ ترجمة). المعرّفات تُقرأ وقت البناء من scholars-data.ts.
for (const s of SCHOLARS) {
  const works = s.key_works?.length ? ` من مؤلفاته: ${s.key_works.slice(0, 3).join("، ")}.` : "";
  addPage(
    {
      // العنوان مطابق لما تضبطه ScholarProfilePage وقت التشغيل، فلا يتبدّل العنوان بعد التحميل.
      path: `/scholars/${s.id}`,
      title: `${s.name} — سيرة العالم`,
      description: clamp(padDesc(s.bio, `ترجمة ${s.name} في ${SITE_NAME}`), 300),
      keywords: [s.name, s.fullName, ...(s.specialty || []), "علماء الإسلام", "سير الأعلام"].filter(Boolean),
      ogType: "profile",
    },
    {
      extraJsonLd: scholarJsonLdScript(s),
      parents: [{ name: "أعلام العلماء المسلمين", path: "/scholars" }],
      richBody: `<h2>نبذة</h2>
<p>${escapeHtml(s.bio)}</p>
<ul>
  ${s.fullName ? `<li>الاسم الكامل: ${escapeHtml(s.fullName)}</li>` : ""}
  ${s.era ? `<li>الحقبة: ${escapeHtml(s.era)}</li>` : ""}
  ${s.died ? `<li>الوفاة: ${escapeHtml(s.died)}</li>` : ""}
  ${s.region ? `<li>الموطن: ${escapeHtml(s.region)}</li>` : ""}
  ${s.madhhab ? `<li>المذهب: ${escapeHtml(s.madhhab)}</li>` : ""}
  ${s.specialty?.length ? `<li>التخصص: ${escapeHtml(s.specialty.join("، "))}</li>` : ""}
</ul>
${s.key_works?.length ? `<h2>أبرز المؤلفات</h2>\n<ul>\n  ${s.key_works.map((w) => `<li>${escapeHtml(w)}</li>`).join("\n  ")}\n</ul>` : ""}
${works ? "" : ""}`,
      priority: 0.75,
      changefreq: "monthly",
    },
  );
}

// الأنبياء — ٢٥ نبياً من prophets-data.ts
for (const p of PROPHETS) {
  addPage(
    {
      path: `/prophets/${p.slug}`,
      title: `قصة ${p.arabicName} عليه السلام`,
      description: clamp(p.briefBio, 300),
      keywords: [p.arabicName, p.title, "قصص الأنبياء", "الأنبياء والرسل", ...(p.mainSurahs || [])].filter(Boolean),
      ogType: "article",
    },
    {
      parents: [{ name: "قصص الأنبياء", path: "/prophets" }],
      richBody: `<h2>نبذة</h2>
<p>${escapeHtml(p.briefBio)}</p>
<ul>
  <li>اللقب: ${escapeHtml(p.title)}</li>
  ${p.quranTitle ? `<li>اللقب القرآني: ${escapeHtml(p.quranTitle)}</li>` : ""}
  <li>القوم أو المكان: ${escapeHtml(p.peopleOrPlace)}</li>
  <li>الحقبة: ${escapeHtml(p.era)}</li>
  <li>أبرز السور: ${escapeHtml((p.mainSurahs || []).join("، "))}</li>
</ul>
${p.keyAttributes?.length ? `<h2>أبرز صفاته</h2>\n<ul>\n  ${p.keyAttributes.map((a) => `<li>${escapeHtml(a)}</li>`).join("\n  ")}\n</ul>` : ""}
${p.lessons?.length ? `<h2>الدروس والعبر</h2>\n<ul>\n  ${p.lessons.map((l) => `<li>${escapeHtml(l)}</li>`).join("\n  ")}\n</ul>` : ""}`,
      priority: 0.74,
      changefreq: "monthly",
    },
  );
}

// قصص السور — ١١٤ سورة من surah-stories.ts
for (const s of SURAH_STORIES) {
  addPage(
    {
      path: `/quran/surah-stories/${s.number}`,
      title: `سورة ${s.name} — سبب التسمية والمحاور`,
      description: clamp(padDesc(s.namingReason, `سورة ${s.name} — ${s.revelationPlace}، ${s.ayahCount} آية.`), 300),
      keywords: [`سورة ${s.name}`, "قصص السور", "أسباب النزول", "علوم القرآن", ...(s.keywords || [])].filter(Boolean),
      ogType: "article",
    },
    {
      parents: [
        { name: "مركز القرآن الكريم", path: "/quran-hub" },
        { name: "قصص سور القرآن", path: "/quran/surah-stories" },
      ],
      richBody: `<h2>تعريف السورة</h2>
<ul>
  <li>الترتيب: ${s.number}</li>
  <li>عدد الآيات: ${s.ayahCount}</li>
  <li>مكان النزول: ${escapeHtml(s.revelationPlace)}</li>
  <li>زمن النزول: ${escapeHtml(s.revelationTime)}</li>
</ul>
${s.namingReason ? `<h2>سبب التسمية</h2>\n<p>${escapeHtml(s.namingReason)}</p>` : ""}
${s.mainThemes?.length ? `<h2>محاور السورة</h2>\n<ul>\n  ${s.mainThemes.map((t) => `<li>${escapeHtml(t)}</li>`).join("\n  ")}\n</ul>` : ""}
${s.lessons?.length ? `<h2>الفوائد والدروس</h2>\n<ul>\n  ${s.lessons.map((l) => `<li>${escapeHtml(l)}</li>`).join("\n  ")}\n</ul>` : ""}`,
      priority: 0.7,
      changefreq: "monthly",
    },
  );
}

// الذنوب والحقوق — ٢٦ موضوعاً من sins-rights-data.ts
for (const t of SINS_TOPICS) {
  addPage(
    {
      path: `/sins-and-rights/${t.slug}`,
      title: `${t.title} — الذنوب والحقوق`,
      description: clamp(padDesc(t.shortDescription, "من موضوعات الذنوب والحقوق في المجلس العلمي"), 300),
      keywords: [t.title, "الذنوب والحقوق", "التوبة", "الكبائر"],
      ogType: "article",
      // الموضوعات قيد المراجعة الشرعية لا تُفهرَس حتى تُعتمَد.
      robots: t.reviewStatus === "reviewed" ? "index, follow" : "noindex, follow",
    },
    {
      parents: [{ name: "الذنوب والحقوق", path: "/sins-and-rights" }],
      sitemap: t.reviewStatus === "reviewed",
      richBody: `<h2>تعريف</h2>
<p>${escapeHtml(t.explanation || t.shortDescription)}</p>
${t.effects?.length ? `<h2>الآثار</h2>\n<ul>\n  ${t.effects.map((e) => `<li>${escapeHtml(e)}</li>`).join("\n  ")}\n</ul>` : ""}
${t.repentanceConditions?.general?.length ? `<h2>شروط التوبة</h2>\n<ul>\n  ${t.repentanceConditions.general.map((c) => `<li>${escapeHtml(c)}</li>`).join("\n  ")}\n</ul>` : ""}`,
      priority: 0.68,
      changefreq: "monthly",
    },
  );
}

// مسائل المجمع الفقهي — من fiqh-issues-seed.ts (المنشورة العامة فقط)
for (const issue of PUBLIC_FIQH_ISSUES) {
  addPage(
    {
      path: `/fiqh-council/issues/${issue.slug}`,
      title: `${issue.title} — المسائل الفقهية`,
      description: clamp(padDesc(issue.summary || issue.title, "مسألة فقهية معاصرة في المجمع الفقهي الإسلامي"), 300),
      keywords: [issue.title, issue.category, "المسائل الفقهية", "المجمع الفقهي", "فقه النوازل"].filter(Boolean),
      ogType: "article",
    },
    {
      parents: [
        { name: "المجمع الفقهي الإسلامي", path: "/fiqh-council" },
        { name: "المسائل الفقهية — المجمع الفقهي", path: "/fiqh-council/issues" },
      ],
      richBody: `<h2>ملخّص المسألة</h2>
<p>${escapeHtml(issue.summary || issue.title)}</p>
${issue.category ? `<p>التصنيف: ${escapeHtml(issue.category)}</p>` : ""}`,
      priority: 0.69,
      changefreq: "monthly",
    },
  );
}

// المسارات العلمية — من STATIC_PATHS في LearningPathsPage
for (const p of LEARNING_PATHS) {
  addPage(
    {
      path: `/learning/paths/${p.slug}`,
      title: p.title,
      description: clamp(padDesc(p.description, "مسار تعلّم شرعي منظّم — كتب ودروس واختبارات وشهادة إتمام"), 300),
      keywords: [p.title, "مسارات التعلم", "طلب العلم", "دراسة شرعية"],
    },
    {
      parents: [{ name: "المسارات العلمية", path: "/learning/paths" }],
      priority: 0.7,
      changefreq: "monthly",
    },
  );
}

// المواضيع — من STATIC_TOPICS في TopicsIndexPage
for (const t of TOPICS) {
  addPage(
    {
      path: `/topics/${t.slug}`,
      title: t.title,
      description: `${t.title} — أدلة وأحكام وفتاوى ودروس وكتب ذات صلة، مجموعة من مصادر المجلس العلمي الموثقة.`,
      keywords: [t.title, "مواضيع إسلامية", "أحكام شرعية"],
    },
    { parents: [{ name: "المواضيع الإسلامية", path: "/topics" }], priority: 0.66, changefreq: "monthly" },
  );
}

// المؤذنون — من MUEZZINS في adhan-audio.ts
for (const m of MUEZZINS) {
  addPage(
    {
      path: `/muezzins/${m.id}`,
      title: `${m.name} — أذان`,
      description: clamp(padDesc(m.biography, `صوت الأذان للمؤذن ${m.name} من ${m.country || "—"} على منصة ${SITE_NAME}`), 300),
      keywords: [m.name, "أذان", "مؤذنون", m.country, m.style].filter(Boolean),
      ogType: "profile",
    },
    {
      parents: [{ name: "المؤذنون وأصوات الأذان", path: "/muezzins" }],
      richBody: `<h2>نبذة</h2>
<p>${escapeHtml(m.biography || "")}</p>
<ul>
  ${m.origin ? `<li>المنشأ: ${escapeHtml(m.origin)}</li>` : ""}
  ${m.country ? `<li>الدولة: ${escapeHtml(m.country)}</li>` : ""}
  ${m.style ? `<li>الأسلوب: ${escapeHtml(m.style)}</li>` : ""}
</ul>`,
      priority: 0.6,
      changefreq: "monthly",
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// كتابة صفحات التصيير المسبق
// ─────────────────────────────────────────────────────────────────────────────
const seenPaths = new Set();
for (const page of pages) {
  const { route } = page;
  if (seenPaths.has(route.path)) {
    console.error(`❌ مسار مكرر في التوليد: ${route.path}`);
    process.exit(1);
  }
  seenPaths.add(route.path);

  const dir = route.path === "/" ? seoPrerenderDir : resolve(seoPrerenderDir, route.path.slice(1));
  await mkdir(dir, { recursive: true });
  await writeFile(
    resolve(dir, "index.html"),
    prerenderHtml(route, page.extraJsonLd, page.richBody, page.parents),
    "utf8",
  );

  // إزالة نسخ قديمة كانت تُكتب داخل public/ (تسبق نظام seo-prerender)
  if (route.path !== "/" && !route.path.includes("/", 1)) {
    for (const legacyName of ["index.html", "index.seo.html"]) {
      try {
        await unlink(resolve(publicDir, route.path.slice(1), legacyName));
      } catch {
        /* اختياري */
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// sitemap.xml — من نفس قائمة الصفحات، فلا يظهر فيها مسار غير مُصيَّر
// ─────────────────────────────────────────────────────────────────────────────
const sitemapPages = pages.filter((p) => p.sitemap && !(p.route.robots || "").includes("noindex"));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPages
  .map(
    (p) =>
      `  <url>\n    <loc>${escapeXml(absoluteUrl(p.route.path))}</loc>\n    <lastmod>${buildDate}</lastmod>\n    <changefreq>${escapeXml(p.changefreq)}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

// robots.txt — بلا توجيه Host: (يتجاهله Google، ويُربك بقية الزواحف عند تغيّر النطاق)
const robots = `# ${SITE_URL}/robots.txt
# ${SITE_NAME}

User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /login
Disallow: /api/
Disallow: /search/

Sitemap: ${SITE_URL}/sitemap.xml
`;

const BUILD_DATE = new Date().toUTCString();
const rssItems = [
  ...(PLATFORM_SEED.fiqh_decisions || []).slice(0, 6).map((row) => ({
    title: `[قرار مجمعي] ${row.title}`,
    link: absoluteUrl(`/fiqh-council/${row.slug || row.id}`),
    description: `قرار فقهي جماعي: ${row.title} — ${row.category || "المجمع الفقهي الإسلامي"}`,
    category: "قرارات فقهية",
  })),
  ...(PLATFORM_SEED.fatwas || []).slice(0, 5).map((row) => ({
    title: row.question,
    link: absoluteUrl(`/fatwa/${row.id}`),
    description: `فتوى شرعية في ${row.category || "الفقه الإسلامي"}: ${row.question}`,
    category: "فتاوى شرعية",
  })),
  ...(PLATFORM_SEED.rulings || []).slice(0, 4).map((row) => ({
    title: `[حكم شرعي] ${row.title}`,
    link: absoluteUrl(`/rulings/${row.id}`),
    description: `حكم شرعي موثق في ${row.category || "الفقه الإسلامي"}: ${row.title}`,
    category: "أحكام شرعية",
  })),
  ...(PLATFORM_SEED.courses || []).slice(0, 3).map((row) => ({
    title: `[دورة علمية] ${row.title || row.name || "دورة شرعية"}`,
    link: absoluteUrl(`/annual-courses/${row.id}`),
    description: `دورة علمية: ${row.title || row.name || "دورة شرعية"} — ${SITE_NAME}`,
    category: "دورات علمية",
  })),
];

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>آخر المستجدات العلمية — قرارات وفتاوى وأحكام ودورات</description>
    <language>ar</language>
    <lastBuildDate>${BUILD_DATE}</lastBuildDate>
    <managingEditor>${escapeXml(SITE.emails.info)} (${escapeXml(SITE_NAME)})</managingEditor>
    <image>
      <url>${escapeXml(absoluteUrl(DEFAULT_IMAGE))}</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${escapeXml(SITE_URL)}</link>
    </image>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml"/>
    ${rssItems
      .map(
        (item) => `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${BUILD_DATE}</pubDate>
      ${item.category ? `<dc:subject>${escapeXml(item.category)}</dc:subject>` : ""}
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
    </item>`,
      )
      .join("\n    ")}
  </channel>
</rss>
`;

await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(resolve(publicDir, "robots.txt"), robots, "utf8");
await writeFile(resolve(publicDir, "feed.xml"), feed, "utf8");

console.log(
  [
    `✓ ${SITE_URL}`,
    `  صفحات مُصيَّرة: ${pages.length}  (منها في sitemap: ${sitemapPages.length})`,
    `  علماء: ${SCHOLARS.length} · أنبياء: ${PROPHETS.length} · قصص سور: ${SURAH_STORIES.length} · ذنوب وحقوق: ${SINS_TOPICS.length}`,
    `  مسائل فقهية: ${PUBLIC_FIQH_ISSUES.length} · مسارات: ${LEARNING_PATHS.length} · مواضيع: ${TOPICS.length} · مؤذنون: ${MUEZZINS.length}`,
    `  دروس: ${lessonRows.length} · كتب: ${LIBRARY_CATALOG.length}`,
  ].join("\n"),
);
