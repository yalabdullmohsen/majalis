import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
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

const sitemapEntries = seoConfig.routes
  .filter((route) => route.sitemap)
  .map((route) => {
    const loc = escapeXml(absoluteUrl(route.path));
    const changefreq = route.changefreq ? `\n    <changefreq>${escapeXml(route.changefreq)}</changefreq>` : "";
    const priority = route.priority ? `\n    <priority>${escapeXml(route.priority)}</priority>` : "";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${buildDate}</lastmod>${changefreq}${priority}\n  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;

const robots = `# https://majlisilm.com/robots.txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /login

Host: ${seoConfig.siteUrl.replace(/^https?:\/\//, "")}
Sitemap: ${seoConfig.siteUrl}/sitemap.xml
`;

function prerenderHtml(route) {
  const canonical = absoluteUrl(route.path);
  const image = absoluteUrl(seoConfig.defaultImage);
  const keywords = [...new Set([...(route.keywords || []), ...seoConfig.defaultKeywords])].join(", ");
  const robots = route.robots || "index, follow";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(route.title)}</title>
    <meta name="description" content="${escapeHtml(route.description)}" />
    <meta name="keywords" content="${escapeHtml(keywords)}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="theme-color" content="#164E3C" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:site_name" content="${escapeHtml(seoConfig.siteName)}" />
    <meta property="og:locale" content="ar_AR" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(route.title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:alt" content="${escapeHtml(seoConfig.siteName)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(route.title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(canonical)}" />
  </head>
  <body>
    <h1>${escapeHtml(route.title)}</h1>
    <p>${escapeHtml(route.description)}</p>
    <a href="${escapeHtml(canonical)}">انتقل إلى ${escapeHtml(seoConfig.siteName)}</a>
    <script>window.location.replace(${JSON.stringify(canonical)});</script>
  </body>
</html>`;
}

await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(resolve(publicDir, "robots.txt"), robots, "utf8");

for (const route of seoConfig.routes.filter((r) => r.sitemap)) {
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
        // legacy stub may not exist
      }
    }
  }
}

console.log(`Generated sitemap.xml, robots.txt, and ${seoConfig.routes.filter((r) => r.sitemap).length} prerender pages for ${seoConfig.siteUrl}`);
