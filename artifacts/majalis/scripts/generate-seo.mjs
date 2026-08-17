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
 * التشغيل: node --import tsx scripts/generate-seo.mjs   (يسبق vite build)
 * أو: pnpm run generate:seo
 */

import { mkdir, readFile, writeFile, unlink, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  isPrivateSeoPath,
  ADMIN_DEFAULT_DESCRIPTION,
  ADMIN_DEFAULT_ROBOTS,
} from "./seo-path-class.mjs";
import { IA_BREADCRUMB_PARENTS, IA_REDIRECTS } from "../src/lib/ia-final-structure.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");

/**
 * استيراد وحدة مصدر (.ts/.js/.mjs/.json) بمسار صريح الامتداد.
 * يعتمد على `node --import tsx` لتحميل TypeScript — بلا register()/strip hooks.
 */
function importSrc(relPath) {
  if (typeof relPath !== "string" || !relPath.trim()) {
    return Promise.reject(new Error("importSrc: path required"));
  }
  if (!/\.(ts|tsx|js|mjs|cjs|json)$/.test(relPath)) {
    return Promise.reject(
      new Error(`importSrc: explicit extension required (.ts/.js/.mjs/.json) — got "${relPath}"`),
    );
  }
  const abs = resolve(appRoot, relPath);
  if (!existsSync(abs)) {
    return Promise.reject(new Error(`importSrc: file not found — ${abs}`));
  }
  return import(pathToFileURL(abs).href);
}

async function main() {
// ─────────────────────────────────────────────────────────────────────────────
// المصادر
// ─────────────────────────────────────────────────────────────────────────────
const SITE = JSON.parse(await readFile(resolve(appRoot, "site.config.json"), "utf8"));
const SITE_URL = SITE.siteUrl;
const SITE_NAME = SITE.siteName;
const TITLE_SUFFIX = SITE.titleSuffix;
const DEFAULT_IMAGE = SITE.defaultImage;
const LOGO_IMAGE = SITE.logoImage || "/brand/official.png?v=20260815";
const ASSET_VERSION = SITE.assetVersion || "20260815";
const THEME_COLOR = SITE.themeColor || "#1F7A5A";
const THEME_COLOR_DARK = SITE.themeColorDark || "#4FB48B";
const OG_W = SITE.ogImageWidth || 1200;
const OG_H = SITE.ogImageHeight || 630;
const PRERENDER_NAV = Array.isArray(SITE.prerenderNav) && SITE.prerenderNav.length
  ? SITE.prerenderNav
  : [
      { path: "/", label: "الرئيسية" },
      { path: "/lessons", label: "الدروس" },
      { path: "/quran-hub", label: "القرآن" },
      { path: "/adhkar", label: "الأذكار" },
      { path: "/prayer-times", label: "الصلاة" },
      { path: "/fiqh", label: "الفقه" },
      { path: "/search", label: "البحث" },
    ];

function prerenderNavHtml() {
  return PRERENDER_NAV.map(
    (item) =>
      `<a href="${escapeHtml(absoluteUrl(item.path))}">${escapeHtml(item.label)}</a>`,
  ).join("\n        ");
}

const LESSONS_SEED = JSON.parse(await readFile(resolve(__dirname, "lessons-seed.snapshot.json"), "utf8"));
const PLATFORM_SEED = JSON.parse(await readFile(resolve(__dirname, "platform-seed.snapshot.json"), "utf8"));
// المصدر الوحيد لكتب المكتبة هو src/lib/library-catalog.ts (نفس ما تقرأه LibraryDetailPage.tsx فعليًا).
// كان هذا الملف يقرأ سابقًا من src/data/library-catalog.json وهي مرآة يدوية انحرفت (102 مقابل 117 سجلًا حيًا).
const { LIBRARY_CATALOG } = await importSrc("src/lib/library-catalog.ts");
const { loadEncyclopediaRulingsForSeo, rulingRichBody } = await import("./generate-seo-rulings-helpers.mjs");
const ENCYCLOPEDIA_RULINGS = await loadEncyclopediaRulingsForSeo(appRoot);

const seoConfigPath = resolve(appRoot, "src/lib/seo-routes.json");
const seoConfig = JSON.parse(await readFile(seoConfigPath, "utf8"));

if (
  seoConfig.siteUrl !== SITE_URL ||
  seoConfig.siteName !== SITE_NAME ||
  seoConfig.defaultImage !== DEFAULT_IMAGE
) {
  console.error(
    `❌ seo-routes.json يخالف site.config.json (siteUrl/siteName/defaultImage). صحّح seo-routes.json — site.config.json هو المصدر.`,
  );
  process.exit(1);
}

const { PROPHETS } = await importSrc("src/lib/prophets-data.ts");
const { NATIONS } = await importSrc("src/lib/nations-seed.ts");
const { SINS_TOPICS } = await importSrc("src/lib/sins-rights-data.ts");
const { getAllSurahStories } = await importSrc("src/lib/surah-stories.ts");
const { FIQH_ISSUES_PUBLISHED_SEED } = await importSrc("src/lib/fiqh-issues-seed.ts");
const { isPublicIssue, isVerifiedPublicItem } = await importSrc("src/lib/fiqh-council-trust.ts");
const { FIQH_COUNCIL_PUBLISHED_SEED } = await importSrc("src/lib/fiqh-council-seed.ts");
const { FIQH_ITEM_TYPE_LABELS } = await importSrc("src/lib/fiqh-council-types.ts");
const { SCHOLARS } = await importSrc("src/lib/scholars-data.ts");
const { ADHKAR_CATEGORIES, FEATURED_ADHKAR_SLUGS } = await importSrc("src/lib/adhkar-seed.ts");
const { MUEZZINS } = await importSrc("src/lib/adhan-audio.ts");

const QURAN_MANIFEST = JSON.parse(
  await readFile(resolve(appRoot, "public/data/quran/manifest.json"), "utf8"),
);
const QURAN_SURAHS = Array.isArray(QURAN_MANIFEST.surahs) ? QURAN_MANIFEST.surahs : [];
if (QURAN_SURAHS.length !== 114) {
  throw new Error(`manifest السور أعاد ${QURAN_SURAHS.length} بدل 114`);
}

const SURAH_STORIES = getAllSurahStories();
const PUBLIC_FIQH_ISSUES = FIQH_ISSUES_PUBLISHED_SEED.filter(isPublicIssue);
const PUBLIC_FIQH_ITEMS = FIQH_COUNCIL_PUBLISHED_SEED.filter(isVerifiedPublicItem);
const QURAN_PEOPLE_CATALOG = JSON.parse(
  await readFile(resolve(appRoot, "public/data/quran-people/people.json"), "utf8"),
);
const QURAN_PEOPLE = (QURAN_PEOPLE_CATALOG.people || []).filter((p) => p.status === "published");
if (!QURAN_PEOPLE.some((p) => p.slug === "azar" || p.nameAr === "آزر")) {
  throw new Error("قائمة الذين ذكروا في القرآن تفتقد آزر (الأنعام 6:74)");
}

function fiqhItemRichBody(row) {
  const kind = fiqhItemKind(row);
  const blocks = [];
  if (row.summary) blocks.push(`<h2>الملخّص</h2>\n<p>${escapeHtml(row.summary)}</p>`);
  if (row.ruling_text) blocks.push(`<h2>${kind === "بحث" ? "موقف المجمع" : "نص القرار"}</h2>\n<p>${escapeHtml(row.ruling_text)}</p>`);
  if (row.content) {
    const paras = String(row.content)
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p.replace(/\*\*/g, ""))}</p>`)
      .join("\n");
    if (paras) blocks.push(`<h2>التفاصيل</h2>\n${paras}`);
  }
  const meta = [
    row.decision_number ? `رقم القرار: ${escapeHtml(row.decision_number)}` : "",
    row.session_number ? `الدورة: ${escapeHtml(row.session_number)}` : "",
    row.session_date ? `التاريخ: ${escapeHtml(row.session_date)}` : "",
    row.council_name || row.source_name ? `المصدر: ${escapeHtml(row.council_name || row.source_name)}` : "",
  ].filter(Boolean);
  if (meta.length) blocks.push(`<h2>المرجع</h2>\n<ul>\n${meta.map((m) => `  <li>${m}</li>`).join("\n")}\n</ul>`);
  if (row.source_url) {
    blocks.push(`<p><a href="${escapeHtml(row.source_url)}" rel="noopener noreferrer">المصدر الرسمي</a></p>`);
  }
  return blocks.join("\n") || `<p>${escapeHtml(row.title)} — ${escapeHtml(kind)} موثّق من المجمع.</p>`;
}

// وسمُ مادّة المجمع يُشتقّ من حقل `type` في السجلّ نفسه لا يُثبَّت على «قرار»:
// من الأربعة القائمة في fiqh-council-seed.ts اثنان type: "research" نصَّ المجمع
// فيهما على أنه لم يبتّ (237 (24/8) أوصى بمزيد من البحث، و230 (24/1) أجّل البتّ)،
// فوسمُهما «قرار» إثباتُ ما نفاه المصدر. والمعجم FIQH_ITEM_TYPE_LABELS هو معجم
// المنصّة نفسه المستعمَل في العرض والتصدير والاستشهاد.
const fiqhItemKind = (row) => FIQH_ITEM_TYPE_LABELS[row?.type] || "مادة";

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

const TOPICS = await extractSlugTitlePairs("src/views/TopicsIndexPage.tsx", "STATIC_TOPICS", 40);

const { DURUS_IMANIYYA } = await importSrc("src/lib/durus-imaniyya-data.ts");
const { DURUS_MUTANAWWIA } = await importSrc("src/lib/durus-mutanawwia-data.ts");
const { IMAN_TOPICS } = await importSrc("src/lib/iman-topics-data.ts");
const { SUNNAH_STUDIES } = await importSrc("src/lib/sunnah-studies-data.ts");
const { TAZKIYA_TOPICS } = await importSrc("src/lib/tazkiya-topics-data.ts");
const { TARIKH_ISLAMI } = await importSrc("src/lib/tarikh-islami-data.ts");
const { USRA_MUJTAMA } = await importSrc("src/lib/usra-mujtama-data.ts");
const { FIKR_WAQIA } = await importSrc("src/lib/fikr-waqia-data.ts");
const { MAWSUAAT } = await importSrc("src/lib/mawsuaat-data.ts");
const { ARABIC_LANGUAGE } = await importSrc("src/lib/arabic-language-data.ts");
const { MAQASID_SHARIA } = await importSrc("src/lib/maqasid-sharia-data.ts");
const { DALAIL_NUBUWWAH } = await importSrc("src/lib/dalail-nubuwwah-data.ts");
const { getSeedLessonsForSlug } = await importSrc("src/lib/learn-library-aqeedah-batch3-seed.ts");

/** أقسام DarsSection → قائمة روابط مع عدد الدروس. */
function darsSectionsLinks(basePath, sections) {
  return (sections || []).map((s) => ({
    name: s.title,
    url: `${basePath}#${s.id}`,
    note: `${(s.lessons || []).length} درسًا`,
  }));
}

function darsHubBody(intro, basePath, sections, related) {
  return `<p>${intro}</p>
${linkList("أقسام المحتوى", darsSectionsLinks(basePath, sections))}
${related?.length ? linkList("روابط ذات صلة", related) : ""}`;
}

function learnSlugBody(intro, slug, related) {
  const lessons = getSeedLessonsForSlug(slug);
  const lessonLinks = lessons.map((l) => ({
    name: l.title,
    url: `/learn/lesson/${l.id}`,
    note: (l.description || "").slice(0, 90),
  }));
  return `<p>${intro}</p>
${linkList("دروس التصنيف", lessonLinks)}
${related?.length ? linkList("روابط ذات صلة", related) : ""}`;
}

const publicDir = resolve(appRoot, "public");
const seoPrerenderDir = resolve(appRoot, "seo-prerender");
// (أُزيل buildDate: كان مستهلَكه الوحيد <lastmod> في sitemap، وقد حُذف —
//  وبإزالته لم يبقَ في هذا المولّد أي مصدر غير حتمي.)

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

