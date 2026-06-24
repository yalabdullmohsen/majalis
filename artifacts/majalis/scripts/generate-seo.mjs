import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const publicDir = resolve(appRoot, "public");
const seoConfigPath = resolve(appRoot, "src/lib/seo-routes.json");

const seoConfig = JSON.parse(await readFile(seoConfigPath, "utf8"));

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

const sitemapEntries = seoConfig.routes
  .filter((route) => route.sitemap)
  .map((route) => {
    const loc = escapeXml(absoluteUrl(route.path));
    const changefreq = route.changefreq ? `\n    <changefreq>${escapeXml(route.changefreq)}</changefreq>` : "";
    const priority = route.priority ? `\n    <priority>${escapeXml(route.priority)}</priority>` : "";
    return `  <url>\n    <loc>${loc}</loc>${changefreq}${priority}\n  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${seoConfig.siteUrl}/sitemap.xml\n`;

await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(resolve(publicDir, "robots.txt"), robots, "utf8");

console.log(`Generated sitemap.xml and robots.txt for ${seoConfig.siteUrl}`);
