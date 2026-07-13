import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const LESSONS_SEED = JSON.parse(
  await readFile(resolve(__dirname, "lessons-seed.snapshot.json"), "utf8"),
);
const PLATFORM_SEED = JSON.parse(
  await readFile(resolve(__dirname, "platform-seed.snapshot.json"), "utf8"),
);
const LIBRARY_CATALOG = JSON.parse(
  await readFile(resolve(appRoot, "src/data/library-catalog.json"), "utf8"),
);
const publicDir = resolve(appRoot, "public");
const seoPrerenderDir = resolve(appRoot, "seo-prerender");
const seoConfigPath = resolve(appRoot, "src/lib/seo-routes.json");

const seoConfig = JSON.parse(await readFile(seoConfigPath, "utf8"));
const buildDate = new Date().toISOString().slice(0, 10);

function absoluteUrl(path) {
  return new URL(path, seoConfig.siteUrl).toString();
}

function padDesc(text, suffix) {
  if (!text) return suffix;
  return text.length >= 50 ? text : `${text}، ${suffix}`;
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
  return base || `${row.title} — درس شرعي على منصة المجلس العلمي`;
}

function lessonJsonLdScript(row) {
  const payload = {
    "@context": "https://schema.org",
    "@type": row.is_course || row.activity_type === "دورة" ? "Course" : "EducationEvent",
    name: row.title,
    description: row.description || lessonDescription(row),
    url: absoluteUrl(`/lessons/${row.id}`),
    image: absoluteUrl(row.sheikh_image_url || row.poster_image_url || seoConfig.defaultImage),
    inLanguage: "ar",
    organizer: { "@type": "Organization", name: seoConfig.siteName, url: seoConfig.siteUrl },
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
    keywords: (row.keywords || [row.category]).join(", "),
  };
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function siteJsonLdScript() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    logo: absoluteUrl(seoConfig.defaultImage),
    inLanguage: "ar",
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    inLanguage: "ar",
    potentialAction: {
      "@type": "SearchAction",
      target: `${seoConfig.siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return `<script type="application/ld+json">${JSON.stringify([org, site])}</script>`;
}

function bookJsonLdScript(row) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: row.title,
    author: { "@type": "Person", name: row.author },
    description: row.description || row.title,
    inLanguage: "ar",
    genre: row.category || "فقه إسلامي",
    url: absoluteUrl(`/library/${row.id}`),
    publisher: { "@type": "Organization", name: seoConfig.siteName, url: seoConfig.siteUrl },
  };
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function courseJsonLdScript(row) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: row.title || row.name,
    description: row.description || row.title || row.name,
    inLanguage: "ar",
    url: absoluteUrl(`/annual-courses/${row.id}`),
    provider: { "@type": "Organization", name: seoConfig.siteName, url: seoConfig.siteUrl },
    ...(row.instructor ? { instructor: { "@type": "Person", name: row.instructor } } : {}),
  };
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function fatwaQaJsonLdScript(row) {
  const payload = {
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
  };
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function fatwaListFaqJsonLdScript(fatwas) {
  const items = fatwas
    .filter((row) => row.answer)
    .slice(0, 8)
    .map((row) => ({
      "@type": "Question",
      name: row.question,
      acceptedAnswer: { "@type": "Answer", text: row.answer },
    }));
  if (!items.length) return "";
  const payload = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items };
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function itemListJsonLdScript(items) {
  if (!items?.length) return "";
  const payload = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.slice(0, 20).map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.url),
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function breadcrumbJsonLdScript(items) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function prerenderHtml(route, extraJsonLd = "", richBody = "") {
  const canonical = absoluteUrl(route.path);
  const image = absoluteUrl(route.image || seoConfig.defaultImage);
  const keywords = [...new Set([...(route.keywords || []), ...seoConfig.defaultKeywords])].join(", ");
  const robots = route.robots || "index, follow";
  const ogType = route.ogType || "website";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(route.title)}</title>
    <meta name="description" content="${escapeHtml(route.description)}" />
    <meta name="keywords" content="${escapeHtml(keywords)}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="author" content="${escapeHtml(seoConfig.siteName)}" />
    <meta name="theme-color" content="#164E3C" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="ar" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}" />
    <meta property="og:site_name" content="${escapeHtml(seoConfig.siteName)}" />
    <meta property="og:locale" content="ar_KW" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${escapeHtml(route.title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:image:alt" content="${escapeHtml(route.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(route.title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    ${route.path === "/" ? siteJsonLdScript() : `<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebPage","name":route.title.replace(/ \| [^|]+$/,""),"description":route.description,"url":canonical,"inLanguage":"ar","publisher":{"@type":"Organization","name":seoConfig.siteName,"url":seoConfig.siteUrl,"logo":{"@type":"ImageObject","url":absoluteUrl(seoConfig.defaultImage)}}})}</script>`}
    ${route.path !== "/" ? (() => {
      const segs = route.path.split("/").filter(Boolean);
      const items = [{ name: "الرئيسية", path: "/" }];
      let cur = "";
      for (const seg of segs) {
        cur += `/${seg}`;
        const isLast = cur === route.path;
        const matched = seoConfig.routes.find(r => r.path === cur);
        // "/quran" لم يعد صفحة قائمة بذاتها (حُذف قارئ المصحف)؛ أي مسار فرعي
        // تحته (مثل /quran/tajweed) يُشير في فتات الخبز إلى مركز القرآن بدلاً منه.
        if (!matched && !isLast && cur === "/quran") {
          items.push({ name: "القرآن الكريم", path: "/quran-hub" });
          continue;
        }
        items.push({ name: matched ? matched.title.split(" | ")[0] : (route.title.split(" | ")[0] || seg), path: cur });
      }
      return breadcrumbJsonLdScript(items);
    })() : ""}
    ${extraJsonLd}
  </head>
  <body>
    <header>
      <nav>
        <a href="${escapeHtml(seoConfig.siteUrl)}">${escapeHtml(seoConfig.siteName)}</a>
        <a href="${escapeHtml(seoConfig.siteUrl)}/lessons">الدروس</a>
        <a href="${escapeHtml(seoConfig.siteUrl)}/quran">القرآن</a>
        <a href="${escapeHtml(seoConfig.siteUrl)}/adhkar">الأذكار</a>
        <a href="${escapeHtml(seoConfig.siteUrl)}/search">البحث</a>
      </nav>
    </header>
    <main>
      <article>
        <h1>${escapeHtml(route.title)}</h1>
        <p>${escapeHtml(route.description)}</p>
        ${richBody}
        <nav aria-label="التنقل">
          <a href="${escapeHtml(seoConfig.siteUrl)}">الرئيسية</a>
          ${route.path !== "/" ? `<a href="${escapeHtml(canonical)}">${escapeHtml(route.title.split(" | ")[0])}</a>` : ""}
        </nav>
      </article>
    </main>
    <footer>
      <p>© ${new Date().getFullYear()} ${escapeHtml(seoConfig.siteName)} — ${escapeHtml(seoConfig.siteUrl)}</p>
    </footer>
  </body>
</html>`;
}

const staticRoutes = seoConfig.routes.filter((route) => route.sitemap);
const lessonRows = dedupeLessons(LESSONS_SEED);

const staticEntries = staticRoutes.map((route) => {
  const loc = escapeXml(absoluteUrl(route.path));
  const changefreq = route.changefreq ? `\n    <changefreq>${escapeXml(route.changefreq)}</changefreq>` : "";
  const priority = route.priority ? `\n    <priority>${escapeXml(route.priority)}</priority>` : "";
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${buildDate}</lastmod>${changefreq}${priority}\n  </url>`;
});