/** يوحّد النقط المتكررة في نهاية الوصف (خلل شائع: ".." من قوالب سابقة). */
function tidyDesc(text) {
  return String(text || "")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function padDesc(text, suffix) {
  const t = tidyDesc(text);
  if (!t) return suffix;
  return t.length >= 50 ? t : `${t}، ${suffix}`;
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

/** تسمية مصدر القراءة/التحميل من المضيف — يُرجع null إن لم يتوفر رابط صالح. */
function librarySourceLabel(url) {
  if (!url) return null;
  try {
    const host = new URL(String(url)).hostname.replace(/^www\./i, "");
    return host || null;
  } catch {
    return null;
  }
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
  const rawSheikh = String(row.speaker_name || "").trim();
  // لا تُسبق بـ«الشيخ:» إن كان الاسم يحمل لقبًا أصلًا — يمنع «الشيخ: الشيخ …»
  const sheikhAlreadyTitled =
    /^(?:الشيخة?|الدكتور(?:ة)?|الأستاذ(?:ة)?|القارئ|د\.)\b/u.test(rawSheikh);
  const sheikhBit = rawSheikh
    ? sheikhAlreadyTitled
      ? rawSheikh
      : `الشيخ: ${rawSheikh}`
    : "";
  const place = row.mosque || row.region || "";
  const base = [sheikhBit, place ? `المكان: ${place}` : "", row.schedule || ""]
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
    logo: absoluteUrl(LOGO_IMAGE),
    image: absoluteUrl(DEFAULT_IMAGE),
    inLanguage: "ar",
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_IMAGE),
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
    // وصف Person كامل — القصّ للـmeta فقط (D1)
    description: String(s.bio || "").replace(/\s+/g, " ").trim(),
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
  const hubParents = IA_BREADCRUMB_PARENTS[route.path];
  if (hubParents?.length) {
    items.push(...hubParents);
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

const HEAD_ASSETS = `<link rel="icon" href="/favicon.ico?v=${ASSET_VERSION}" sizes="any" />
    <link rel="icon" type="image/png" href="/icon-512.png?v=${ASSET_VERSION}" sizes="512x512" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=${ASSET_VERSION}" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`;

/**
 * D1: فصل حقول المحتوى
 * - metaDescription / description → وسوم meta فقط (يجوز اختصارها بـ …)
 * - body → النص الظاهر الكامل
 * - summary → مقدمة ظاهرة قصيرة (بدون قصّ meta)
 * - richBody → HTML منظم إضافي
 * لا يُعاد استخدام وصف الـmeta المقصوص في الفقرة المرئية.
 */
function visibleLeadHtml(route, richBody) {
  const body = String(route.body || "").trim();
  if (body) return `<p>${escapeHtml(body)}</p>`;
  const summary = String(route.summary || "").trim();
  if (summary) return `<p>${escapeHtml(summary)}</p>`;
  // صفحات بلا richBody: الوصف الساكن هو المحتوى الظاهر (غير مقصوص عادةً)
  if (!richBody) {
    const d = String(route.description || "").trim();
    if (d && !d.endsWith("…") && !d.endsWith("...")) return `<p>${escapeHtml(d)}</p>`;
  }
  return "";
}

function prerenderHtml(route, extraJsonLd = "", richBody = "", parents = []) {
  const canonical = absoluteUrl(route.path);
  const image = absoluteUrl(route.image || DEFAULT_IMAGE);
  // meta keywords أُلغيت نهائيًا (A0 / الجولة الثالثة) — محركات البحث لا تعتمد عليها والحشو يضر.
  const robots = route.robots || "index, follow";
  const ogType = route.ogType || "website";
  const title = pageTitle(route);
  const h1 = String(route.title || "").split(" | ")[0];
  const metaDescription = String(route.metaDescription || route.description || "").trim();
  const leadHtml = visibleLeadHtml(route, richBody);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(metaDescription)}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="author" content="${escapeHtml(SITE_NAME)}" />
    <meta name="theme-color" content="${escapeHtml(THEME_COLOR)}" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="${escapeHtml(THEME_COLOR)}" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="${escapeHtml(THEME_COLOR_DARK)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="ar" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}" />
    ${HEAD_ASSETS}
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:locale" content="ar_KW" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(metaDescription)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="${OG_W}" />
    <meta property="og:image:height" content="${OG_H}" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    ${route.path === "/" ? siteJsonLdScript() : jsonLdScript({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: h1,
      description: metaDescription,
      url: canonical,
      inLanguage: "ar",
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: absoluteUrl(LOGO_IMAGE) },
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
        ${leadHtml}
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

const FEATURED_ADHKAR = ADHKAR_CATEGORIES.filter((c) => FEATURED_ADHKAR_SLUGS.has(c.slug));

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
    PUBLIC_FIQH_ITEMS.map((r) => ({ name: r.title, url: `/fiqh-council/${r.slug || r.id}` })),
    "قرارات المجمع الفقهي",
  ),
  "/quiz": itemListJsonLdScript(
    (PLATFORM_SEED.qa_items || []).slice(0, 24).map((r) => ({ name: r.question, url: `/quiz` })),
    "أسئلة لعبة سين جيم",
  ),
  "/lessons": itemListJsonLdScript(lessonRows.slice(0, 30).map((r) => ({ name: r.title, url: `/lessons/${r.id}` })), "الدروس الشرعية"),
  "/adhkar": itemListJsonLdScript(FEATURED_ADHKAR.map((c) => ({ name: c.name, url: `/adhkar/${c.slug}` })), "أقسام الأذكار"),
  "/prophets": itemListJsonLdScript(
    PROPHETS.map((p) => ({ name: `قصة نبي الله ${p.arabicName} عليه السلام`, url: `/prophets/${p.slug}` })),
    "قصص الأنبياء",
  ),
  "/nations": itemListJsonLdScript(
    NATIONS.map((n) => ({ name: n.name, url: `/nations/${n.slug}` })),
    "الأمم السابقة",
  ),
  "/quran/people": itemListJsonLdScript(
    QURAN_PEOPLE.map((p) => ({ name: p.nameAr, url: `/quran/people/${p.slug}` })),
    "الذين ذكروا في القرآن",
  ),
  "/scholars": itemListJsonLdScript(SCHOLARS.map((s) => ({ name: s.name, url: `/scholars/${s.id}` })), "أعلام العلماء المسلمين"),
  "/topics": itemListJsonLdScript(TOPICS.map((t) => ({ name: t.title, url: `/topics/${t.slug}` })), "المواضيع الإسلامية"),
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
  "/quran/surahs": itemListJsonLdScript(
    QURAN_SURAHS.map((s) => ({ name: s.name, url: `/quran/surahs#surah-${s.number}` })),
    "فهرس سور القرآن الكريم",
  ),
};

const UNIVERSITIES_CATALOG = JSON.parse(
  await readFile(resolve(appRoot, "src/data/universities-catalog.json"), "utf8"),
);
const UNIVERSITY_ROWS = Array.isArray(UNIVERSITIES_CATALOG) ? UNIVERSITIES_CATALOG : [];

function buildUniversitiesRichBody() {
  const countryCounts = new Map();
  for (const u of UNIVERSITY_ROWS) {
    const c = String(u.country || "").trim();
    if (!c) continue;
    countryCounts.set(c, (countryCounts.get(c) || 0) + 1);
  }
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ar"))
    .slice(0, 8);
  const sample = UNIVERSITY_ROWS.slice(0, 6);
  return [
    `<p>يضم الدليل حالياً <strong>${UNIVERSITY_ROWS.length}</strong> جامعة/كلية من بيانات موثّقة في الكتالوج.</p>`,
    `<h2>الدول المتوفرة</h2>`,
    `<ul>${topCountries.map(([c, n]) => `<li>${escapeHtml(c)} (${n})</li>`).join("")}</ul>`,
    `<h2>عينة من الجامعات</h2>`,
    `<ul>${sample
      .map(
        (u) =>
          `<li><a href="${SITE_URL}/universities/${encodeURIComponent(u.slug)}">${escapeHtml(u.name_ar)}</a> — ${escapeHtml(u.country || "")}</li>`,
      )
      .join("")}</ul>`,
    `<p><a href="${SITE_URL}/universities/compare">مقارنة الجامعات</a> · استخدم الفلاتر في الصفحة لاختيار الدولة عند التوفر.</p>`,
  ].join("\n");
}

const RICH_BODY_MAP = {
  "/universities": buildUniversitiesRichBody(),
  "/universities/compare": `<p>أداة لمقارنة الجامعات الشرعية بناءً على الحقول المتوفرة في الكتالوج فقط (الاسم، الدولة، المدينة، البرامج الموثّقة، الموقع الرسمي عند وجوده).</p>
<h2>ما يمكن مقارنته</h2>
<ul>
<li>الدولة والمدينة</li>
<li>البرامج والتخصصات المسجّلة في الكتالوج</li>
<li>الموقع الرسمي عند توفره</li>
</ul>
<p>اختر جامعتين أو أكثر من دليل الجامعات ثم افتح هذه الصفحة. لا تُعرض بيانات وهمية قبل الاختيار.</p>
<p><a href="${SITE_URL}/universities">العودة إلى دليل الجامعات</a></p>`,

  "/lessons": linkList(
    "أبرز الدروس والدورات",
    lessonRows.slice(0, 15).map((r) => ({ name: r.title, url: `/lessons/${r.id}`, note: r.speaker_name })),
  ),
  "/library": linkList(
    "من الكتب المتاحة",
    LIBRARY_CATALOG.slice(0, 15).map((b) => ({ name: b.title, url: `/library/${b.id}`, note: b.author })),
  ),
  "/adhkar": `${linkList(
    "أقسام الأذكار",
    FEATURED_ADHKAR.map((c) => ({ name: c.name, url: `/adhkar/${c.slug}` })),
  )}
<p>أذكار الصباح والمساء والنوم والصلاة والسفر وغيرها — نصوص مختارة مع بيان المصدر قدر الإمكان. يمكن أيضًا الانتقال إلى الأدعية الموثقة والتسبيح اليومي.</p>
${linkList("روابط ذات صلة", [
  { name: "الأدعية الشرعية", url: "/duas" },
  { name: "السنن اليومية", url: "/sunan-yawmiyya" },
  { name: "أدعية القرآن", url: "/duas-quran" },
])}`,
  "/scholars": linkList(
    "من علماء المسلمين",
    SCHOLARS.slice(0, 30).map((s) => ({ name: s.name, url: `/scholars/${s.id}`, note: s.died })),
  ),
  "/quiz": linkList(
    "من أسئلة سين جيم",
    (PLATFORM_SEED.qa_items || []).slice(0, 12).map((q) => ({ name: q.question, url: `/quiz` })),
  ),
  "/prophets": linkList(
    "قصص الأنبياء",
    PROPHETS.map((p) => ({ name: `نبي الله ${p.arabicName} عليه السلام`, url: `/prophets/${p.slug}` })),
  ),
  "/nations": `<p>الأمم والأقوام المذكورون في القرآن: ما ثبت من دعوتهم وذنبهم وعاقبتهم، مع تمييز التفسير المحتمل والمواقع التقريبية التي لا يُجزم بها، ودون خلط بين الناجين من العذاب والمؤمنين المذكورين في القصة.</p>
${linkList(
  "من الأمم السابقة",
  NATIONS.map((n) => ({ name: n.name, url: `/nations/${n.slug}`, note: n.prophet?.name })),
)}
${linkList("روابط ذات صلة", [
  { name: "قصص الأنبياء", url: "/prophets" },
  { name: "الذين ذكروا في القرآن", url: "/quran/people" },
  { name: "قصص السور", url: "/quran/surah-stories" },
  { name: "مركز القرآن", url: "/quran-hub" },
])}`,
  "/quran/people": `<p>فهرس من ذُكروا في القرآن بأسمائهم أو أوصافهم، مع مواضع الآيات والربط بقصص الأنبياء، والاقتصار على ما ثبت دون إسرائيليات مجزوم بها.</p>
${linkList(
  "من الذين ذكروا في القرآن",
  QURAN_PEOPLE.slice(0, 40).map((p) => ({ name: p.nameAr, url: `/quran/people/${p.slug}` })),
)}
${linkList("روابط ذات صلة", [
  { name: "قصص الأنبياء", url: "/prophets" },
  { name: "الأمم السابقة", url: "/nations" },
  { name: "المصحف", url: "/mushaf" },
  { name: "مركز القرآن", url: "/quran-hub" },
])}`,
  "/topics": linkList("المواضيع الإسلامية", TOPICS.map((t) => ({ name: t.title, url: `/topics/${t.slug}` }))),
  "/quran/surah-stories": linkList(
    "قصص السور",
    SURAH_STORIES.slice(0, 30).map((s) => ({ name: `سورة ${s.name}`, url: `/quran/surah-stories/${s.number}` })),
  ),
  "/quran/surahs": linkList(
    "سور القرآن الكريم الـ114",
    QURAN_SURAHS.map((s) => ({
      name: s.name,
      url: `/mushaf/${s.number}`,
      note: `${s.numberOfAyahs} آية`,
    })),
  ),
  "/sins-and-rights": linkList("موضوعات الذنوب والحقوق", SINS_TOPICS.map((t) => ({ name: t.title, url: `/sins-and-rights/${t.slug}` }))),
  "/fiqh-council/issues": linkList(
    "المسائل الفقهية المعاصرة",
    PUBLIC_FIQH_ISSUES.slice(0, 25).map((i) => ({ name: i.title, url: `/fiqh-council/issues/${i.slug}` })),
  ),
  "/fiqh": `<p>بوابة الفقه الإسلامي: أحكام العبادات والمعاملات، المذاهب الأربعة، القواعد الفقهية، وقرارات المجامع — مع إحالة المسائل المعاصرة إلى مصادرها المعتمدة.</p>
${linkList("أقسام الفقه", [
  { name: "المجمع الفقهي", url: "/fiqh-council", note: "قرارات وفتاوى مؤسسية" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "النوازل المعاصرة", url: "/fiqh-council/nawazil" },
  { name: "القواعد الفقهية", url: "/fiqh-qawaid" },
  { name: "المذاهب الأربعة", url: "/madhahib" },
  { name: "الأسئلة والأجوبة", url: "/quiz" },
  { name: "الطهارة", url: "/tahara" },
  { name: "دليل الصلاة", url: "/salah-guide" },
  { name: "الزكاة", url: "/zakat" },
  { name: "الصيام", url: "/sawm" },
  { name: "الحج والعمرة", url: "/hajj" },
])}`,
  "/quran-hub": `<p>مركز القرآن الكريم: المصحف الرقمي، فهرس السور، التجويد، القصص، علوم القرآن، والتحفيظ — مدخل موحّد لخدمات القراءة والتعلّم.</p>
${linkList("خدمات القرآن", [
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "بحث في الآيات", url: "/quran/search" },
  { name: "فهرس السور", url: "/quran/surahs" },
  { name: "أحكام التجويد", url: "/quran-hub/tajweed" },
  { name: "قصص السور", url: "/quran/surah-stories" },
  { name: "مكّي ومدني", url: "/quran/makki-madani" },
  { name: "ترتيب النزول", url: "/quran/revelation-order" },
  { name: "خطط الحفظ", url: "/quran/memorization-plans" },
  { name: "علوم القرآن", url: "/ulum-quran" },
  { name: "دراسات قرآنية", url: "/quran-studies" },
  { name: "أدعية القرآن", url: "/duas-quran" },
  { name: "اختبار التلاوة", url: "/quran/recitation-test-ai" },
])}`,
  "/hadith-science": `<p>مدخل إلى مصطلح الحديث ودرجاته وكتب الرواية، مع روابط إلى مكتبات الأحاديث الصحيحة والضعيفة والموضوعة والأربعين النووية.</p>
${linkList("علوم الحديث وروابطه", [
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "الأحاديث الصحيحة", url: "/hadith/sahih" },
  { name: "الأحاديث الضعيفة", url: "/hadith/daif" },
  { name: "الأحاديث الموضوعة", url: "/hadith/mawdu" },
  { name: "كتب الحديث", url: "/hadith/books" },
  { name: "الأربعون النووية", url: "/arbaeen-nawawi" },
  { name: "صحيح البخاري (المكتبة)", url: "/library/book-bukhari" },
  { name: "صحيح مسلم (المكتبة)", url: "/library/book-muslim" },
])}`,
  "/islamic-glossary": `<p>معجم مبسّط لمصطلحات العلوم الشرعية: فقه، حديث، عقيدة، وأصول — لتعريف الطالب بالمفردات الشائعة قبل التوسّع في الأبواب.</p>
${linkList("روابط ذات صلة", [
  { name: "الأقسام", url: "/sections" },
  { name: "القواعد الفقهية", url: "/fiqh-qawaid" },
  { name: "المذاهب الأربعة", url: "/madhahib" },
  { name: "علوم الحديث", url: "/hadith-science" },
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
])}`,
  "/rulings": `<p>أُعيد توجيه هذا المسار إلى <a href="${escapeHtml(absoluteUrl("/fiqh"))}">بوابة الفقه</a>. موسوعة الأحكام الشرعية مؤرشفة حتى اكتمال المراجعة العلمية.</p>
<meta http-equiv="refresh" content="0;url=${escapeHtml(absoluteUrl("/fiqh"))}" />
${linkList("أقسام ذات صلة", [
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "القواعد الفقهية", url: "/fiqh-qawaid" },
  { name: "المذاهب الأربعة", url: "/madhahib" },
  { name: "الأسئلة والأجوبة", url: "/quiz" },
  { name: "الطهارة", url: "/tahara" },
  { name: "دليل الصلاة", url: "/salah-guide" },
  { name: "الزكاة", url: "/zakat" },
  { name: "الصيام", url: "/sawm" },
  { name: "الحج والعمرة", url: "/hajj" },
])}`,
  "/hadith": `<p>مكتبة الأحاديث النبوية: صحيح وضعيف وموضوع، مع مداخل إلى كتب الرواية والأربعين النووية وعلوم الحديث.</p>
${linkList("أقسام الأحاديث", [
  { name: "الأحاديث الصحيحة", url: "/hadith/sahih" },
  { name: "الأحاديث الضعيفة", url: "/hadith/daif" },
  { name: "الأحاديث الموضوعة", url: "/hadith/mawdu" },
  { name: "كتب الحديث", url: "/hadith/books" },
  { name: "كتب الحديث وأحكامها", url: "/hadith/books-and-rulings" },
  { name: "الأربعون النووية", url: "/arbaeen-nawawi" },
  { name: "أربعون في محبة الله", url: "/hadith/arbaeen-love-of-allah" },
  { name: "علوم الحديث", url: "/hadith-science" },
])}
${linkList("من كتب الحديث في المكتبة", [
  { name: "صحيح البخاري", url: "/library/book-bukhari" },
  { name: "صحيح مسلم", url: "/library/book-muslim" },
  { name: "رياض الصالحين", url: "/library/book-riyadh" },
  { name: "الأربعون النووية (المكتبة)", url: "/library/book-nawawi40" },
])}`,
  "/fawaid": `<p>فوائد علمية مختصرة وموثّقة في القرآن والحديث والعقيدة والفقه والتربية والدعوة والآداب — للانتفاع السريع مع الإحالة إلى المصدر.</p>
${linkList(
  "تصنيفات الفوائد",
  [
    "فوائد قرآنية",
    "فوائد حديثية",
    "فوائد عقدية",
    "فوائد فقهية",
    "فوائد تربوية",
    "فوائد دعوية",
    "آداب وأخلاق",
  ].map((c) => ({ name: c, url: `/fawaid?cat=${encodeURIComponent(c)}` })),
)}
${linkList("روابط ذات صلة", [
  { name: "الأقسام", url: "/sections" },
  { name: "الأذكار", url: "/adhkar" },
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
])}`,
  "/duas": `<p>أدعية شرعية مختارة من الكتاب والسنة: أدعية الصباح والمساء والصلاة والسفر والكرب والنوم، مع إحالة إلى الأذكار والسنن اليومية.</p>
${linkList(
  "من الأدعية",
  DUAS_SEED.slice(0, 16).map((d) => ({ name: d.title, url: `/duas#${d.id}` })),
)}
${linkList("روابط ذات صلة", [
  { name: "موسوعة الأذكار", url: "/adhkar" },
  { name: "السنن اليومية", url: "/sunan-yawmiyya" },
  { name: "أدعية القرآن", url: "/duas-quran" },
  { name: "الورد اليومي", url: "/daily-wird" },
  { name: "عداد التسبيح", url: "/tasbih" },
])}`,
  "/asma-husna": `<p>أسماء الله الحسنى ومعانيها — مدخل لتعظيم الله ومعرفة أسمائه وصفاته، مع نماذج من الأسماء ومعانيها.</p>
${linkList(
  "من الأسماء الحسنى",
  ASMAA_HUSNA.map((a) => ({ name: `${a.arabic} — ${a.meaning}`, url: `/asma-husna#name-${a.num}` })),
)}
${linkList("روابط ذات صلة", [
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "الأذكار", url: "/adhkar" },
  { name: "الأدعية الشرعية", url: "/duas" },
])}`,
  "/annual-courses": `<p>الدورات العلمية السنوية والموسمية: برامج مرتّبة بمشايخ وجداول، مع روابط إلى الدروس والمسارات.</p>
${linkList(
  "من الدورات",
  (PLATFORM_SEED.courses || []).slice(0, 12).map((c) => ({
    name: c.title || c.name,
    url: `/annual-courses/${c.id}`,
  })),
)}
${linkList("روابط ذات صلة", [
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
])}`,
  "/tahara": `<p>أحكام الطهارة: الوضوء والغسل والتيمم وإزالة النجاسة — مدخل عملي قبل أبواب الصلاة والعبادات.</p>
${linkList("روابط ذات صلة", [
  { name: "دليل الصلاة", url: "/salah-guide" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "الزكاة", url: "/zakat" },
  { name: "الصيام", url: "/sawm" },
  { name: "الحج والعمرة", url: "/hajj" },
  { name: "أحكام الجنائز", url: "/janaza" },
])}`,
  "/zakat": `<p>الزكاة: شروط الوجوب والأنصبة والمصارف، مع ربط بأحكام العبادات الأخرى والمسائل المعاصرة عند الحاجة.</p>
${linkList("روابط ذات صلة", [
  { name: "الطهارة", url: "/tahara" },
  { name: "الصيام", url: "/sawm" },
  { name: "الحج والعمرة", url: "/hajj" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "المجمع الفقهي", url: "/fiqh-council" },
])}`,
  "/sawm": `<p>الصيام وأحكامه: رمضان والقضاء والكفارات والنوافل، مع إحالات إلى الأذكار والعبادات المرتبطة.</p>
${linkList("روابط ذات صلة", [
  { name: "الزكاة", url: "/zakat" },
  { name: "الحج والعمرة", url: "/hajj" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "الأذكار", url: "/adhkar" },
  { name: "فضائل الأعمال", url: "/fadail-aamal" },
  { name: "بوابة الفقه", url: "/fiqh" },
])}`,
  "/hajj": `<p>الحج والعمرة: الأركان والواجبات والسنن والمخالفات، مع روابط إلى الطهارة والأحكام ذات الصلة.</p>
${linkList("روابط ذات صلة", [
  { name: "الطهارة", url: "/tahara" },
  { name: "الزكاة", url: "/zakat" },
  { name: "الصيام", url: "/sawm" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "المناسبات الإسلامية", url: "/occasions" },
])}`,
  "/tawhid": `<p>العقيدة والتوحيد: توحيد الربوبية والألوهية والأسماء والصفات، مع مداخل إلى الفرق والآداب العقدية.</p>
${linkList("روابط ذات صلة", [
  { name: "أسماء الله الحسنى", url: "/asma-husna" },
  { name: "علامات الساعة", url: "/alamat-saah" },
  { name: "صفة الجنة والنار", url: "/janna-naar" },
  { name: "التوبة والاستغفار", url: "/tawba" },
  { name: "المعجم الشرعي", url: "/islamic-glossary" },
  { name: "الأقسام", url: "/sections" },
])}`,
  "/adab-talab-ilm": `<p>آداب طالب العلم: الإخلاص، التدرّج، احترام الشيوخ، ومنهجية الطلب — مدخل قبل المسارات والدروس.</p>
${linkList("روابط ذات صلة", [
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "المكتبة العلمية", url: "/library" },
  { name: "أعلام العلماء", url: "/scholars" },
  { name: "الفوائد", url: "/fawaid" },
  { name: "مكارم الأخلاق", url: "/akhlaq" },
])}`,
  "/akhlaq": `<p>مكارم الأخلاق في الكتاب والسنة: الصدق والحياء والصبر وحسن الخلق، مع ربط بالرقائق والوصايا النبوية.</p>
