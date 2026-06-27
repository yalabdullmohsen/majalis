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
const publicDir = resolve(appRoot, "public");
const seoPrerenderDir = resolve(appRoot, "seo-prerender");
const seoConfigPath = resolve(appRoot, "src/lib/seo-routes.json");

const seoConfig = JSON.parse(await readFile(seoConfigPath, "utf8"));
const buildDate = new Date().toISOString().slice(0, 10);

function absoluteUrl(path) {
  return new URL(path, seoConfig.siteUrl).toString();
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
  return [sheikh ? `الشيخ: ${sheikh}` : "", place ? `المكان: ${place}` : "", row.schedule || ""]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 160);
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
      target: `${seoConfig.siteUrl}/search/{search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return `<script type="application/ld+json">${JSON.stringify([org, site])}</script>`;
}

function prerenderHtml(route, extraJsonLd = "") {
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
    <meta property="og:site_name" content="${escapeHtml(seoConfig.siteName)}" />
    <meta property="og:locale" content="ar_AR" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${escapeHtml(route.title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:alt" content="${escapeHtml(route.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(route.title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    ${route.path === "/" ? siteJsonLdScript() : ""}
    ${extraJsonLd}
  </head>
  <body>
    <header><a href="${escapeHtml(seoConfig.siteUrl)}">${escapeHtml(seoConfig.siteName)}</a></header>
    <main>
      <h1>${escapeHtml(route.title)}</h1>
      <p>${escapeHtml(route.description)}</p>
      <p><a href="${escapeHtml(canonical)}">عرض الصفحة</a></p>
    </main>
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
    description: row.title,
    priority: 0.7,
    robots: "index, follow",
  })),
  ...(PLATFORM_SEED.fatwas || []).map((row) => ({
    path: `/fatwa/${row.id}`,
    title: `${row.question} | ${seoConfig.siteName}`,
    description: row.question,
    priority: 0.71,
  })),
  ...(PLATFORM_SEED.rulings || []).map((row) => ({
    path: `/rulings/${row.id}`,
    title: `${row.title} | ${seoConfig.siteName}`,
    description: row.title,
    priority: 0.69,
  })),
  ...(PLATFORM_SEED.courses || []).map((row) => ({
    path: `/annual-courses/${row.id}`,
    title: `${row.title} | ${seoConfig.siteName}`,
    description: row.title,
    priority: 0.68,
  })),
  ...verifiedFiqhSessions.map((row) => ({
    path: `/fiqh-council/sessions/${row.slug}`,
    title: `${row.title} | ${seoConfig.siteName}`,
    description: row.title,
    priority: 0.69,
    robots: "index, follow",
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

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Host: ${seoConfig.siteUrl.replace(/^https?:\/\//, "")}
Sitemap: ${seoConfig.siteUrl}/sitemap.xml

# RSS Feed
# ${seoConfig.siteUrl}/feed.xml
`;

const rssItems = [
  ...(PLATFORM_SEED.fiqh_decisions || []).slice(0, 5).map((row) => ({
    title: row.title,
    link: absoluteUrl(`/fiqh-council/${row.slug || row.id}`),
    description: row.title,
  })),
  ...(PLATFORM_SEED.fatwas || []).slice(0, 5).map((row) => ({
    title: row.question,
    link: absoluteUrl(`/fatwa/${row.id}`),
    description: row.question,
  })),
];

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(seoConfig.siteName)}</title>
    <link>${escapeXml(seoConfig.siteUrl)}</link>
    <description>آخر الإضافات العلمية — دروس وفتاوى وقرارات ودورات</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml"/>
    ${rssItems.map((item) => `<item><title>${escapeXml(item.title)}</title><link>${escapeXml(item.link)}</link><description>${escapeXml(item.description)}</description><pubDate>${new Date().toUTCString()}</pubDate></item>`).join("\n    ")}
  </channel>
</rss>
`;

await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(resolve(publicDir, "robots.txt"), robots, "utf8");
await writeFile(resolve(publicDir, "feed.xml"), feed, "utf8");

for (const route of staticRoutes) {
  const routeDir =
    route.path === "/"
      ? seoPrerenderDir
      : resolve(seoPrerenderDir, route.path.slice(1));
  await mkdir(routeDir, { recursive: true });
  await writeFile(resolve(routeDir, "index.html"), prerenderHtml(route), "utf8");

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
    description: lessonDescription(row) || `${row.title} — درس شرعي على ${seoConfig.siteName}`,
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
      description: row.title,
      ogType: "article",
    },
  })),
  ...(PLATFORM_SEED.fatwas || []).map((row) => ({
    dir: resolve(seoPrerenderDir, "fatwa", row.id),
    route: {
      path: `/fatwa/${row.id}`,
      title: `${row.question} | ${seoConfig.siteName}`,
      description: row.question,
      ogType: "article",
    },
  })),
  ...verifiedFiqhSessions.map((row) => ({
    dir: resolve(seoPrerenderDir, "fiqh-council", "sessions", row.slug),
    route: {
      path: `/fiqh-council/sessions/${row.slug}`,
      title: `${row.title} | ${seoConfig.siteName}`,
      description: row.title,
      ogType: "article",
      robots: "index, follow",
    },
  })),
  ...(PLATFORM_SEED.rulings || []).map((row) => ({
    dir: resolve(seoPrerenderDir, "rulings", row.id),
    route: {
      path: `/rulings/${row.id}`,
      title: `${row.title} | ${seoConfig.siteName}`,
      description: row.title,
      ogType: "article",
    },
  })),
  ...(PLATFORM_SEED.courses || []).map((row) => ({
    dir: resolve(seoPrerenderDir, "annual-courses", row.id),
    route: {
      path: `/annual-courses/${row.id}`,
      title: `${row.title} | ${seoConfig.siteName}`,
      description: row.title,
      ogType: "website",
    },
  })),
];

for (const item of platformPrerender) {
  await mkdir(item.dir, { recursive: true });
  await writeFile(resolve(item.dir, "index.html"), prerenderHtml(item.route), "utf8");
}

const totalUrls = staticRoutes.length + lessonRows.length + platformPrerender.length;
console.log(
  `Generated sitemap.xml, robots.txt, feed.xml, and ${staticRoutes.length + platformPrerender.length + lessonRows.length} prerender pages for ${seoConfig.siteUrl}`,
);