const lessonEntries = lessonRows.map((row) => {
  const loc = escapeXml(absoluteUrl(`/lessons/${row.id}`));
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${buildDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.72</priority>\n  </url>`;
});

const verifiedFiqhSessions = (PLATFORM_SEED.fiqh_sessions || []).filter(
  (row) => row.verification_status === "verified" && row.publish_status === "published",
);

const platformEntries = [
  ...(PLATFORM_SEED.fiqh_decisions || []).map((row) => ({
    path: `/fiqh-council/${row.slug || row.id}`,
    title: `${row.title} | ${seoConfig.siteName}`,
    description: padDesc(row.title, "قرار من المجمع الفقهي الإسلامي الدولي"),
    priority: 0.7,
    robots: "index, follow",
  })),
  ...(PLATFORM_SEED.fatwas || []).map((row) => ({
    path: `/fatwa/${row.id}`,
    title: `${row.question} | ${seoConfig.siteName}`,
    description: padDesc(row.question, "فتوى شرعية من المجلس العلمي"),
    priority: 0.71,
  })),
  ...(PLATFORM_SEED.rulings || []).map((row) => ({
    path: `/rulings/${row.id}`,
    title: `${row.title} | ${seoConfig.siteName}`,
    description: padDesc(row.title, "حكم شرعي من الموسوعة الفقهية"),
    priority: 0.69,
  })),
  ...(PLATFORM_SEED.courses || []).map((row) => ({
    path: `/annual-courses/${row.id}`,
    title: `${row.title} | ${seoConfig.siteName}`,
    description: padDesc(row.title, "دورة علمية شرعية من المجلس العلمي"),
    priority: 0.68,
  })),
  ...verifiedFiqhSessions.map((row) => ({
    path: `/fiqh-council/sessions/${row.slug}`,
    title: `${row.title} | ${seoConfig.siteName}`,
    description: padDesc(row.title, "دورة من دورات المجمع الفقهي الإسلامي"),
    priority: 0.69,
    robots: "index, follow",
  })),
  ...LIBRARY_CATALOG.map((row) => ({
    path: `/library/${row.id}`,
    title: `${row.title} | المكتبة العلمية — ${seoConfig.siteName}`,
    description: padDesc(row.description || row.title, "كتاب من المكتبة الشرعية في المجلس العلمي"),
    priority: 0.7,
  })),
].map((row) => {
  const loc = escapeXml(absoluteUrl(row.path));
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${buildDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${row.priority}</priority>\n  </url>`;
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...lessonEntries, ...platformEntries].join("\n")}
</urlset>
`;

const robots = `# ${seoConfig.siteUrl}/robots.txt
# المجلس العلمي

User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /login
Disallow: /api/
Disallow: /search/

Host: ${seoConfig.siteUrl.replace(/^https?:\/\//, "")}
Sitemap: ${seoConfig.siteUrl}/sitemap.xml

# RSS Feed
# ${seoConfig.siteUrl}/feed.xml
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
    description: `دورة علمية: ${row.title || row.name || "دورة شرعية"} — المجلس العلمي`,
    category: "دورات علمية",
  })),
].filter(Boolean);

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(seoConfig.siteName)}</title>
    <link>${escapeXml(seoConfig.siteUrl)}</link>
    <description>آخر المستجدات العلمية — قرارات وفتاوى وأحكام ودورات</description>
    <language>ar</language>
    <lastBuildDate>${BUILD_DATE}</lastBuildDate>
    <managingEditor>yalabdullmohsen1@gmail.com (المجلس العلمي)</managingEditor>
    <image>
      <url>${escapeXml(absoluteUrl("/logo.png"))}</url>
      <title>${escapeXml(seoConfig.siteName)}</title>
      <link>${escapeXml(seoConfig.siteUrl)}</link>
    </image>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml"/>
    ${rssItems.map((item) => `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${BUILD_DATE}</pubDate>
      ${item.category ? `<dc:subject>${escapeXml(item.category)}</dc:subject>` : ""}
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
    </item>`).join("\n    ")}
  </channel>