${linkList("روابط ذات صلة", [
  { name: "الرقائق والزهد", url: "/raqaiq" },
  { name: "الوصايا النبوية", url: "/wasaya-nabawiyya" },
  { name: "فضائل الأعمال", url: "/fadail-aamal" },
  { name: "التوبة والاستغفار", url: "/tawba" },
  { name: "الفوائد", url: "/fawaid" },
  { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
])}`,
  "/arbaeen-nawawi": `<p>الأربعون النووية: أحاديث جامعة في أصول الدين والعمل، مع ربط بعلوم الحديث ومكتبة الأحاديث.</p>
${linkList("روابط ذات صلة", [
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "علوم الحديث", url: "/hadith-science" },
  { name: "الأربعون في المكتبة", url: "/library/book-nawawi40" },
  { name: "أربعون في محبة الله", url: "/hadith/arbaeen-love-of-allah" },
  { name: "رياض الصالحين", url: "/library/book-riyadh" },
])}`,
  "/raqaiq": `
<p>الرقائق والزهد: نصوص تُرقّق القلب وتذكّر بالآخرة، مع إحالات إلى الأخلاق والتوبة وفضائل الأعمال.</p>
<p>صفحة الرقائق تجمع مواعظ مختارة ومقاطع زهدية مرتبطة بمصادرها قدر الإمكان، لتكون مدخلاً للرقّة والمحاسبة لا بديلاً عن الكتب المطوّلة.</p>
${linkList("روابط ذات صلة", [
  { name: "مكارم الأخلاق", url: "/akhlaq" },
  { name: "التوبة والاستغفار", url: "/tawba" },
  { name: "فضائل الأعمال", url: "/fadail-aamal" },
  { name: "الوصايا النبوية", url: "/wasaya-nabawiyya" },
  { name: "الفوائد", url: "/fawaid" },
])}`,
  "/janaza": `<p>أحكام الجنائز: تغسيل الميت وتكفينه والصلاة عليه والدفن والتعزية — مرتبطة بباب الطهارة والفقه.</p>
${linkList("روابط ذات صلة", [
  { name: "الطهارة", url: "/tahara" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "التوبة والاستغفار", url: "/tawba" },
  { name: "صفة الجنة والنار", url: "/janna-naar" },
])}`,
  "/prophetic-medicine": `<p>الطب النبوي: هدي النبي ﷺ في الوقاية والعلاج والغذاء، مع تمييز ما ثبت وما يحتاج تحقيقًا.</p>
${linkList("روابط ذات صلة", [
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "السيرة والشمائل", url: "/shamael" },
  { name: "فضائل الأعمال", url: "/fadail-aamal" },
  { name: "السنن اليومية", url: "/sunan-yawmiyya" },
])}`,
  "/anbiya": `<p>الأنبياء والرسل: قصصهم ودعوتهم عبر القرآن، مع مدخل إلى شجرة الأنبياء وقصص السور.</p>
${linkList("روابط ذات صلة", [
  { name: "قصص الأنبياء", url: "/prophets" },
  { name: "شجرة الأنبياء", url: "/prophets/tree" },
  { name: "قصص السور", url: "/quran/surah-stories" },
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "علامات الساعة", url: "/alamat-saah" },
])}`,
  "/tajweed": `<p>علم التجويد: مخارج الحروف والصفات وأحكام النون والميم والمدود — لتجويد التلاوة مع خدمات القرآن.</p>
${linkList("روابط ذات صلة", [
  { name: "أحكام التجويد (قسم القرآن)", url: "/quran-hub/tajweed" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "فهرس السور", url: "/quran/surahs" },
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "اختبار التلاوة", url: "/quran/recitation-test-ai" },
])}`,
  "/fadail-aamal": `<p>فضائل الأعمال: ما ورد في فضل الصلاة والذكر والصدقة وطلب العلم، مع ربط بالأذكار والفوائد.</p>
${linkList("روابط ذات صلة", [
  { name: "الأذكار", url: "/adhkar" },
  { name: "الفوائد", url: "/fawaid" },
  { name: "السنن اليومية", url: "/sunan-yawmiyya" },
  { name: "مكارم الأخلاق", url: "/akhlaq" },
  { name: "الرقائق والزهد", url: "/raqaiq" },
])}`,
  "/wasaya-nabawiyya": `<p>الوصايا النبوية الجامعة: جوامع الكلم في الأدب والعمل والعقيدة، مع إحالات إلى الأحاديث والأخلاق.</p>
${linkList("روابط ذات صلة", [
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "الأربعون النووية", url: "/arbaeen-nawawi" },
  { name: "مكارم الأخلاق", url: "/akhlaq" },
  { name: "الرقائق والزهد", url: "/raqaiq" },
])}`,
  "/alamat-saah": `<p>علامات الساعة الصغرى والكبرى كما وردت في النصوص، مع ربط بباب العقيدة وقصص الأنبياء.</p>
${linkList("روابط ذات صلة", [
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "صفة الجنة والنار", url: "/janna-naar" },
  { name: "الأنبياء والرسل", url: "/anbiya" },
  { name: "الأحاديث النبوية", url: "/hadith" },
])}`,
  "/janna-naar": `<p>صفة الجنة والنار وما أعدّ الله لأهل كل دار، من نصوص الكتاب والسنة، ضمن أبواب العقيدة.</p>
${linkList("روابط ذات صلة", [
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "علامات الساعة", url: "/alamat-saah" },
  { name: "التوبة والاستغفار", url: "/tawba" },
  { name: "الرقائق والزهد", url: "/raqaiq" },
])}`,
  "/tawba": `<p>التوبة والاستغفار: شروط التوبة النصوح وفضائل الاستغفار، مع ربط بالأذكار والرقائق.</p>
${linkList("روابط ذات صلة", [
  { name: "الأذكار", url: "/adhkar" },
  { name: "الأدعية الشرعية", url: "/duas" },
  { name: "الرقائق والزهد", url: "/raqaiq" },
  { name: "مكارم الأخلاق", url: "/akhlaq" },
  { name: "التوحيد والعقيدة", url: "/tawhid" },
])}`,
  "/daily-wird": `
<p>تتبّع وردك اليومي من القرآن الكريم، حدّد هدفك اليومي من الصفحات وتابع تقدمك نحو ختم القرآن.</p>
<p>الورد اليومي أداة عملية للتلاوة المنتظمة مع ربط بالأذكار والقرآن، دون اختراع محتوى قرآني جديد.</p>
${linkList("روابط ذات صلة", [
  { name: "الأذكار", url: "/adhkar" },
  { name: "الأدعية الشرعية", url: "/duas" },
  { name: "السنن اليومية", url: "/sunan-yawmiyya" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "مركز القرآن", url: "/quran-hub" },
])}`,
  "/occasions": `<p>المناسبات الإسلامية وما يُشرع فيها من عبادات وأذكار، مع ربط بالحج والصيام والمواضيع ذات الصلة.</p>
