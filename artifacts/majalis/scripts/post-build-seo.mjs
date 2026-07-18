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
  const moduleTags = [...spaHead.matchAll(/<link[^>]+(?:modulepreload|stylesheet)[^>]*\/?>/gi)].map(m => m[0]);
  return [...moduleTags, ...scriptTags].join("\n  ");
}

/** استخرج meta + title + JSON-LD من ملف prerender */
function extractSeoTags(prerenderHead) {
  const titleM = prerenderHead.match(/<title[^>]*>[\s\S]*?<\/title>/i);
  const metas = [...prerenderHead.matchAll(/<meta[^>]+\/?>/gi)].map(m => m[0]);
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    ${seoTags}
    ${spaAssets}
  </head>
  <body>
    <noscript>
      ${prerenderBody}
    </noscript>
    <!-- جذر React -->
    <div id="root"></div>
    <!-- سكريبت تهيئة الثيم فوراً لمنع الوميض -->
    <script>try{var _dsv="v4-light-2026";if(localStorage.getItem("majalis-design-v")!==_dsv){localStorage.setItem("majalis-design-v",_dsv);localStorage.removeItem("majalis-theme-preference");}var st=localStorage.getItem("majalis-theme-preference");var res=st==="dark"?"dark":"light";document.documentElement.dataset.theme=res;document.documentElement.classList.toggle("dark",res==="dark");}catch(e){}</script>
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

    const seoTags = extractSeoTags(prerenderHead);

    const merged_html = buildMergedHtml(seoTags, spaAssets, prerenderBody, spaBody);

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