</rss>
`;

await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(resolve(publicDir, "robots.txt"), robots, "utf8");
await writeFile(resolve(publicDir, "feed.xml"), feed, "utf8");

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

const ISLAMIC_SCHOLARS = [
  { id: "abu-hanifa", name: "أبو حنيفة النعمان" },
  { id: "malik", name: "الإمام مالك" },
  { id: "shafi", name: "الإمام الشافعي" },
  { id: "ahmad", name: "الإمام أحمد" },
  { id: "bukhari", name: "الإمام البخاري" },
  { id: "muslim", name: "الإمام مسلم" },
  { id: "ibn-taymiyya", name: "ابن تيمية" },
  { id: "ibn-qayyim", name: "ابن القيم" },
  { id: "nawawi", name: "الإمام النووي" },
  { id: "ibn-hajar", name: "ابن حجر العسقلاني" },
  { id: "ibn-baz", name: "الشيخ ابن باز" },
  { id: "ibn-uthaymeen", name: "الشيخ ابن عثيمين" },
  { id: "albani", name: "الشيخ الألباني" },
  { id: "ghazali", name: "الإمام الغزالي" },
  { id: "ibn-kathir", name: "ابن كثير" },
];

const PROPHETS_NAMES = [
  { slug: "adam", name: "آدم" }, { slug: "idris", name: "إدريس" }, { slug: "nuh", name: "نوح" },
  { slug: "hud", name: "هود" }, { slug: "salih", name: "صالح" }, { slug: "ibrahim", name: "إبراهيم" },
  { slug: "lut", name: "لوط" }, { slug: "ismail", name: "إسماعيل" }, { slug: "is-haq", name: "إسحاق" },
  { slug: "yaqub", name: "يعقوب" }, { slug: "yusuf", name: "يوسف" }, { slug: "ayyub", name: "أيوب" },
  { slug: "shuayb", name: "شعيب" }, { slug: "musa", name: "موسى" }, { slug: "harun", name: "هارون" },
  { slug: "dhul-kifl", name: "ذو الكفل" }, { slug: "dawud", name: "داود" }, { slug: "sulayman", name: "سليمان" },
  { slug: "ilyas", name: "إلياس" }, { slug: "al-yasa", name: "اليسع" }, { slug: "yunus", name: "يونس" },
  { slug: "zakariyya", name: "زكريا" }, { slug: "yahya", name: "يحيى" }, { slug: "isa", name: "عيسى" },
  { slug: "muhammad", name: "محمد ﷺ" },
];

const fatwaFaqScript = fatwaListFaqJsonLdScript(PLATFORM_SEED.fatwas || []);
const qaFaqScript = fatwaListFaqJsonLdScript(PLATFORM_SEED.qa_items || []);

const libraryItemListScript = itemListJsonLdScript(
  LIBRARY_CATALOG.map((b) => ({ name: b.title, url: `/library/${b.id}` }))
);
const fiqhDecisionsItemListScript = itemListJsonLdScript(
  (PLATFORM_SEED.fiqh_decisions || []).map((r) => ({ name: r.title, url: `/fiqh-council/${r.slug || r.id}` }))
);
const fatwaItemListScript = itemListJsonLdScript(
  (PLATFORM_SEED.fatwas || []).map((r) => ({ name: r.question, url: `/fatwa/${r.id}` }))
);
const rulingItemListScript = itemListJsonLdScript(
  (PLATFORM_SEED.rulings || []).map((r) => ({ name: r.title, url: `/rulings/${r.id}` }))
);
const lessonItemListScript = itemListJsonLdScript(
  LESSONS_SEED.slice(0, 20).map((r) => ({ name: r.title, url: `/lessons/${r.id}` }))
);
const adhkarItemListScript = itemListJsonLdScript(
  ADHKAR_CATEGORIES.map((c) => ({ name: c.name, url: `/adhkar?cat=${c.id}` }))
);
const prophetsItemListScript = itemListJsonLdScript(
  PROPHETS_NAMES.map((p) => ({ name: `قصة نبي الله ${p.name} عليه السلام`, url: `/prophets/${p.slug}` }))
);
const scholarsItemListScript = itemListJsonLdScript(
  ISLAMIC_SCHOLARS.map((s) => ({ name: s.name, url: `/scholars#${s.id}` }))
);