${linkList("روابط ذات صلة", [
  { name: "الحج والعمرة", url: "/hajj" },
  { name: "الصيام", url: "/sawm" },
  { name: "الأذكار", url: "/adhkar" },
  { name: "فضائل الأعمال", url: "/fadail-aamal" },
  { name: "الأقسام", url: "/sections" },
])}`,
  "/madhahib": `<p>المذاهب الأربعة: أصولها وأبرز أئمتها وكتبها، مدخل للمقارنة الفقهية قبل التوسع في المسائل.</p>
${linkList("روابط ذات صلة", [
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "القواعد الفقهية", url: "/fiqh-qawaid" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "أعلام العلماء", url: "/scholars" },
  { name: "الفقه على المذاهب الأربعة (المكتبة)", url: "/library/book-al-fiqh-ala-madhahib-al-arba" },
  { name: "المعجم الشرعي", url: "/islamic-glossary" },
])}`,
  "/fiqh-qawaid": `<p>القواعد الفقهية الكلية وما يتفرع عنها، لضبط الاستنباط وفهم الخلاف — مع ربط بالمذاهب والأحكام.</p>
${linkList("روابط ذات صلة", [
  { name: "المذاهب الأربعة", url: "/madhahib" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "المعجم الشرعي", url: "/islamic-glossary" },
])}`,
  "/fiqh-council": `<p>المجمع الفقهي الإسلامي: قرارات وفتاوى ومسائل معاصرة ونوازل، مع أدوات بحث ومقارنة وأرشيف.</p>
${linkList(
  "من مواد المجمع",
  PUBLIC_FIQH_ITEMS.slice(0, 12).map((r) => ({
    name: `${r.title} (${fiqhItemKind(r)})`,
    url: `/fiqh-council/${r.slug || r.id}`,
  })),
)}
${linkList("أقسام المجمع", [
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "النوازل المعاصرة", url: "/fiqh-council/nawazil" },
  { name: "الفتاوى", url: "/fiqh-council/fatwas" },
  { name: "القرارات/التوصيات", url: "/fiqh-council/resolutions" },
  { name: "التصنيفات", url: "/fiqh-council/categories" },
  { name: "الأرشيف", url: "/fiqh-council/archive" },
  { name: "بوابة الفقه", url: "/fiqh" },
])}`,
  "/sunan-yawmiyya": `<p>السنن اليومية الثابتة عن النبي ﷺ في الطعام واللباس والنوم والدخول والخروج، مع ربط بالأذكار والأدعية.</p>
${linkList("روابط ذات صلة", [
  { name: "الأذكار", url: "/adhkar" },
  { name: "الأدعية الشرعية", url: "/duas" },
  { name: "الورد اليومي", url: "/daily-wird" },
  { name: "فضائل الأعمال", url: "/fadail-aamal" },
  { name: "الأحاديث النبوية", url: "/hadith" },
])}`,
  "/duas-quran": `<p>أدعية القرآن الكريم كما وردت في السور، للتعبّد والتدبّر، مع ربط بالمصحف ومركز القرآن.</p>
${linkList("روابط ذات صلة", [
  { name: "الأدعية الشرعية", url: "/duas" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "الأذكار", url: "/adhkar" },
  { name: "علوم القرآن", url: "/ulum-quran" },
])}`,
  "/ulum-quran": `<p>علوم القرآن: النزول والجمع والقراءات والمكي والمدني وأسباب النزول — مدخل قبل التفسير والدراسات.</p>
${linkList("روابط ذات صلة", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "مكّي ومدني", url: "/quran/makki-madani" },
  { name: "ترتيب النزول", url: "/quran/revelation-order" },
  { name: "قصص السور", url: "/quran/surah-stories" },
  { name: "دراسات قرآنية", url: "/quran-studies" },
  { name: "فهرس السور", url: "/quran/surahs" },
])}`,
  "/salah-guide": `<p>دليل الصلاة الكامل: الشروط والأركان والواجبات والسنن وما يبطلها، مع ربط بالطهارة وأحكام الجنائز.</p>
${linkList("روابط ذات صلة", [
  { name: "الطهارة", url: "/tahara" },
  { name: "مراتب الناس في الصلاة", url: "/prayer-ranks" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "الأذكار", url: "/adhkar" },
  { name: "أركان الإسلام", url: "/arkan" },
])}`,
  "/arkan": `<p>أركان الإسلام الخمسة: الشهادتان والصلاة والزكاة والصوم والحج — مدخل تأسيسي قبل التفصيل الفقهي.</p>
${linkList("روابط ذات صلة", [
  { name: "أركان الإيمان", url: "/arkan-iman" },
  { name: "دليل الصلاة", url: "/salah-guide" },
  { name: "الزكاة", url: "/zakat" },
  { name: "الصيام", url: "/sawm" },
  { name: "الحج والعمرة", url: "/hajj" },
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "الدروس والدورات", url: "/lessons" },
])}`,
  "/arkan-iman": `<p>أركان الإيمان الستة: الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر — أساس باب العقيدة.</p>
${linkList("روابط ذات صلة", [
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "الملائكة", url: "/malaika" },
  { name: "الأنبياء والرسل", url: "/anbiya" },
  { name: "أركان الإسلام", url: "/arkan" },
  { name: "علامات الساعة", url: "/alamat-saah" },
  { name: "صفة الجنة والنار", url: "/janna-naar" },
])}`,
  "/malaika": `<p>الملائكة في الإسلام: صفاتهم ووظائفهم والإيمان بهم، ضمن أركان الإيمان والعقيدة.</p>
${linkList("روابط ذات صلة", [
  { name: "أركان الإيمان", url: "/arkan-iman" },
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "الأنبياء والرسل", url: "/anbiya" },
  { name: "المعجم الشرعي", url: "/islamic-glossary" },
])}`,
  "/shamael": `<p>شمائل النبي ﷺ: صفته الخَلقية والخُلقية وهديه في المعاش، مع ربط بالسيرة والأحاديث.</p>
${linkList("روابط ذات صلة", [
  { name: "السيرة النبوية", url: "/seerah" },
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "الوصايا النبوية", url: "/wasaya-nabawiyya" },
  { name: "الطب النبوي", url: "/prophetic-medicine" },
  { name: "مكارم الأخلاق", url: "/akhlaq" },
])}`,
  "/seerah": `<p>السيرة النبوية الشريفة: من المولد إلى الوفاة، مراحل الدعوة والهجرة والغزوات، مع شمائل وقصص.</p>
${linkList("روابط ذات صلة", [
  { name: "الشمائل المحمدية", url: "/shamael" },
  { name: "قصص الأنبياء", url: "/prophets" },
  { name: "أعلام الصحابة", url: "/sahabah" },
  { name: "القصص الإسلامية", url: "/stories" },
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "الدروس والدورات", url: "/lessons" },
])}`,
  "/sahabah": `<p>أعلام الصحابة الكرام: تراجم مختارة وسيرهم في نصرة الدين، مع ربط بالسيرة والعلماء.</p>
${linkList("روابط ذات صلة", [
  { name: "السيرة النبوية", url: "/seerah" },
  { name: "أعلام العلماء", url: "/scholars" },
  { name: "القصص الإسلامية", url: "/stories" },
  { name: "حِكَم السلف", url: "/hikam-salaf" },
  { name: "مكارم الأخلاق", url: "/akhlaq" },
])}`,
  "/hikam-salaf": `<p>حِكَم السلف الصالح وآثارهم في الزهد والأدب وطلب العلم — للانتفاع المختصر الموثّق.</p>
${linkList("روابط ذات صلة", [
  { name: "أعلام الصحابة", url: "/sahabah" },
  { name: "أعلام العلماء", url: "/scholars" },
  { name: "الرقائق والزهد", url: "/raqaiq" },
  { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
  { name: "الفوائد", url: "/fawaid" },
])}`,
  "/islamic-sects": `<p>الفرق الإسلامية: تعريف منهجي بأبرز المقالات مع الحذر من التعميم، وربط بباب العقيدة والتوحيد.</p>
${linkList("روابط ذات صلة", [
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "المذاهب الأربعة", url: "/madhahib" },
  { name: "المعجم الشرعي", url: "/islamic-glossary" },
  { name: "منهجيتنا في التوثيق", url: "/methodology" },
])}`,
  "/mawarith": `<p>علم المواريث والفرائض: أصول قسمة التركات وأنصبة الورثة، ضمن أبواب الفقه والمعاملات.</p>
${linkList("روابط ذات صلة", [
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "القواعد الفقهية", url: "/fiqh-qawaid" },
  { name: "المذاهب الأربعة", url: "/madhahib" },
])}`,
  "/mushaf": `<p>المصحف الشريف للقراءة الرقمية: تصفّح السور والآيات، مع خدمات التجويد والحفظ وعلوم القرآن.</p>
${linkList("روابط ذات صلة", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "فهرس السور", url: "/quran/surahs" },
  { name: "أحكام التجويد", url: "/quran-hub/tajweed" },
  { name: "خطط الحفظ", url: "/quran/memorization-plans" },
  { name: "أدعية القرآن", url: "/duas-quran" },
  { name: "علوم القرآن", url: "/ulum-quran" },
])}`,
  "/miracles": `<p>إشارات كونية في الوحي للتأمّل المنهجي في آيات الخلق؛ المعتمد في المنهج: الإعجاز البياني والغيبي والتشريعي دون تكلّف.</p>
${linkList("روابط ذات صلة", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "علوم القرآن", url: "/ulum-quran" },
  { name: "دراسات قرآنية", url: "/quran-studies" },
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "منهجيتنا في التوثيق", url: "/methodology" },
])}`,
  "/stories": `<p>القصص الإسلامية: قصص الأنبياء والصحابة والعبر التربوية، مع مداخل إلى السيرة والأنبياء.</p>
${linkList("روابط ذات صلة", [
  { name: "قصص الأنبياء", url: "/prophets" },
  { name: "السيرة النبوية", url: "/seerah" },
  { name: "أعلام الصحابة", url: "/sahabah" },
  { name: "قصص السور", url: "/quran/surah-stories" },
  { name: "الرقائق والزهد", url: "/raqaiq" },
])}`,
  "/amr-bil-maruf": `<p>الأمر بالمعروف والنهي عن المنكر: ضوابطه وآدابه ومراتبه، مع ربط بالأخلاق والعقيدة.</p>
${linkList("روابط ذات صلة", [
  { name: "مكارم الأخلاق", url: "/akhlaq" },
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
  { name: "الفوائد", url: "/fawaid" },
])}`,
  "/mutashabihat": `<p>الآيات المتشابهات في القرآن: مواضع التشابه اللفظي لضبط الحفظ والتلاوة، ضمن خدمات القرآن.</p>
${linkList("روابط ذات صلة", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "خطط الحفظ", url: "/quran/memorization-plans" },
  { name: "اختبارات الحفظ", url: "/quran-memorization" },
  { name: "أحكام التجويد", url: "/quran-hub/tajweed" },
])}`,
  "/islamic-landmarks": `<p>المشاهد الإسلامية والمساجد التاريخية: تعريف موجز بأماكن لها أثر في السيرة وحضارة المسلمين.</p>
${linkList("روابط ذات صلة", [
  { name: "السيرة النبوية", url: "/seerah" },
  { name: "دليل المؤسسات", url: "/institutions" },
  { name: "قصص الأنبياء", url: "/prophets" },
  { name: "الأقسام", url: "/sections" },
])}`,
  "/prayer-ranks": `<p>مراتب الناس في الصلاة: من الإخلاص والخشوع إلى الغفلة، للتذكير والرقائق لا للتشهير.</p>
${linkList("روابط ذات صلة", [
  { name: "دليل الصلاة", url: "/salah-guide" },
  { name: "الرقائق والزهد", url: "/raqaiq" },
  { name: "فضائل الأعمال", url: "/fadail-aamal" },
  { name: "الأذكار", url: "/adhkar" },
])}`,
  "/start-here": `<p>دليل المبتدئ في المجلس العلمي: اختر مستواك، ثم اتبع خطوات عملية تصل بك إلى أول درس دون ضياع في القوائم.</p>
<h2>اختر مستواك</h2>
<ul>
  <li><strong>مبتدئ:</strong> عقيدة مختصرة، أركان الإسلام، أذكار يومية، ودليل الصلاة.</li>
  <li><strong>متوسط:</strong> دروس ودورات في الفقه والحديث والسيرة مع كتب مصاحبة.</li>
  <li><strong>متقدم:</strong> أصول الفقه ومصطلح الحديث بعد التأسيس.</li>
</ul>
${linkList("خطوات مقترحة", [
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "أركان الإسلام", url: "/arkan" },
  { name: "دليل الصلاة", url: "/salah-guide" },
  { name: "الأذكار اليومية", url: "/adhkar" },
  { name: "السيرة النبوية", url: "/seerah" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
])}`,
  "/methodology": `<p>هذه الصفحة تصف ما يفعله النظام فعلاً: لا وسم «موثّق» بلا مراجعة بشرية ومصدر خارجي، ووسم صريح للمحتوى قيد المراجعة أو المولَّد آلياً. آخر تحديث للمضمون: 2026-08-06.</p>
<h2>لماذا هذه الصفحة؟</h2>
<p>القاعدة: لا تُوسم مادة بـ«موثّقة» إلا إذا راجعها إنسان مُسمّى ولها مصدر خارجي مثبت. وما عدا ذلك يُعرض بوسم «قيد المراجعة الشرعية» للاطلاع لا للاحتجاج.</p>
<h2>درجات التوثيق</h2>
<ul>
  <li><strong>نص أصلي:</strong> آية بسورة ورقم، أو حديث بمصنَّف ورقم مع حكم عند الحديث.</li>
  <li><strong>مصدر علمي:</strong> نقل عن عالم أو كتاب مسمّى بموضع يمكن الرجوع إليه.</li>
  <li><strong>قرار مؤسسي:</strong> قرار مجمع أو هيئة برقم وتاريخ.</li>
  <li><strong>استدلال عام:</strong> قاعدة أو مقصد بلا نص مسمّى — ليس دليلاً مكتملاً.</li>
  <li><strong>بلا مصدر:</strong> يُعلَّم صراحةً ولا يُعرض كموثَّق.</li>
</ul>
<h2>مرجعية المحتوى الشرعي</h2>
<ul>
  <li>مصدر التلقي: الكتاب والسنة الصحيحة وإجماع السلف بفهم الصحابة ومن تبعهم.</li>
  <li>لا يُنشر حديث بلا تخريج وحكم؛ ولا يُستدل بضعيف في الأحكام.</li>
  <li>الآيات بالرسم العثماني مع عزو السورة ورقم الآية.</li>
  <li>النوازل تُحال إلى المجامع وهيئات الفتوى — لا فتوى شخصية من المنصة.</li>
