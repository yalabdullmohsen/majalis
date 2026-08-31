/**
 * post-build-seo.mjs
 *
 * يُدمج ملفات الـ prerender (seo-prerender/) مع shell الـ SPA المبني (dist/index.html)
 * ليُنتج صفحات في dist/ تملك:
 *   1. Meta tags وJSON-LD خاصة بكل صفحة (للزواحف والـ SEO)
 *   2. React app scripts كاملة (للمستخدمين العاديين)
 *
 * يُستدعى في نهاية أمر build.
 */

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { resolve, dirname, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const distDir = resolve(appRoot, "dist");
const prerenderDir = resolve(appRoot, "seo-prerender");

const SITE = JSON.parse(await readFile(resolve(appRoot, "site.config.json"), "utf8"));
const SITE_URL = SITE.siteUrl || "https://majlisilm.com";
const THEME_COLOR = SITE.themeColor || "#1F7A5A";
const THEME_COLOR_DARK = SITE.themeColorDark || "#4FB48B";
const PRERENDER_NAV =
  Array.isArray(SITE.prerenderNav) && SITE.prerenderNav.length
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

function absoluteUrl(path) {
  return new URL(path || "/", SITE_URL).toString();
}

/** توحيد تنقّل قشرة الـSEO عند الدمج — بلا إعادة كتابة آلاف ملفات seo-prerender المتتبَّعة. */
function unifyPrerenderNav(body) {
  const links = PRERENDER_NAV.map(
    (item) => `<a href="${absoluteUrl(item.path)}">${item.label}</a>`,
  ).join("\n        ");
  const headerNav = `<header>
      <nav aria-label="التنقل الرئيسي">
        ${links}
      </nav>
    </header>`;
  if (/<header>\s*<nav[\s\S]*?<\/nav>\s*<\/header>/i.test(body)) {
    return body.replace(/<header>\s*<nav[\s\S]*?<\/nav>\s*<\/header>/i, headerNav);
  }
  return body;
}

/** فرض theme-color من site.config في وسوم الـSEO المدمجة. */
function ensureThemeColorMetas(seoTags) {
  let tags = seoTags
    .split("\n")
    .filter((line) => !/name=["']theme-color["']/.test(line))
    .join("\n");
  const block = [
    `<meta name="theme-color" content="${THEME_COLOR}" />`,
    `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${THEME_COLOR}" />`,
    `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${THEME_COLOR_DARK}" />`,
  ].join("\n  ");
  return `${block}\n  ${tags}`;
}

/** استخرج كتلة <head> الضرورية من ملف HTML */
function extractHeadBlock(html) {
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return m ? m[1] : "";
}

/** استخرج <body> كاملة */
function extractBody(html) {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : "";
}

/**
 * استخرج عناصر <script> و<link rel="modulepreload"> و<link rel="stylesheet">
 * من dist/index.html (هي المُنتجة من Vite مع hash)
 */
function extractSpaAssets(spaHead) {
  const scriptTags = [...spaHead.matchAll(/<script[^>]*>[\s\S]*?<\/script>/gi)].map(m => m[0]);
  const moduleTags = [...spaHead.matchAll(/<link[^>]+(?:modulepreload|stylesheet|preload)[^>]*\/?>/gi)]
    .map((m) => m[0])
    .filter((tag) => !/rel=["']preconnect["']/i.test(tag));
  const preconnects = [...spaHead.matchAll(/<link[^>]+rel=["']preconnect["'][^>]*\/?>/gi)]
    .map((m) => m[0])
    .slice(0, 2);
  return [...preconnects, ...moduleTags, ...scriptTags].join("\n  ");
}

/** استخرج meta + title + JSON-LD من ملف prerender */
function extractSeoTags(prerenderHead) {
  const titleM = prerenderHead.match(/<title[^>]*>[\s\S]*?<\/title>/i);
  // buildMergedHtml يحقن charset/viewport/color-scheme — لا تُكرَّر من الـ prerender
  const metas = [...prerenderHead.matchAll(/<meta[^>]+\/?>/gi)]
    .map((m) => m[0])
    .filter((tag) => {
      if (/\bcharset\s*=/i.test(tag)) return false;
      if (/\bname\s*=\s*["']viewport["']/i.test(tag)) return false;
      if (/\bname\s*=\s*["']color-scheme["']/i.test(tag)) return false;
      return true;
    });
  const links = [...prerenderHead.matchAll(/<link[^>]+(?:rel="canonical"|rel="alternate"|hreflang)[^>]*\/?>/gi)].map(m => m[0]);
  const jsonld = [...prerenderHead.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi)].map(m => m[0]);

  return [
    titleM ? titleM[0] : "",
    ...metas,
    ...links,
    ...jsonld,
  ].filter(Boolean).join("\n  ");
}

/** بناء صفحة HTML مُدمجة */
function buildMergedHtml(seoTags, spaAssets, prerenderBody, spaBody) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="light dark" />
    ${seoTags}
    <style>
      #root{min-height:40vh;position:relative;z-index:1}
      #seo-shell{position:relative;z-index:2;min-height:70vh;background:#F2F4F3}
      html.dark #seo-shell,.dark #seo-shell{background:#101614}
      .js-ready #seo-shell{display:none!important}
    </style>
    ${spaAssets}
  </head>
  <body>
    <!-- محتوى SEO فوق #root حتى يستقر LCP ثم يُزال بعد جاهزية React -->
    <div id="seo-shell">
      ${prerenderBody}
    </div>
    <div id="root"></div>
    <script>(function(){function a(){document.documentElement.classList.add('js-ready');var s=document.getElementById('seo-shell');if(s)s.remove()}function arm(){setTimeout(a,3200)}var r=document.getElementById('root');if(r&&r.hasChildNodes())arm();else{var o=new MutationObserver(function(){if(r&&r.hasChildNodes()){o.disconnect();arm()}});o.observe(r||document.documentElement,{childList:true,subtree:true});setTimeout(a,9000)}})()</script>
  </body>
</html>`;
}

/** تجوال عودي في دليل للحصول على جميع ملفات index.html */
async function walkDir(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkDir(full, base));
    } else if (entry.name === "index.html") {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  // قراءة dist/index.html (SPA المبني)
  const spaHtml = await readFile(resolve(distDir, "index.html"), "utf8");
  const spaHead = extractHeadBlock(spaHtml);
  const spaBody = extractBody(spaHtml);
  const spaAssets = extractSpaAssets(spaHead);

  // العثور على جميع ملفات prerender
  let prerenderFiles;
  try {
    prerenderFiles = await walkDir(prerenderDir);
  } catch {
    console.warn("⚠ seo-prerender/ غير موجود — تخطّي");
    return;
  }

  let merged = 0;

  for (const prerenderFile of prerenderFiles) {
    const relPath = relative(prerenderDir, prerenderFile);
    // المسار النسبي: e.g. "index.html" أو "lessons/index.html" أو "lessons/abc123/index.html"
    const prerenderHtml = await readFile(prerenderFile, "utf8");
    const prerenderHead = extractHeadBlock(prerenderHtml);
    const prerenderBody = extractBody(prerenderHtml);

    const seoTags = ensureThemeColorMetas(extractSeoTags(prerenderHead));
    const body = unifyPrerenderNav(prerenderBody);

    const merged_html = buildMergedHtml(seoTags, spaAssets, body, spaBody);

    const destPath = resolve(distDir, relPath);
    const destDir = dirname(destPath);
    await mkdir(destDir, { recursive: true });

    // لا نكتب فوق dist/index.html الأصلي
    if (relPath === "index.html") {
      await writeFile(resolve(distDir, "index-seo-merged.html"), merged_html, "utf8");
    } else {
      await writeFile(destPath, merged_html, "utf8");
    }

    merged++;
  }

  console.log(`✓ post-build-seo: دُمج ${merged} ملف prerender → dist/`);
}

main().catch(e => {
  console.error("post-build-seo فشل:", e.message);
  process.exit(1);
});