const LEARNING_PATHS_SEED = [
  { slug: "tawhid-basics", title: "مدخل إلى التوحيد" },
  { slug: "aqeedah-wasitiyya", title: "شرح العقيدة الواسطية" },
  { slug: "fiqh-ibadah", title: "فقه العبادات الأساسية" },
  { slug: "fiqh-muamalat", title: "فقه المعاملات المالية" },
  { slug: "fiqh-usul", title: "مدخل إلى أصول الفقه" },
  { slug: "tajwid-level1", title: "أحكام التجويد للمبتدئين" },
  { slug: "tafsir-juz-amma", title: "تفسير جزء عمّ" },
  { slug: "ulum-quran-intro", title: "مدخل في علوم القرآن" },
  { slug: "arbaeen-study", title: "دراسة الأربعون النووية" },
  { slug: "mustalah-hadith", title: "مصطلح الحديث" },
  { slug: "akhlaq-islamiyya", title: "الأخلاق الإسلامية" },
  { slug: "tazkiyah-nafs", title: "تزكية النفس" },
  { slug: "seerah-mukhtasara", title: "السيرة النبوية المختصرة" },
  { slug: "ghazawat", title: "غزوات النبي ﷺ" },
  { slug: "tarbiyah-dhati", title: "التربية الذاتية لطالب العلم" },
];
const learningPathsItemListScript = itemListJsonLdScript(
  LEARNING_PATHS_SEED.map((p) => ({ name: p.title, url: `/learning/paths/${p.slug}` }))
);