</ul>
<h2>خطوات التحقق والنشر</h2>
<ol>
  <li>استيراد من مصدر معروف مع حفظ رابط المصدر.</li>
  <li>كل استيراد يبقى «قيد المراجعة» ولا يُعتمد تلقائياً.</li>
  <li>المراجعة البشرية شرط وسم «موثّق» مع اسم المراجع والتاريخ.</li>
  <li>وسم المحتوى المولَّد آلياً صراحةً.</li>
  <li>المساعد العلمي أداة تعليمية — لا يُفتي.</li>
</ol>
<h2>مصادر التحقق المعتمدة</h2>
<ul>
  <li>dorar.net — موسوعة الدرر السنية للأحاديث والآثار والتخريج.</li>
  <li>sunnah.com — موسوعة الأحاديث النبوية.</li>
  <li>aladhan.com — مواقيت الصلاة والتقويم الهجري.</li>
  <li>alquran.cloud — بيانات القرآن بالرسم العثماني.</li>
  <li>shamela.ws — المكتبة الشاملة للتراث.</li>
  <li>dar-alifta.net — دار الإفتاء المصرية.</li>
  <li>binbaz.org.sa — فتاوى ومواد محقَّقة.</li>
  <li>islamhouse.com — مواد شرعية مترجمة.</li>
  <li>iifa-fiqh.org — مجمع الفقه الإسلامي الدولي.</li>
  <li>noor-book.com — مكتبة رقمية مفتوحة.</li>
</ul>
<h2>سياسة التصحيح</h2>
<p>زر «الإبلاغ عن خطأ» أسفل المواد، أو عبر صفحة التواصل مع ذكر رابط الصفحة والمصدر المقترح. ما يثبت خطؤه يُصحَّح أو يُسحب بعد المراجعة.</p>
<h2>ما لا نفعله</h2>
<ul>
  <li>لا نُفتي في النوازل الشخصية.</li>
  <li>لا نصحّح درجة حديث لم تثبت في مصدره.</li>
  <li>لا نمنح شارة توثيق بلا مراجِع بشري ومصدر خارجي.</li>
</ul>
${linkList("روابط ذات صلة", [
  { name: "من نحن", url: "/about-us" },
  { name: "سياسة الفتوى والمراجعة", url: "/fatwa-policy" },
  { name: "المصادر والتراخيص", url: "/sources" },
  { name: "تواصل معنا", url: "/contact" },
  { name: "علوم الحديث", url: "/hadith-science" },
])}`,
  "/fatwa-policy": `<p>سياسة الفتوى والمراجعة توضّح كيف تُعرض المسائل والفتاوى في المنصة، وما لا تقوم به (لا فتوى آلية ولا ترجيح من عندها)، وسير المراجعة البشرية قبل الاعتماد.</p>
<h2>ما تعرضه المنصة</h2>
<ul>
  <li>نقل فتاوى وقرارات من مصادر وهيئات مسمّاة مع الإحالة الظاهرة.</li>
  <li>مسائل وأحكام للتعليم العام مرتبطة بمراجعها حين تتوفّر.</li>
</ul>
<h2>ما لا تقوم به المنصة</h2>
<ul>
  <li>لا تُصدر فتوى خاصة بنازلة فردية عبر الذكاء الاصطناعي.</li>
  <li>لا ترجّح بين أقوال الفقهاء نيابةً عن أهل العلم.</li>
  <li>المحتوى للإرشاد العام ولا يغني عن سؤال أهل العلم في النوازل الخاصة.</li>
</ul>
${linkList("روابط ذات صلة", [
  { name: "منهجيتنا في التوثيق", url: "/methodology" },
  { name: "الفقه والأحكام", url: "/fiqh" },
  { name: "تواصل معنا", url: "/contact" },
  { name: "سياسة الخصوصية", url: "/privacy" },
])}`,
  "/about": `<p>المجلس العلمي منصة شرعية كويتية تجمع دروسًا وكتبًا ومسارات وأدوات لطلب العلم بمنهج موثّق وواجهة عربية.</p>
${linkList("تعرّف أكثر", [
  { name: "منهجيتنا في التوثيق", url: "/methodology" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "المكتبة العلمية", url: "/library" },
  { name: "تواصل معنا", url: "/contact" },
  { name: "سياسة الخصوصية", url: "/privacy" },
])}`,
  "/institutions": `<p>دليل المؤسسات الإسلامية والتعليم الشرعي — مداخل للتعرّف لا بديل عن التحقق المباشر من كل جهة.</p>
${linkList("روابط ذات صلة", [
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "المشاهد الإسلامية", url: "/islamic-landmarks" },
  { name: "أعلام العلماء", url: "/scholars" },
])}`,
  "/quran-memorization": `<p>اختبارات الحفظ القرآني وخطط المراجعة — أدوات مساعدة مع المصحف وخطط الحفظ في مركز القرآن.</p>
${linkList("روابط ذات صلة", [
  { name: "خطط الحفظ", url: "/quran/memorization-plans" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "الآيات المتشابهات", url: "/mutashabihat" },
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "اختبار التلاوة", url: "/quran/recitation-test-ai" },
])}`,
  "/updates": `<p>آخر مستجدات المنصة: إضافات الدروس والكتب والأدوات — للاطلاع السريع على ما يتجدّد.</p>
${linkList("روابط ذات صلة", [
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "المكتبة العلمية", url: "/library" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "من نحن", url: "/about" },
])}`,
  "/contact": `<p>تواصل مع فريق المجلس العلمي للاستفسارات والاقتراحات والإبلاغ عن ملاحظات على المحتوى أو التقنية.</p>
<h2>قنوات التواصل</h2>
<ul>
  <li>البريد الإلكتروني الرسمي: <a href="mailto:${escapeHtml(SITE.contactEmail)}">${escapeHtml(SITE.contactEmail)}</a></li>
</ul>
<p>للاستفسارات العامة، وتصحيح المحتوى العلمي، والملاحظات التقنية، والاقتراحات والشراكات — راسلنا على البريد أعلاه مع موضوع واضح.</p>
${linkList("روابط ذات صلة", [
  { name: "من نحن", url: "/about" },
  { name: "منهجيتنا", url: "/methodology" },
  { name: "سياسة الخصوصية", url: "/privacy" },
  { name: "شروط الاستخدام", url: "/terms" },
  { name: "الأسئلة والأجوبة", url: "/quiz" },
])}`,
  "/privacy": `<p>سياسة الخصوصية لمنصة المجلس العلمي توضّح ما نجمعه من بيانات، وكيف نستخدمها، وما لا نجمعه، وحقوقك في الاطلاع والتصحيح والحذف.</p>
<h2>البيانات التي نجمعها</h2>
<ul>
  <li><strong>بيانات الحساب:</strong> الاسم والبريد عند التسجيل لتفعيل الحساب والتواصل الضروري.</li>
  <li><strong>سجل الاستخدام:</strong> الصفحات التي تطّلع عليها؛ إن سجّلت الدخول يُربَط بحسابك لحفظ التقدّم، ويُحذف عند حذف الحساب.</li>
  <li><strong>تفضيلات محلية:</strong> الوضع الليلي وحجم الخط على جهازك.</li>
</ul>
<h2>اختبار التلاوة (الميكروفون)</h2>
<ul>
  <li>الميزة اختيارية ولا تعمل إلا بموافقتك في إذن النظام.</li>
  <li>يُحوَّل الصوت إلى نص عبر محرّك التعرّف في نظام جهازك؛ قد تُعالَج المقاطع على خوادم النظام عند غياب تعرّف عربي كامل على الجهاز.</li>
  <li><strong>لا يُرفَع صوتك إلى خوادم مجالس ولا يُخزَّن هناك مطلقًا</strong> — المقارنة تتم على جهازك.</li>
  <li>يمكنك سحب إذن الميكروفون من إعدادات الجهاز في أي وقت.</li>
</ul>
<h2>الموقع الجغرافي والإشعارات</h2>
<ul>
  <li>الموقع يُستخدم فقط لحساب مواقيت الصلاة والقبلة، ولا يُخزَّن على خوادمنا.</li>
  <li>الإشعارات لتنبيهات الصلاة أو الدروس فقط — بلا إعلانات.</li>
</ul>
<h2>مدة الاحتفاظ وحذف الحساب</h2>
<ul>
  <li>بيانات الحساب طوال نشاطه؛ سجل الاستخدام يُحذف بعد 12 شهرًا من عدم النشاط.</li>
  <li>التسجيلات الصوتية لا تُخزَّن على خوادمنا.</li>
  <li>يمكنك حذف الحساب نهائيًا من <a href="https://majlisilm.com/account-deletion">صفحة حذف الحساب</a>؛ الحذف يزيل صفوف المستخدم من المصادقة والجداول المرتبطة (bookmarks والتقدم وغيرها) عبر قاعدة البيانات.</li>
</ul>
${linkList("روابط ذات صلة", [
  { name: "شروط الاستخدام", url: "/terms" },
  { name: "تواصل معنا", url: "/contact" },
  { name: "من نحن", url: "/about" },
  { name: "حذف الحساب", url: "/account-deletion" },
])}`,
  "/terms": `<p>باستخدام منصة المجلس العلمي فإنك توافق على هذه الشروط التي تنظّم حدود المحتوى، ومسؤولية المستخدم، وضوابط النشر والتفاعل.</p>
<h2>طبيعة المحتوى</h2>
<ul>
  <li>المنصة تقدّم محتوى تعليميًا شرعيًا على منهج أهل السنة؛ وليست بديلاً عن استفتاء عالم في نازلة شخصية.</li>
  <li>نسعى للتثبت من النقول، ونرحّب بالإبلاغ عن أي خطأ عبر صفحة التواصل.</li>
</ul>
<h2>حسابك وسلوكك</h2>
<ul>
  <li>أنت مسؤول عن سرية بيانات دخولك وعن المحتوى الذي ترسله إن وُجدت قنوات مساهمة.</li>
  <li>يُمنع إساءة الاستخدام، أو نشر ما يخالف الشرع أو النظام، أو محاولة تعطيل الخدمة.</li>
</ul>
<h2>الملكية الفكرية والخصوصية</h2>
<ul>
  <li>حقوق الواجهة والعلامة للمجلس العلمي؛ والمصادر الشرعية تُنسب لأصحابها.</li>
  <li>معالجة بياناتك خاضعة لـ<a href="https://majlisilm.com/privacy">سياسة الخصوصية</a>.</li>
</ul>
<h2>إخلاء المسؤولية</h2>
<p>نبذل الجهد في صحة العرض التقني والمحتوى، دون ضمان مطلق؛ استخدم المنصة على مسؤوليتك مع الرجوع للأصول عند الحاجة.</p>
${linkList("روابط ذات صلة", [
  { name: "سياسة الخصوصية", url: "/privacy" },
  { name: "تواصل معنا", url: "/contact" },
  { name: "من نحن", url: "/about" },
  { name: "منهجيتنا", url: "/methodology" },
])}`,
  "/account-deletion": `<p>يمكنك طلب حذف حسابك وجميع بياناتك الشخصية من منصة المجلس العلمي نهائيًا. العملية لا يمكن التراجع عنها.</p>
<h2>خطوات الحذف</h2>
<ol>
  <li>سجّل الدخول إلى حسابك.</li>
  <li>افتح هذه الصفحة واضغط «أريد حذف حسابي».</li>
  <li>اكتب كلمة «حذف» للتأكيد.</li>
  <li>يُنفَّذ الطلب عبر واجهة آمنة تحذف مستخدم المصادقة في Supabase فورًا.</li>
</ol>
<h2>ما الذي يُحذف؟</h2>
<ul>
  <li>حساب المصادقة والبريد المرتبط.</li>
  <li>سجل التقدم، المفضلات (bookmarks)، الإنجازات، وبيانات المستخدم المرتبطة عبر قيود الحذف في قاعدة البيانات.</li>
</ul>
<h2>ما الذي يبقى؟</h2>
<ul>
  <li>المحتوى العلمي العام المنشور غير المرتبط بملكية حسابك، مثل الدروس والمكتبة والقرآن والأحكام العامة.</li>
</ul>
<h2>المدة</h2>
<p>الحذف فوري من جهة الخادم عند نجاح الطلب. قد تستغرق كاشات المتصفح أو الأجهزة المرتبطة دقائق حتى تنتهي الجلسات المحلية بعد تسجيل الخروج التلقائي.</p>
${linkList("روابط ذات صلة", [
  { name: "سياسة الخصوصية", url: "/privacy" },
  { name: "الإعدادات", url: "/settings" },
  { name: "تواصل معنا", url: "/contact" },
])}`,
  "/prayer-times": `<p>مواقيت الصلاة حسب الموقع، مع عدّ تنازلي للصلاة القادمة وروابط لأدوات الأذان والقبلة.</p>
${linkList("أدوات مرتبطة", [
  { name: "عداد الصلاة القادمة", url: "/prayer-countdown" },
  { name: "اتجاه القبلة", url: "/qibla" },
  { name: "إعدادات الأذان", url: "/adhan-settings" },
  { name: "السنن اليومية", url: "/sunan-yawmiyya" },
  { name: "الأذكار", url: "/adhkar" },
  { name: "دليل الصلاة", url: "/salah-guide" },
])}`,
  "/prayer-countdown": `<p>عدّاد تنازلي لوقت الصلاة القادمة — لمتابعة الأذان دون تشتيت، مع ربط بمواقيت الصلاة والقبلة.</p>
${linkList("أدوات مرتبطة", [
  { name: "مواقيت الصلاة", url: "/prayer-times" },
  { name: "اتجاه القبلة", url: "/qibla" },
  { name: "إعدادات الأذان", url: "/adhan-settings" },
  { name: "الأذكار", url: "/adhkar" },
  { name: "دليل الصلاة", url: "/salah-guide" },
])}`,
  "/qibla": `<p>اتجاه القبلة بحسب موقعك الجغرافي باستخدام البوصلة الرقمية، مع روابط لمواقيت الصلاة والأذكار.</p>
${linkList("أدوات مرتبطة", [
  { name: "مواقيت الصلاة", url: "/prayer-times" },
  { name: "عداد الصلاة القادمة", url: "/prayer-countdown" },
  { name: "دليل الصلاة", url: "/salah-guide" },
  { name: "الحج والعمرة", url: "/hajj" },
  { name: "الأذكار", url: "/adhkar" },
])}`,
  "/tasbih": `<p>مسبحة إلكترونية للتسبيح والتهليل والاستغفار مع حفظ الأوراد، وربط بموسوعة الأذكار والورد اليومي.</p>
