#!/usr/bin/env node
/**
 * تدقيق الفهرسة والـSEO — sitemap / robots / canonical / JSON-LD / noindex
 * يفشل فقط عند دليل مثبت.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const fail = (m: string) => errors.push(m);

function walk(dir: string, pred: (n: string, p: string) => boolean, out: string[] = []): string[] {
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

function robotsOf(html: string): string {
  return (html.match(/name=["']robots["'][^>]*content=["']([^"']+)/i) || [])[1]?.toLowerCase() || "";
}

function metaDesc(html: string): string {
  return (html.match(/name=["']description["'][^>]*content=["']([^"']*)/i) || [])[1] || "";
}

const sitemapPaths = new Set<string>();
const smFile = path.join(root, "public/sitemap.xml");
if (!fs.existsSync(smFile)) fail("public/sitemap.xml مفقود");
else {
  const xml = fs.readFileSync(smFile, "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      sitemapPaths.add(new URL(m[1]!).pathname.replace(/\/$/, "") || "/");
    } catch {
      fail(`loc غير صالح: ${m[1]}`);
    }
  }
}

const UI_IN_DESC = ["Esc للقائمة", "اختصارات:", "نسخ النص", "سناب شات", "← التالي", "→ السابق"];
const INCOMPLETE = ["الموضوع غير موجود", "قيد الإعداد", "placeholder", "lorem ipsum", "رابط القراءة"];

let pages = 0;
let noindexOk = 0;

for (const base of ["seo-prerender", "dist"] as const) {
  const dir = path.join(root, base);
  if (!fs.existsSync(dir)) continue;
  const homeTitle =
    (fs.readFileSync(path.join(dir, "index.html"), "utf8").match(/<title>([^<]*)/i) || [])[1] || "";

  for (const file of walk(dir, (n) => n === "index.html")) {
    pages++;
    const rel = path.relative(root, file);
    const html = fs.readFileSync(file, "utf8");
    const robots = robotsOf(html);
    const noindex = /\bnoindex\b/.test(robots);
    const desc = metaDesc(html);
    const title = (html.match(/<title>([^<]*)/i) || [])[1] || "";
    const urlPath =
      ("/" + rel.replace(/^(seo-prerender|dist)[/\\]/, "").replace(/[/\\]index\.html$/, "").replace(/\\/g, "/")).replace(
        /\/$/,
        "",
      ) || "/";

    // واجهة داخل meta
    for (const ph of UI_IN_DESC) {
      if (desc.includes(ph)) fail(`${rel}: meta description يحتوي «${ph}»`);
    }

    // ناقص مفهرس (methodology مستثناة لشرح الوسم)
    if (!noindex && !/methodology/.test(rel)) {
      for (const m of INCOMPLETE) {
        if (desc.includes(m) || html.includes(`>${m}<`)) {
          // قيد الإعداد في body فقط مع index = فشل إن كان في description
          if (desc.includes(m) || (m === "الموضوع غير موجود" && /<article[\s\S]*الموضوع غير موجود/.test(html))) {
            fail(`${rel}: «${m}» مفهرس بلا noindex`);
          }
        }
      }
    }

    if (/knowledge-graph/.test(rel) && /قيد الإعداد/.test(html) && !noindex) {
      fail(`${rel}: knowledge-graph قيد إعداد بلا noindex`);
    }
    if (noindex) noindexOk++;

    // ناقص داخل sitemap
    if ((sitemapPaths.has(urlPath) || sitemapPaths.has(urlPath + "/")) && !noindex) {
      if (/الموضوع غير موجود/.test(html) && /<article/.test(html)) {
        fail(`${rel}: في sitemap ومحتواها «غير موجود»`);
      }
    }

    // Home fallback
    const depth = path.relative(dir, file).split(path.sep).length;
    if (homeTitle && title === homeTitle && depth >= 2 && !noindex && !/غير موجود|404|غير متاح/.test(title)) {
      fail(`${rel}: Home fallback (نفس عنوان الرئيسية)`);
    }

    // canonical أساسي
    if (!noindex && /<link[^>]+rel=["']canonical["']/i.test(html) === false && depth >= 1) {
      // كثير من الصفحات لديها canonical — إن غاب على صفحة مفهرسة عميقة نبّه
      if (/[/\\](prophets|library|scholars)[/\\]/.test(rel) && !/canonical/.test(html)) {
        fail(`${rel}: بلا canonical`);
      }
    }
  }
}

console.log(
  JSON.stringify(
    { sitemapUrls: sitemapPaths.size, pagesScanned: pages, noindexPagesSeen: noindexOk, errors: errors.length },
    null,
    2,
  ),
);

if (errors.length) {
  console.error(`audit:seo FAILED\n- ${errors.slice(0, 40).join("\n- ")}`);
  process.exit(1);
}
console.log("audit:seo OK");