const ASMAA_HUSNA = [
  { num:1,  arabic:"الله",       meaning:"الاسم الجامع لجميع صفات الألوهية" },
  { num:2,  arabic:"الرحمن",    meaning:"واسع الرحمة لجميع الخلق" },
  { num:3,  arabic:"الرحيم",    meaning:"خاصّ الرحمة بالمؤمنين" },
  { num:4,  arabic:"الملك",     meaning:"المالك الحقيقي لكل شيء" },
  { num:5,  arabic:"القدوس",    meaning:"المنزّه عن كل عيب ونقص" },
  { num:6,  arabic:"السلام",    meaning:"ذو السلامة من كل نقص" },
  { num:7,  arabic:"المؤمن",    meaning:"المصدق عباده، المؤمِّن من خوفه" },
  { num:8,  arabic:"المهيمن",   meaning:"الرقيب الشاهد على كل شيء" },
  { num:9,  arabic:"العزيز",    meaning:"الغالب الذي لا يُغلب" },
  { num:10, arabic:"الجبار",    meaning:"القاهر الذي يجبر الكسر" },
  { num:11, arabic:"المتكبر",   meaning:"المتعظّم الذي له الكبرياء" },
  { num:12, arabic:"الخالق",    meaning:"المُبدع الموجد من العدم" },
  { num:13, arabic:"البارئ",    meaning:"الخالق المميّز بين الخلق" },
  { num:14, arabic:"المصوّر",   meaning:"واهب الصور والأشكال" },
  { num:15, arabic:"الغفار",    meaning:"كثير المغفرة والعفو" },
  { num:16, arabic:"القهار",    meaning:"الغالب لكل شيء بالقهر والقدرة" },
  { num:17, arabic:"الوهاب",    meaning:"كثير العطاء بلا منّة" },
  { num:18, arabic:"الرزاق",    meaning:"الضامن لأرزاق جميع الخلق" },
  { num:19, arabic:"الفتّاح",   meaning:"فاتح أبواب الخير والرحمة" },
  { num:20, arabic:"العليم",    meaning:"المحيط علمه بكل شيء" },
];

const DUAS_SEED = [
  { id:"sabah-1",  title:"دعاء الصباح الأول" },
  { id:"sabah-2",  title:"سيد الاستغفار في الصباح" },
  { id:"masa-1",   title:"أذكار المساء، الآية الكريمة" },
  { id:"salah-1",  title:"دعاء الاستفتاح" },
  { id:"salah-2",  title:"دعاء الركوع" },
  { id:"salah-3",  title:"دعاء السجود" },
  { id:"salah-4",  title:"دعاء التشهد الأخير" },
  { id:"safar-1",  title:"دعاء السفر" },
  { id:"karb-1",   title:"دعاء الكرب" },
  { id:"karb-2",   title:"دعاء الهمّ والحزن" },
  { id:"nawm-1",   title:"دعاء النوم" },
  { id:"nawm-2",   title:"دعاء الاستيقاظ" },
  { id:"akl-1",    title:"دعاء الطعام" },
  { id:"akl-2",    title:"دعاء الفراغ من الطعام" },
  { id:"masjid-1", title:"دعاء دخول المسجد" },
  { id:"masjid-2", title:"دعاء الخروج من المسجد" },
  { id:"wudu-1",   title:"دعاء الوضوء" },
  { id:"shifa-1",  title:"دعاء الشفاء" },
  { id:"ziyara-1", title:"دعاء زيارة المريض" },
  { id:"duha-1",   title:"دعاء صلاة الضحى" },
];