${linkList("روابط ذات صلة", [
  { name: "موسوعة الأذكار", url: "/adhkar" },
  { name: "الأدعية الشرعية", url: "/duas" },
  { name: "الورد اليومي", url: "/daily-wird" },
  { name: "السنن اليومية", url: "/sunan-yawmiyya" },
  { name: "أسماء الله الحسنى", url: "/asma-husna" },
])}`,
  "/calendar": `<p>تقويم للدروس والدورات: مواعيد وأماكن، مع مداخل إلى قائمة الدروس والدورات السنوية.</p>
${linkList("روابط ذات صلة", [
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "الدورات العلمية", url: "/annual-courses" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "آخر المستجدات", url: "/updates" },
])}`,
  "/quiz": (() => {
    const cats = [
      "القرآن وعلومه",
      "الحديث وعلومه",
      "الفقه وأصوله",
      "العقيدة",
      "السيرة والتاريخ",
      "الآداب والأخلاق",
    ];
    return `<p>لعبة سين جيم لاختبار المعلومات الشرعية — للمراجعة والتثبيت، وليست فتوى شخصية ولا بديلاً عن طلب العلم المنهجي.</p>
<h2>مجالات الأسئلة</h2>
<ul>${cats.map((c) => `<li>${c}</li>`).join("")}</ul>
<h2>مستويات الصعوبة وأنواع الأسئلة</h2>
<ul>
  <li>مستويات نقاط: ٢٠٠ · ٤٠٠ · ٦٠٠</li>
  <li>أسئلة اختيار من متعدد وأسئلة مفتوحة قصيرة حسب المجال</li>
  <li>وضع فردي أو فرق مع وسائل مساعدة محدودة</li>
</ul>
<h2>نظام النقاط والمراجعة</h2>
<p>تحصل على نقاط السؤال عند الإجابة الصحيحة، ويمكن مراجعة الإجابات بعد الجولة. عدد الأسئلة المعتمدة في بنك اللعبة يُحدَّث مع المحتوى المنشور في المنصة.</p>
<p><a href="${SITE_URL}/quiz">ابدأ اللعب</a></p>
${linkList("روابط ذات صلة", [
  { name: "البطاقات التعليمية", url: "/flashcards" },
  { name: "الفوائد", url: "/fawaid" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "الدروس والدورات", url: "/lessons" },
])}`;
  })(),
  "/flashcards": `<p>بطاقات تعليمية تفاعلية لمراجعة المفاهيم الشرعية وتثبيتها، مع ربط بالمسارات والاختبارات.</p>
${linkList("روابط ذات صلة", [
  { name: "لعبة سين جيم", url: "/quiz" },
  { name: "الفوائد", url: "/fawaid" },
  { name: "المعجم الشرعي", url: "/islamic-glossary" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
])}`,
  "/assistant": `<p>المساعد العلمي يرشدك داخل المنصة إلى الدروس والكتب والفوائد دون إفتاء مستقل — مع إحالة للأقسام الموثّقة.</p>
${linkList("روابط ذات صلة", [
  { name: "البحث", url: "/search" },
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "المكتبة العلمية", url: "/library" },
  { name: "الأسئلة والأجوبة", url: "/quiz" },
  { name: "خريطة أهم الأقسام", url: "/sitemap" },
  { name: "منهجيتنا", url: "/methodology" },
])}`,
  "/mind-map": `<p>خرائط ذهنية لربط مفاهيم العلوم الشرعية بصريًا — مدخل موازٍ لخريطة المعرفة والمسارات.</p>
${linkList("روابط ذات صلة", [
  { name: "خريطة المعرفة", url: "/knowledge-graph" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "المعجم الشرعي", url: "/islamic-glossary" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "التوحيد والعقيدة", url: "/tawhid" },
])}`,
  "/sitemap": `<p>خريطة أقسام المجلس العلمي: مداخل سريعة لأهم المحاور والأدوات وصفحات التعريف.</p>
${linkList("محاور أساسية", [
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "المكتبة العلمية", url: "/library" },
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "أعلام العلماء", url: "/scholars" },
  { name: "الدروس والدورات", url: "/lessons" },
])}
${linkList("أدوات", [
  { name: "مواقيت الصلاة", url: "/prayer-times" },
  { name: "اتجاه القبلة", url: "/qibla" },
  { name: "عداد التسبيح", url: "/tasbih" },
  { name: "المساعد العلمي", url: "/assistant" },
  { name: "لعبة سين جيم", url: "/quiz" },
  { name: "البطاقات التعليمية", url: "/flashcards" },
])}`,
  "/hadith/sahih": `<p>مجموعة مختارة من الأحاديث الصحيحة من مصادر معتمدة، مع مداخل إلى علوم الحديث وكتب الرواية.</p>
${linkList("أقسام الحديث", [
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "الأحاديث الضعيفة", url: "/hadith/daif" },
  { name: "الأحاديث الموضوعة", url: "/hadith/mawdu" },
  { name: "كتب الحديث", url: "/hadith/books" },
  { name: "علوم الحديث", url: "/hadith-science" },
  { name: "الأربعون النووية", url: "/arbaeen-nawawi" },
  { name: "صحيح البخاري", url: "/library/book-bukhari" },
  { name: "صحيح مسلم", url: "/library/book-muslim" },
])}`,
  "/hadith/daif": `<p>أحاديث ضعيفة يُنبَّه إليها لتجنّب الاحتجاج بها في الأحكام والعقائد، مع ربط بدرجات الحديث وعلومه.</p>
${linkList("أقسام الحديث", [
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "الأحاديث الصحيحة", url: "/hadith/sahih" },
  { name: "الأحاديث الموضوعة", url: "/hadith/mawdu" },
  { name: "علوم الحديث", url: "/hadith-science" },
  { name: "كتب الحديث", url: "/hadith/books" },
  { name: "منهجيتنا في التوثيق", url: "/methodology" },
])}`,
  "/hadith/mawdu": `<p>أحاديث موضوعة ومكذوبة يُحذَّر منها، مع تمييزها عن الصحيح والضعيف عبر علوم الحديث.</p>
${linkList("أقسام الحديث", [
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "الأحاديث الصحيحة", url: "/hadith/sahih" },
  { name: "الأحاديث الضعيفة", url: "/hadith/daif" },
  { name: "علوم الحديث", url: "/hadith-science" },
  { name: "كتب الحديث", url: "/hadith/books" },
  { name: "منهجيتنا في التوثيق", url: "/methodology" },
])}`,
  "/hadith/books": `<p>مداخل إلى كتب الحديث المعتمدة في المكتبة: الصحاح والسنن والجوامع، مع ربط بعلوم الحديث.</p>
${linkList("من كتب الحديث", [
  { name: "صحيح البخاري", url: "/library/book-bukhari" },
  { name: "صحيح مسلم", url: "/library/book-muslim" },
  { name: "سنن أبي داود", url: "/library/book-abudawud" },
  { name: "سنن الترمذي", url: "/library/book-tirmidhi" },
  { name: "رياض الصالحين", url: "/library/book-riyadh" },
  { name: "الأربعون النووية", url: "/library/book-nawawi40" },
])}
${linkList("روابط ذات صلة", [
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "علوم الحديث", url: "/hadith-science" },
  { name: "المكتبة العلمية", url: "/library" },
])}`,
  "/quran-hub/tajweed": `<p>أحكام التجويد: مخارج وصفات ومدود ونون وميم — لضبط التلاوة مع المصحف وخطط الحفظ.</p>
${linkList("خدمات القرآن", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "القراءات العشر", url: "/quran-hub/qiraat" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "خطط الحفظ", url: "/quran/memorization-plans" },
  { name: "مكّي ومدني", url: "/quran/makki-madani" },
  { name: "اختبار التلاوة", url: "/quran/recitation-test-ai" },
])}`,
  "/quran-hub/qiraat": `<p>القراءات العشر ورواتها وأصول القبول — وصف موثّق دون تغيير نص مصحف حفص في التطبيق.</p>
${linkList("خدمات القرآن", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "التجويد", url: "/quran-hub/tajweed" },
  { name: "علوم القرآن", url: "/ulum-quran" },
  { name: "المصحف الرقمي", url: "/mushaf" },
])}`,
  "/quran-hub/tilawa": `<p>التلاوة والقرّاء: استماع عبر مصحف المدينة برواية حفص.</p>
${linkList("خدمات القرآن", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "التجويد", url: "/quran-hub/tajweed" },
  { name: "المصحف الرقمي", url: "/mushaf" },
])}`,
  "/quran-hub/terms": `<p>مصطلحات علوم القرآن من القاموس الإسلامي الموحّد (فلتر تصنيف).</p>
${linkList("روابط", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "القاموس الإسلامي", url: "/islamic-glossary" },
  { name: "علوم القرآن", url: "/ulum-quran" },
])}`,
  "/quran/makki-madani": `<p>تصنيف السور المكية والمدنية وأثره في التفسير وفهم السياق، ضمن علوم القرآن.</p>
${linkList("خدمات القرآن", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "ترتيب النزول", url: "/quran/revelation-order" },
  { name: "قصص السور", url: "/quran/surah-stories" },
  { name: "علوم القرآن", url: "/ulum-quran" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "بحث في الآيات", url: "/quran/search" },
])}`,
  "/quran/search": `<p>بحث محلي في نص آيات القرآن الكريم — شاشة منفصلة عن المصحف مع الانتقال إلى موضع الآية.</p>
${linkList("خدمات القرآن", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "فهرس السور", url: "/quran/surahs" },
  { name: "علوم القرآن", url: "/ulum-quran" },
])}`,
  "/quran/memorization-plans": `<p>خطط عملية للحفظ والمراجعة اليومية والأسبوعية، مع أدوات المتشابهات واختبارات الحفظ.</p>
${linkList("خدمات القرآن", [
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "اختبارات الحفظ", url: "/quran-memorization" },
  { name: "الآيات المتشابهات", url: "/mutashabihat" },
  { name: "أحكام التجويد", url: "/quran-hub/tajweed" },
  { name: "الورد اليومي", url: "/daily-wird" },
])}`,
  "/prophets/tree": `<p>شجرة أنساب الأنبياء عليهم السلام عرضًا تفاعليًا للعلاقات والنسب، مع ربط بقصص الأنبياء والسيرة.</p>
${linkList("روابط ذات صلة", [
  { name: "قصص الأنبياء", url: "/prophets" },
  { name: "الأنبياء والرسل", url: "/anbiya" },
  { name: "السيرة النبوية", url: "/seerah" },
  { name: "قصص السور", url: "/quran/surah-stories" },
  { name: "القصص الإسلامية", url: "/stories" },
])}`,
  "/learning/calendar": `<p>التقويم العلمي لمواعيد الدروس والدورات.</p>
${linkList("روابط ذات صلة", [
  { name: "تقويم الدروس", url: "/calendar" },
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "الدورات العلمية", url: "/annual-courses" },
  { name: "المسابقة", url: "/quiz" },
])}`,
  "/learning/quiz": `<p>اختبارات تفاعلية لقياس التقدّم — تُحوَّل إلى المسابقة والدروس.</p>
${linkList("روابط ذات صلة", [
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "لعبة سين جيم", url: "/quiz" },
  { name: "البطاقات التعليمية", url: "/flashcards" },
  { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
])}`,
  "/fiqh-council/fatwas": `<p>فتاوى جماعية صادرة عن المجمع الفقهي — للاطلاع المؤسسي مع ربط بالمسائل والقرارات.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "القرارات", url: "/fiqh-council/resolutions" },
  { name: "النوازل", url: "/fiqh-council/nawazil" },
  { name: "التوصيات", url: "/fiqh-council/recommendations" },
  { name: "الأرشيف", url: "/fiqh-council/archive" },
])}`,
  "/fiqh-council/research": `<p>بحوث المجمع الفقهي والدراسات المصاحبة للقرارات — مدخل للباحث قبل المقارنة والأرشيف.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "مساعد الباحث", url: "/fiqh-council/research-assistant" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "مقارنة القرارات", url: "/fiqh-council/compare" },
  { name: "الأرشيف", url: "/fiqh-council/archive" },
])}`,
  "/fiqh-council/archive": `<p>أرشيف مواد المجمع الفقهي للرجوع إلى القرارات والفتاوى والبحوث السابقة.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "الفتاوى", url: "/fiqh-council/fatwas" },
  { name: "القرارات", url: "/fiqh-council/resolutions" },
  { name: "البحوث", url: "/fiqh-council/research" },
  { name: "التصنيفات", url: "/fiqh-council/categories" },
])}`,
  "/fiqh-council/categories": `<p>تصنيفات فقهية لتنظيم قرارات المجمع ومسائله حسب الأبواب والموضوعات.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "الفهرس الموضوعي", url: "/fiqh-council/index" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "النوازل", url: "/fiqh-council/nawazil" },
  { name: "الأرشيف", url: "/fiqh-council/archive" },
])}`,
  "/fiqh-council/resolutions": `<p>قرارات المجمع الفقهي المعتمدة، مع مداخل إلى التوصيات والفتاوى والمقارنة.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "التوصيات", url: "/fiqh-council/recommendations" },
  { name: "الفتاوى", url: "/fiqh-council/fatwas" },
  { name: "مقارنة القرارات", url: "/fiqh-council/compare" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
])}`,
  "/fiqh-council/recommendations": `<p>توصيات المجمع الفقهي المصاحبة للقرارات والنوازل — للاطلاع المؤسسي المنهجي.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "القرارات", url: "/fiqh-council/resolutions" },
  { name: "النوازل", url: "/fiqh-council/nawazil" },
  { name: "الفتاوى", url: "/fiqh-council/fatwas" },
  { name: "الأرشيف", url: "/fiqh-council/archive" },
])}`,
  "/fiqh-council/nawazil": `<p>فقه النوازل المعاصرة كما تُعالَج في إطار المجمع: مسائل مستجدة مع إحالة إلى القرارات والبحوث.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "القرارات", url: "/fiqh-council/resolutions" },
  { name: "البحوث", url: "/fiqh-council/research" },
  { name: "بوابة الفقه", url: "/fiqh" },
])}`,
  "/fiqh-council/index": `<p>فهرس موضوعي لمواد المجمع الفقهي يسهّل الوصول عبر التصنيفات والمسائل.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "التصنيفات", url: "/fiqh-council/categories" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "البحث المتقدم", url: "/fiqh-council/search" },
  { name: "الإحصائيات", url: "/fiqh-council/stats" },
])}`,
  "/fiqh-council/stats": `<p>إحصائيات المجمع الفقهي: أعداد القرارات والفتاوى والبحوث وأكثر المواد تداولًا.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "البيانات الحية", url: "/fiqh-council/live" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "الأرشيف", url: "/fiqh-council/archive" },
  { name: "الفهرس الموضوعي", url: "/fiqh-council/index" },
])}`,
  "/fiqh-council/compare": `<p>أداة لمقارنة قرارات فقهية متقاربة الموضوع — للبحث لا للإفتاء الفردي.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "القرارات", url: "/fiqh-council/resolutions" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "البحوث", url: "/fiqh-council/research" },
  { name: "مساعد الباحث", url: "/fiqh-council/research-assistant" },
])}`,
  "/fiqh-council/research-assistant": `<p>مساعد للباحث الفقهي داخل مواد المجمع: توجيه إلى المسائل والقرارات والبحوث ذات الصلة.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "البحوث", url: "/fiqh-council/research" },
  { name: "البحث المتقدم", url: "/fiqh-council/search" },
  { name: "مقارنة القرارات", url: "/fiqh-council/compare" },
  { name: "المساعد العلمي", url: "/assistant" },
])}`,
  "/fiqh-council/live": `<p>لوحة بيانات حية لنشاط المجمع الفقهي (إحصاءات وتحديثات) — للاطلاع لا للفتوى الفورية.</p>