const asmaaItemListScript = `<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "أسماء الله الحسنى",
  description: "أسماء الله الحسنى التسعة والتسعون مع المعنى",
  numberOfItems: 99,
  itemListElement: ASMAA_HUSNA.map((a, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: `${a.arabic} — ${a.meaning}`,
    url: `https://majlisilm.com/asma-husna#name-${a.num}`,
  })),
})}</script>`;

const duasItemListScript = `<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "الأدعية الشرعية الموثقة",
  description: "مكتبة الأدعية الشرعية من القرآن والسنة مع المعنى والمصدر",
  itemListElement: DUAS_SEED.map((d, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: d.title,
    url: `https://majlisilm.com/duas#${d.id}`,
  })),
})}</script>`;

// مسارات noindex: لا تظهر في sitemap لكن تُحدَّث prerender بالمتا الصحيح
const noindexRoutes = seoConfig.routes.filter(
  (r) => !r.sitemap && r.robots && r.robots.includes("noindex") && !r.path.includes(":"),
);

for (const route of noindexRoutes) {
  const routeDir = resolve(seoPrerenderDir, route.path.slice(1));
  await mkdir(routeDir, { recursive: true });
  await writeFile(resolve(routeDir, "index.html"), prerenderHtml(route), "utf8");
}

// محتوى غني لصفحات رئيسية (روابط فعلية لمحركات البحث والمستخدمين بدون JS)
const lessonsRichBody = `<h2>أبرز الدروس والدورات</h2>
<ul>
  ${dedupeLessons(LESSONS_SEED).slice(0, 15).map(r => `<li><a href="${absoluteUrl(`/lessons/${r.id}`)}">${escapeHtml(r.title)}</a>${r.speaker_name ? ` — ${escapeHtml(r.speaker_name)}` : ""}</li>`).join("\n  ")}
</ul>`;

const libraryRichBody = `<h2>من الكتب المتاحة</h2>
<ul>
  ${LIBRARY_CATALOG.slice(0, 15).map(b => `<li><a href="${absoluteUrl(`/library/${b.id}`)}">${escapeHtml(b.title)}</a>${b.author ? ` — ${escapeHtml(b.author)}` : ""}</li>`).join("\n  ")}
</ul>`;

const adhkarRichBody = `<h2>أقسام الأذكار</h2>
<ul>
  ${ADHKAR_CATEGORIES.map(c => `<li><a href="${absoluteUrl(`/adhkar?cat=${c.id}`)}">${escapeHtml(c.name)}</a></li>`).join("\n  ")}
</ul>`;

const scholarsRichBody = `<h2>من علماء المسلمين</h2>
<ul>
  ${ISLAMIC_SCHOLARS.map(s => `<li><a href="${absoluteUrl(`/scholars#${s.id}`)}">${escapeHtml(s.name)}</a></li>`).join("\n  ")}
</ul>`;

const fatwaRichBody = `<h2>فتاوى شرعية</h2>
<ul>
  ${(PLATFORM_SEED.fatwas || []).slice(0, 12).map(f => `<li><a href="${absoluteUrl(`/fatwa/${f.id}`)}">${escapeHtml(f.question)}</a></li>`).join("\n  ")}
</ul>`;

const prophetsRichBody = `<h2>قصص الأنبياء</h2>
<ul>
  ${PROPHETS_NAMES.map(p => `<li><a href="${absoluteUrl(`/prophets/${p.slug}`)}">${escapeHtml(`نبي الله ${p.name} عليه السلام`)}</a></li>`).join("\n  ")}
</ul>`;

const RICH_BODY_MAP = {
  "/lessons": lessonsRichBody,
  "/library": libraryRichBody,
  "/adhkar": adhkarRichBody,
  "/scholars": scholarsRichBody,
  "/fatwa": fatwaRichBody,
  "/prophets": prophetsRichBody,
};

for (const route of staticRoutes) {
  const routeDir =
    route.path === "/"
      ? seoPrerenderDir
      : resolve(seoPrerenderDir, route.path.slice(1));
  await mkdir(routeDir, { recursive: true });
  const staticExtraJsonLd =
    route.path === "/fatwa" ? fatwaFaqScript + fatwaItemListScript :
    route.path === "/qa" ? qaFaqScript :
    route.path === "/library" ? libraryItemListScript :
    route.path === "/fiqh-council" ? fiqhDecisionsItemListScript :
    route.path === "/rulings" ? rulingItemListScript :
    route.path === "/lessons" ? lessonItemListScript :
    route.path === "/adhkar" ? adhkarItemListScript :
    route.path === "/prophets" ? prophetsItemListScript :
    route.path === "/scholars" ? scholarsItemListScript :
    route.path === "/learning/paths" ? learningPathsItemListScript :
    route.path === "/asma-husna" ? asmaaItemListScript :
    route.path === "/duas" ? duasItemListScript : "";
  const staticRichBody = RICH_BODY_MAP[route.path] || "";
  await writeFile(resolve(routeDir, "index.html"), prerenderHtml(route, staticExtraJsonLd, staticRichBody), "utf8");

  if (route.path !== "/") {
    const legacyPublicDir = resolve(publicDir, route.path.slice(1));
    for (const legacyName of ["index.html", "index.seo.html"]) {
      try {
        await unlink(resolve(legacyPublicDir, legacyName));
      } catch {
        /* optional */
      }
    }
  }
}

for (const row of lessonRows) {
  const lessonRoute = {
    path: `/lessons/${row.id}`,
    title: `${row.title} | ${seoConfig.siteName}`,
    description: padDesc(lessonDescription(row), "درس شرعي على منصة المجلس العلمي"),
    keywords: [row.title, row.speaker_name, row.category, "دروس شرعية", "محاضرات إسلامية", "دورات شرعية"],
    image: row.sheikh_image_url || row.poster_image_url || seoConfig.defaultImage,
    ogType: "article",
  };
  const routeDir = resolve(seoPrerenderDir, "lessons", row.id);
  await mkdir(routeDir, { recursive: true });
  await writeFile(
    resolve(routeDir, "index.html"),
    prerenderHtml(lessonRoute, lessonJsonLdScript(row)),
    "utf8",
  );
}

const platformPrerender = [
  ...(PLATFORM_SEED.fiqh_decisions || []).map((row) => ({
    dir: resolve(seoPrerenderDir, "fiqh-council", row.slug || row.id),
    route: {
      path: `/fiqh-council/${row.slug || row.id}`,
      title: `${row.title} | ${seoConfig.siteName}`,
      description: padDesc(row.title, "قرار من المجمع الفقهي الإسلامي الدولي"),
      ogType: "article",
    },
  })),
  ...(PLATFORM_SEED.fatwas || []).map((row) => ({
    dir: resolve(seoPrerenderDir, "fatwa", row.id),
    route: {
      path: `/fatwa/${row.id}`,
      title: `${row.question} | ${seoConfig.siteName}`,
      description: padDesc(row.answer ? row.answer.slice(0, 160) : row.question, "فتوى شرعية من المجلس العلمي"),
      ogType: "article",
    },
    extraJsonLd: fatwaQaJsonLdScript(row),
  })),
  ...verifiedFiqhSessions.map((row) => ({
    dir: resolve(seoPrerenderDir, "fiqh-council", "sessions", row.slug),
    route: {
      path: `/fiqh-council/sessions/${row.slug}`,
      title: `${row.title} | ${seoConfig.siteName}`,
      description: padDesc(row.title, "جلسة فقهية في المجمع الفقهي الإسلامي الدولي"),
      ogType: "article",
      robots: "index, follow",
    },
  })),
  ...(PLATFORM_SEED.rulings || []).map((row) => ({
    dir: resolve(seoPrerenderDir, "rulings", row.id),
    route: {
      path: `/rulings/${row.id}`,
      title: `${row.title} | ${seoConfig.siteName}`,
      description: padDesc(row.title, "حكم شرعي موثّق من الموسوعة الفقهية للمجلس العلمي"),
      ogType: "article",
    },
  })),
  ...(PLATFORM_SEED.courses || []).map((row) => ({
    dir: resolve(seoPrerenderDir, "annual-courses", row.id),
    route: {
      path: `/annual-courses/${row.id}`,
      title: `${row.title || row.name} | ${seoConfig.siteName}`,
      description: padDesc(row.description || row.title || row.name, "دورة علمية شرعية من المجلس العلمي"),
      ogType: "website",
    },
    extraJsonLd: courseJsonLdScript(row),
  })),
  ...LIBRARY_CATALOG.map((row) => ({
    dir: resolve(seoPrerenderDir, "library", row.id),
    route: {
      path: `/library/${row.id}`,
      title: `${row.title} | المكتبة العلمية — ${seoConfig.siteName}`,
      description: padDesc(row.description || row.title, "كتاب من المكتبة الشرعية في المجلس العلمي"),
      ogType: "book",
    },
    extraJsonLd: bookJsonLdScript(row),
  })),
];

for (const item of platformPrerender) {
  await mkdir(item.dir, { recursive: true });
  await writeFile(resolve(item.dir, "index.html"), prerenderHtml(item.route, item.extraJsonLd || ""), "utf8");
}

const totalUrls = staticRoutes.length + lessonRows.length + platformPrerender.length;
console.log(
  `Generated sitemap.xml, robots.txt, feed.xml, and ${staticRoutes.length + platformPrerender.length + lessonRows.length} prerender pages for ${seoConfig.siteUrl}`,
);