${linkList("أقسام المجمع", [
  { name: "المجمع الفقهي", url: "/fiqh-council" },
  { name: "الإحصائيات", url: "/fiqh-council/stats" },
  { name: "المسائل الفقهية", url: "/fiqh-council/issues" },
  { name: "آخر المستجدات", url: "/updates" },
])}`,
  "/knowledge-graph": `<h2>ما خريطة المعرفة؟</h2>
<p>عرض بصري تفاعلي يربط بين مفاهيم العلوم الشرعية (كالفقه والعقيدة والحديث والتفسير) ويُظهر علاقاتها ببعضها، ليساعد طالب العلم على فهم كيف يتصل كل علم بغيره بدل دراسته منعزلاً.</p>
${linkList("روابط ذات صلة", [
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "الفقه الإسلامي", url: "/fiqh" },
  { name: "أعلام العلماء المسلمين", url: "/scholars" },
])}`,
  "/": `<p>المجلس العلمي منصة عربية لطلب العلم: دروس وكتب ومسارات وقرآن وأذكار وفقه وحديث — بمنهج موثّق وواجهة RTL.</p>
${linkList("ابدأ من هنا", [
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "الدروس الشرعية", url: "/lessons" },
  { name: "المكتبة العلمية", url: "/library" },
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "بوابة الفقه", url: "/fiqh" },
  { name: "الأحاديث النبوية", url: "/hadith" },
  { name: "التوحيد والعقيدة", url: "/tawhid" },
  { name: "الدروس والدورات", url: "/lessons" },
  { name: "أعلام العلماء", url: "/scholars" },
  { name: "موسوعة الأذكار", url: "/adhkar" },
])}
${linkList("محاور دروس موسّعة", [
  { name: "الدروس الإيمانية", url: "/durus-imaniyya" },
  { name: "دروس متنوعة", url: "/durus-mutanawwia" },
  { name: "موضوعات الإيمان", url: "/iman-topics" },
  { name: "دراسات قرآنية", url: "/quran-studies" },
  { name: "دراسات سنّية", url: "/sunnah-studies" },
  { name: "مقاصد الشريعة", url: "/maqasid-sharia" },
])}`,
  "/durus-imaniyya": darsHubBody(
    "دروس إيمانية وتربوية في أمراض القلوب وأعمالها والتزكية والصلاة والذكر والأخلاق والفتن — للتثبيت والعمل لا للجدل.",
    "/durus-imaniyya",
    DURUS_IMANIYYA,
    [
      { name: "موضوعات التزكية", url: "/tazkiya-topics" },
      { name: "الرقائق والزهد", url: "/raqaiq" },
      { name: "التوبة", url: "/tawba" },
      { name: "فضائل الأعمال", url: "/fadail-aamal" },
      { name: "التوحيد والعقيدة", url: "/tawhid" },
      { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
    ],
  ),
  "/durus-mutanawwia": darsHubBody(
    "دروس متنوعة من مشاهد قرآنية ومواقف نبوية ومفاهيم شائعة وأخطاء دارجة وحضارة وتربية — مداخل قصيرة للتفكّر والعمل.",
    "/durus-mutanawwia",
    DURUS_MUTANAWWIA,
    [
      { name: "الدروس الإيمانية", url: "/durus-imaniyya" },
      { name: "الفكر والواقع", url: "/fikr-waqia" },
      { name: "الأسرة والمجتمع", url: "/usra-mujtama" },
      { name: "الفوائد", url: "/fawaid" },
      { name: "الأقسام", url: "/sections" },
    ],
  ),
  "/iman-topics": darsHubBody(
    "موضوعات الإيمان: الكون والغيب وأركان الإيمان والتوحيد والشهادتان والرسل والكتب ونواقض الإيمان — على منهج أهل السنة.",
    "/iman-topics",
    IMAN_TOPICS,
    [
      { name: "التوحيد والعقيدة", url: "/tawhid" },
      { name: "أركان الإيمان", url: "/arkan-iman" },
      { name: "عقيدة أهل السنة", url: "/learn/aqeedat-ahl-sunnah" },
      { name: "الإيمان بالله", url: "/learn/iman-billah" },
      { name: "أقسام التوحيد", url: "/learn/aqsam-tawheed" },
      { name: "أسماء الله الحسنى", url: "/asma-husna" },
    ],
  ),
  "/quran-studies": `<p>نُقل محتوى الدراسات القرآنية إلى <a href="/ulum-quran">علوم القرآن الكريم</a> — النزول والجمع والتفسير والإعجاز.</p>
${linkList("روابط ذات صلة", [
  { name: "علوم القرآن", url: "/ulum-quran" },
  { name: "مركز القرآن", url: "/quran-hub" },
  { name: "المصحف الرقمي", url: "/mushaf" },
  { name: "قصص السور", url: "/quran/surah-stories" },
  { name: "أدعية القرآن", url: "/duas-quran" },
])}`,
  "/sunnah-studies": darsHubBody(
    "دراسات في السنّة: جوامع الكلم والسنن اليومية والعبادة اليومية ومداخل الكتب الستة — مع ربط بعلوم الحديث.",
    "/sunnah-studies",
    SUNNAH_STUDIES,
    [
      { name: "الأحاديث النبوية", url: "/hadith" },
      { name: "علوم الحديث", url: "/hadith-science" },
      { name: "السنن اليومية", url: "/sunan-yawmiyya" },
      { name: "الأربعون النووية", url: "/arbaeen-nawawi" },
      { name: "الشمائل النبوية", url: "/shamael" },
    ],
  ),
  "/tazkiya-topics": darsHubBody(
    "موضوعات تزكية: أخلاق خفية وأمراض اللسان وأسئلة كبرى وتصحيح مفاهيم وأعمال يومية تزكي القلب.",
    "/tazkiya-topics",
    TAZKIYA_TOPICS,
    [
      { name: "الدروس الإيمانية", url: "/durus-imaniyya" },
      { name: "الرقائق والزهد", url: "/raqaiq" },
      { name: "الأخلاق", url: "/akhlaq" },
      { name: "التوبة", url: "/tawba" },
      { name: "الذنوب والحقوق", url: "/sins-and-rights" },
    ],
  ),
  "/tarikh-islami": darsHubBody(
    "مداخل التاريخ الإسلامي: عصور ومدن ومؤسسات وأزمات وحضارة ونُظم — للتعريف لا للاستقصاء الأكاديمي وحده.",
    "/tarikh-islami",
    TARIKH_ISLAMI,
    [
      { name: "السيرة النبوية", url: "/seerah" },
      { name: "الصحابة", url: "/sahabah" },
      { name: "أعلام العلماء", url: "/scholars" },
      { name: "المشاهد الإسلامية", url: "/islamic-landmarks" },
      { name: "قصص الأنبياء", url: "/prophets" },
    ],
  ),
  "/usra-mujtama": darsHubBody(
    "الأسرة والمجتمع: علاقات وبناء أسرة وتربية أبناء ومواطنة وبيئة — بنظر شرعي عملي.",
    "/usra-mujtama",
    USRA_MUJTAMA,
    [
      { name: "الأسرة", url: "/family" },
      { name: "الأخلاق", url: "/akhlaq" },
      { name: "الأمر بالمعروف", url: "/amr-bil-maruf" },
      { name: "الفكر والواقع", url: "/fikr-waqia" },
      { name: "الذنوب والحقوق", url: "/sins-and-rights" },
    ],
  ),
  "/fikr-waqia": darsHubBody(
    "الفكر والواقع: شباب وعمل وعلم وتفكير وإعلام وأخلاق التقنية وقضايا معاصرة بنظر شرعي منضبط.",
    "/fikr-waqia",
    FIKR_WAQIA,
    [
      { name: "الأسرة والمجتمع", url: "/usra-mujtama" },
      { name: "دروس متنوعة", url: "/durus-mutanawwia" },
      { name: "المجمع الفقهي", url: "/fiqh-council" },
      { name: "منهجيتنا", url: "/methodology" },
      { name: "الفوائد", url: "/fawaid" },
    ],
  ),
  "/mawsuaat": darsHubBody(
    "موسوعات ومداخل: دروس من الأشياء اليومية، وموقف وحكم، وبين أمرين، ومناهج الموسوعات الشرعية.",
    "/mawsuaat",
    MAWSUAAT,
    [
      { name: "دروس متنوعة", url: "/durus-mutanawwia" },
      { name: "الفوائد", url: "/fawaid" },
      { name: "المكتبة العلمية", url: "/library" },
      { name: "المعجم الشرعي", url: "/islamic-glossary" },
      { name: "خريطة المعرفة", url: "/knowledge-graph" },
    ],
  ),
  "/arabic-language": darsHubBody(
    "اللغة العربية لخدمة الوحي: نحو وصرف وبلاغة وآداب وكتب تعليمية — مدخل لطالب العلم الشرعي.",
    "/arabic-language",
    ARABIC_LANGUAGE,
    [
      { name: "علوم القرآن", url: "/ulum-quran" },
      { name: "دراسات قرآنية", url: "/quran-studies" },
      { name: "المكتبة العلمية", url: "/library" },
      { name: "أدب طلب العلم", url: "/adab-talab-ilm" },
      { name: "المعجم الشرعي", url: "/islamic-glossary" },
    ],
  ),
  "/maqasid-sharia": darsHubBody(
    "مقاصد الشريعة: تعريف وضروريات ومراتب وأقسام وقواعد وقضايا معاصرة وتطبيق في أبواب الفقه.",
    "/maqasid-sharia",
    MAQASID_SHARIA,
    [
      { name: "القواعد الفقهية", url: "/fiqh-qawaid" },
      { name: "بوابة الفقه", url: "/fiqh" },
      { name: "المجمع الفقهي", url: "/fiqh-council" },
      { name: "المذاهب الأربعة", url: "/madhahib" },
      { name: "بوابة الفقه", url: "/fiqh" },
    ],
  ),
  "/dalail-nubuwwah": darsHubBody(
    "دلائل النبوة: إعجاز القرآن والمعجزات الحسية والدلائل الخلقية والبشارات وضوابط منهجية وكتب الباب.",
    "/dalail-nubuwwah",
    DALAIL_NUBUWWAH,
    [
      { name: "السيرة النبوية", url: "/seerah" },
      { name: "المعجزات", url: "/miracles" },
      { name: "الشمائل النبوية", url: "/shamael" },
      { name: "قصص الأنبياء", url: "/prophets" },
      { name: "التوحيد والعقيدة", url: "/tawhid" },
    ],
  ),
  "/learn/aqeedat-ahl-sunnah": learnSlugBody(
    "عقيدة أهل السنة والجماعة: معالم المنهج ومصدر التلقي والإيمان والصفات والصحابة والقدر والوسطية واليوم الآخر — من بذور تعليمية موثّقة.",
    "aqeedat-ahl-sunnah",
    [
      { name: "التوحيد والعقيدة", url: "/tawhid" },
      { name: "الإيمان بالله", url: "/learn/iman-billah" },
      { name: "أقسام التوحيد", url: "/learn/aqsam-tawheed" },
      { name: "نواقض الإسلام", url: "/learn/nawaqid-islam" },
      { name: "موضوعات الإيمان", url: "/iman-topics" },
      { name: "أبواب العلم", url: "/learn" },
    ],
  ),
  "/learn/aqsam-tawheed": learnSlugBody(
    "أقسام التوحيد الثلاثة: الربوبية والألوهية والأسماء والصفات — تقسيم اصطلاحي يضبط البيان على منهج السلف.",
    "aqsam-tawheed",
    [
      { name: "التوحيد والعقيدة", url: "/tawhid" },
      { name: "الإيمان بالله", url: "/learn/iman-billah" },
      { name: "عقيدة أهل السنة", url: "/learn/aqeedat-ahl-sunnah" },
      { name: "أسماء الله الحسنى", url: "/asma-husna" },
      { name: "نواقض الإسلام", url: "/learn/nawaqid-islam" },
    ],
  ),
  "/learn/nawaqid-islam": learnSlugBody(
    "نواقض الإسلام: مدخل منضبط لمعنى الناقض مع ضوابط التكفير وعدم تكفير المعيّن بلا شروط وموانع.",
    "nawaqid-islam",
    [
      { name: "التوحيد والعقيدة", url: "/tawhid" },
      { name: "أقسام التوحيد", url: "/learn/aqsam-tawheed" },
      { name: "عقيدة أهل السنة", url: "/learn/aqeedat-ahl-sunnah" },
      { name: "موضوعات الإيمان", url: "/iman-topics" },
      { name: "منهجيتنا", url: "/methodology" },
    ],
  ),
  "/learn/iman-billah": learnSlugBody(
    "الإيمان بالله: وجوده وربوبيته وألوهيته وأسمائه وصفاته على منهج السلف — الركن الأول من أركان الإيمان.",
    "iman-billah",
    [
      { name: "التوحيد والعقيدة", url: "/tawhid" },
      { name: "أقسام التوحيد", url: "/learn/aqsam-tawheed" },
      { name: "أسماء الله الحسنى", url: "/asma-husna" },
      { name: "أركان الإيمان", url: "/arkan-iman" },
      { name: "عقيدة أهل السنة", url: "/learn/aqeedat-ahl-sunnah" },
    ],
  ),
};

for (const route of seoConfig.routes) {
  if (route.path.includes(":")) continue;
  if (route.path === "/rulings") continue; // يُضاف يدويًا أدناه كإعادة توجيه
  const privateRoute = isPrivateSeoPath(route.path);
  const effectiveRoute = privateRoute
    ? {
        ...route,
        description:
          String(route.description || "").trim().length >= 50
            ? route.description
            : ADMIN_DEFAULT_DESCRIPTION,
        robots: ADMIN_DEFAULT_ROBOTS,
        sitemap: false,
      }
    : route;
  addPage(effectiveRoute, {
    extraJsonLd: LIST_JSON_LD[route.path] || "",
    richBody: RICH_BODY_MAP[route.path] || "",
    sitemap: privateRoute ? false : Boolean(route.sitemap),
    priority: route.priority ?? 0.7,
    changefreq: route.changefreq ?? "weekly",
  });
}

// /rulings — إعادة توجيه SEO (لا sitemap؛ الواجهة تُحوّل إلى /fiqh)
{
  const rulingsRoute = seoConfig.routes.find((r) => r.path === "/rulings");
  if (rulingsRoute) {
    addPage(
      { ...rulingsRoute, sitemap: false, robots: "noindex, follow" },
      {
        richBody: RICH_BODY_MAP["/rulings"] || "",
        sitemap: false,
        priority: 0.3,
      },
    );
  }
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
for (const row of PUBLIC_FIQH_ITEMS) {
  const kind = fiqhItemKind(row);
  const desc = clamp(
    padDesc(row.summary || row.ruling_text || row.title, `${kind} من ${row.source_name || "مجمع الفقه الإسلامي الدولي"}`),
    300,
  );
  addPage(
    {
      path: `/fiqh-council/${row.slug || row.id}`,
      title: row.title,
      description: desc,
      ogType: "article",
      robots: "index, follow",
      keywords: [row.title, kind, row.category, row.council_name || row.source_name, "المجمع الفقهي"].filter(Boolean),
    },
    {
      parents: [{ name: "المجمع الفقهي الإسلامي", path: "/fiqh-council" }],
      priority: 0.7,
      richBody: fiqhItemRichBody(row),
    },
  );
}

// ملاحظة: قسم "/fatwa" المستقل أُلغي بالكامل من التطبيق (راجع commit 3a995462)؛
// المسارات /fatwa و/fatwa/:id و/rulings تُحوَّل إلى /fiqh.
// لا تُولَّد صفحات ثابتة لهذا المسار كي لا تبقى صفحات SEO يتيمة تُفهرَس ثم تُحيل فوراً.
// الفتاوى المؤسسية الموثقة بقيت عمداً تحت /fiqh-council/fatwas ولها توليد منفصل أعلاه.

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

// موسوعة الأحكام مؤرشفة — لا تُولَّد صفحات /rulings/:id في sitemap.

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
  const related = LIBRARY_CATALOG.filter((b) => b.id !== row.id && b.category && b.category === row.category)
    .slice(0, 6)
    .map((b) => ({ name: b.title, url: `/library/${b.id}`, note: b.author }));
  const desc = tidyDesc(row.description || row.title);
  // body = ظاهر كامل؛ description = meta (قد تُقصّ لاحقاً دون لمس الظاهر)
  addPage(
    {
      path: `/library/${row.id}`,
      title: row.title,
      description: clamp(padDesc(desc, `كتاب من المكتبة الشرعية في ${SITE_NAME}`), 160),
      body: desc,
      ogType: "book",
    },
    {
      extraJsonLd: bookJsonLdScript({ ...row, description: desc }),
      parents: [{ name: "المكتبة العلمية", path: "/library" }],
      priority: 0.7,
      richBody: `<h2>بيانات الكتاب</h2>
<ul>
  ${row.author ? `<li>المؤلف: ${escapeHtml(row.author)}</li>` : ""}
  ${row.category ? `<li>التصنيف: ${escapeHtml(row.category)}</li>` : ""}
  ${row.type ? `<li>النوع: ${escapeHtml(row.type)}</li>` : ""}
  ${row.parts_label ? `<li>الأجزاء: ${escapeHtml(row.parts_label)}</li>` : ""}
  ${(() => {
    const label = librarySourceLabel(row.external_url);
    if (!label || !row.external_url) return "";
    return `<li>رابط قراءة/مرجع رقمي: <a href="${escapeHtml(row.external_url)}" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`;
  })()}
</ul>
${linkList("كتب ذات صلة في نفس التصنيف", related)}
${linkList("روابط ذات صلة", [
  { name: "المكتبة العلمية", url: "/library" },
  { name: "أعلام العلماء", url: "/scholars" },
  ...(row.category === "حديث"
    ? [
        { name: "علوم الحديث", url: "/hadith-science" },
        { name: "الأحاديث النبوية", url: "/hadith" },
      ]
    : []),
  ...(row.category === "فقه" || /فقه/.test(row.category || "")
    ? [{ name: "الفقه الإسلامي", url: "/fiqh" }]
    : []),
  ...(row.category === "تفسير" || /تفسير|قرآن/.test(row.category || "")
    ? [{ name: "مركز القرآن", url: "/quran-hub" }]
    : []),
])}`,
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ٤) المسارات الديناميكية التي كانت تسقط على الرئيسية (صفر صفحات مُصيَّرة سابقاً)
// ─────────────────────────────────────────────────────────────────────────────

// العلماء — Person JSON-LD (٩٦ ترجمة). المعرّفات تُقرأ وقت البناء من scholars-data.ts.
for (const s of SCHOLARS) {
  const bioFull = String(s.bio || "").replace(/\s+/g, " ").trim();
  const bioShort = clamp(bioFull, 155);
  addPage(
    {
      path: `/scholars/${s.id}`,
      title: `${s.name} — سيرة العالم`,
      // meta فقط — يجوز «…»
      description: clamp(padDesc(bioShort, `ترجمة ${s.name} في ${SITE_NAME}`), 155),
      // النص الظاهر الكامل — بلا قصّ
      body: bioFull,
      ogType: "profile",
    },
    {
      extraJsonLd: scholarJsonLdScript(s),
      parents: [{ name: "أعلام العلماء المسلمين", path: "/scholars" }],
      // بيانات + مؤلفات؛ النبذة في route.body
      richBody: `<ul>
  ${s.fullName ? `<li>الاسم الكامل: ${escapeHtml(s.fullName)}</li>` : ""}
  ${s.era ? `<li>التصنيف: ${escapeHtml(s.era)}</li>` : ""}
  ${s.died ? `<li>الوفاة: ${escapeHtml(s.died)}</li>` : ""}
  ${s.region ? `<li>الموطن: ${escapeHtml(s.region)}</li>` : ""}
  ${s.madhhab ? `<li>المذهب: ${escapeHtml(s.madhhab)}</li>` : ""}
  ${s.specialty?.length ? `<li>التخصص: ${escapeHtml(s.specialty.join("، "))}</li>` : ""}
</ul>
${s.key_works?.length ? `<h2>أبرز المؤلفات</h2>\n<ul>\n  ${s.key_works.map((w) => `<li>${escapeHtml(w)}</li>`).join("\n  ")}\n</ul>` : ""}`,
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

// الأمم السابقة — من nations-seed.ts
for (const n of NATIONS) {
  const placeNote = n.approxLocation?.label
    ? `الموقع المذكور للعرض: ${n.approxLocation.label} (تقريبي / لا يُجزم به).`
    : "لم يُعيَّن موقع جغرافي قطعي في نص صحيح.";
  addPage(
    {
      path: `/nations/${n.slug}`,
      title: n.name,
      description: clamp(
        padDesc(n.summary || n.sin || n.name, `قصة ${n.name} في القرآن مع التمييز بين الثابت والمحتمل.`),
        300,
      ),
      keywords: [n.name, ...(n.aliases || []), "الأمم السابقة", "قصص القرآن", n.prophet?.name].filter(Boolean),
      ogType: "article",
    },
    {
      parents: [{ name: "الأمم السابقة", path: "/nations" }],
      richBody: `<h2>ملخص</h2>
<p>${escapeHtml(n.summary || "")}</p>
<ul>
  ${n.prophet?.name ? `<li>النبي المرسل: ${escapeHtml(n.prophet.name)}</li>` : ""}
  ${n.sin ? `<li>الذنب المذكور: ${escapeHtml(n.sin)}</li>` : ""}
  ${n.punishment?.type ? `<li>نوع العذاب: ${escapeHtml(n.punishment.type)}</li>` : ""}
  <li>${escapeHtml(placeNote)}</li>
</ul>`,
      priority: 0.72,
      changefreq: "monthly",
    },
  );
}

// الذين ذكروا في القرآن — من people.json
for (const person of QURAN_PEOPLE) {
  const peopleSuffix = `${person.nameAr} في فهرس الذين ذكروا في القرآن، مع مواضع الآيات دون توسع في غير الثابت.`;
  addPage(
    {
      path: `/quran/people/${person.slug}`,
      title: `${person.nameAr} في القرآن`,
      description: clamp(padDesc(person.definition, peopleSuffix), 300),
      keywords: [person.nameAr, ...(person.aliases || []), "الذين ذكروا في القرآن", "أعلام القرآن"].filter(Boolean),
      ogType: "article",
    },
    {
      parents: [{ name: "الذين ذكروا في القرآن", path: "/quran/people" }],
      richBody: `<h2>التعريف</h2>
<p>${escapeHtml(person.definition)}</p>
${person.whyMentioned ? `<h2>سبب الذكر</h2>\n<p>${escapeHtml(person.whyMentioned)}</p>` : ""}
${person.lessons?.length ? `<h2>العبر</h2>\n<ul>\n  ${person.lessons.map((l) => `<li>${escapeHtml(l)}</li>`).join("\n  ")}\n</ul>` : ""}`,
      priority: 0.7,
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
${issue.ruling_summary ? `<h2>الخلاصة</h2>\n<p>${escapeHtml(issue.ruling_summary)}</p>` : ""}
${issue.evidence_summary ? `<h2>المستند</h2>\n<p>${escapeHtml(issue.evidence_summary)}</p>` : ""}
${issue.category ? `<p>التصنيف: ${escapeHtml(issue.category)}</p>` : ""}`,
      priority: 0.69,
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

// أقسام الأذكار — `/adhkar/:slug` (مصدر واحد: adhkar-seed.ts)
for (const c of FEATURED_ADHKAR) {
  const desc = clamp(padDesc(c.description, `${c.name} على ${SITE_NAME}`), 158);
  addPage(
    {
      path: `/adhkar/${c.slug}`,
      title: c.name,
      description: desc,
      ogType: "website",
    },
    {
      parents: [{ name: "الأذكار", path: "/adhkar" }],
      priority: 0.65,
      changefreq: "weekly",
      richBody: `<p>${escapeHtml(desc)}</p>`,
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
const sitemapPages = pages.filter(
  (p) =>
    p.sitemap &&
    !(p.route.robots || "").includes("noindex") &&
    !IA_REDIRECTS[p.route.path],
);
const LASTMOD_TODAY = "2026-08-15";
const LASTMOD_PATHS = new Set([
  "/",
  "/lessons",
  "/quran-hub",
  "/mushaf",
  "/adhkar",
  "/prayer-times",
  "/fiqh",
  "/search",
  "/scholars",
  "/library",
]);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPages
  .map((p) => {
    const loc = escapeXml(absoluteUrl(p.route.path));
    const lastmod = LASTMOD_PATHS.has(p.route.path)
      ? `\n    <lastmod>${LASTMOD_TODAY}</lastmod>`
      : "";
    return `  <url>\n    <loc>${loc}</loc>${lastmod}\n    <changefreq>${escapeXml(p.changefreq)}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`;
  })
  .join("\n")}
</urlset>
`;

// robots.txt — يسمح صراحة بأصول العلامة وملفات الأيقونات/الـmanifest
const robots = `# ${SITE_URL}/robots.txt
# ${SITE_NAME}

User-agent: *
Allow: /
Allow: /brand/
Allow: /icons/
Allow: /favicon.ico
Allow: /apple-touch-icon.png
Allow: /icon-192.png
Allow: /icon-512.png
Allow: /manifest.webmanifest
Allow: /manifest.json
Allow: /site.webmanifest
Disallow: /admin
Disallow: /admin/
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /internal
Disallow: /internal/
Disallow: /login
Disallow: /register
Disallow: /auth/
Disallow: /vault
Disallow: /api/
Disallow: /search/

Sitemap: ${SITE_URL}/sitemap.xml
`;

// تواريخ التغذية ثابتة لا لحظة البناء. سجلات المصدر (fiqh_decisions/rulings/
// courses) لا تحمل أي حقل تاريخ، وكان BUILD_DATE يُكتب في pubDate لكل عنصر —
// فيرى قارئ RSS كل العناصر «نُشرت للتو» بعد كل نشر، وهو ادّعاء غير صحيح
// ويُعيد كتابة feed.xml المُتتبَّع في git في كل بناء بلا تغيّر محتوى.
// حين تُضاف تواريخ حقيقية للسجلات يُشتق pubDate منها لكل عنصر.
const FEED_DATE = new Date("2026-07-25T00:00:00Z").toUTCString();
const rssItems = [
  ...(PUBLIC_FIQH_ITEMS || []).slice(0, 6).map((row) => ({
    title: `[${fiqhItemKind(row)} — مجمع فقهي] ${row.title}`,
    link: absoluteUrl(`/fiqh-council/${row.slug || row.id}`),
    description: `مادة من مجمع فقهي (${fiqhItemKind(row)}): ${row.title} — ${row.category || "المجمع الفقهي الإسلامي"}`,
    category: "مواد المجامع الفقهية",
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
    <lastBuildDate>${FEED_DATE}</lastBuildDate>
    <managingEditor>${escapeXml(SITE.contactEmail)} (${escapeXml(SITE_NAME)})</managingEditor>
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
      <pubDate>${item.pubDate || FEED_DATE}</pubDate>
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
    `  مسائل فقهية: ${PUBLIC_FIQH_ISSUES.length} · مواضيع: ${TOPICS.length} · مؤذنون: ${MUEZZINS.length}`,
    `  دروس: ${lessonRows.length} · كتب: ${LIBRARY_CATALOG.length}`,
  ].join("\n"),
);
} // end main()

try {
  await main();
} catch (err) {
  // توليد SEO مساند للبناء — لا يُسقط pnpm build عند أعطال غير حرجة
  // (مثل ERR_UNKNOWN_FILE_EXTENSION في بيئات Node بلا محمل TS).
  const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
  const message = err instanceof Error ? err.message : String(err);
  console.warn(
    `[generate-seo] warning: SEO generation failed${code ? ` (${code})` : ""} — build continues.`,
  );
  console.warn(`[generate-seo] ${message}`);
  process.exitCode = 0;
}
