/**
 * بوابة: canonical/sitemap/OG على https://www.ssunnah.com (النطاق الحي بلا redirect).
 * تبويبات /lessons?tab= ممنوعة — تُحوَّل إلى /lessons (hash داخل التطبيق فقط).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const srcRoot = resolve(root, "src");
const CANONICAL = "https://www.ssunnah.com";

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(name)) acc.push(p);
  }
  return acc;
}

/** لا تُعتمد majlisilm.com كنطاق إنتاج في مصادر الواجهة بعد الترحيل */
const allowLegacyHostMentions = new Set([
  resolve(srcRoot, "lib/site-config.ts"),
  resolve(srcRoot, "lib/in-app-navigation.ts"),
  resolve(srcRoot, "lib/capacitor-utils.ts"),
  resolve(srcRoot, "lib/native-deep-link.ts"),
  resolve(srcRoot, "lib/__tests__/to-app-path.test.ts"),
  resolve(srcRoot, "lib/__tests__/ios-stability-audit.test.ts"),
  resolve(srcRoot, "lib/__tests__/canonical-apex-gate.test.ts"),
  resolve(srcRoot, "lib/__tests__/religious-content-validator.test.ts"),
]);

const offenders: string[] = [];
for (const file of walk(srcRoot)) {
  if (allowLegacyHostMentions.has(file)) continue;
  const text = readFileSync(file, "utf8");
  // روابط إنتاج مطلقة على النطاق القديم — ممنوعة
  if (/https:\/\/(?:www\.)?majlisilm\.com/.test(text)) {
    offenders.push(file.slice(root.length + 1));
  }
}
assert.equal(offenders.length, 0, `majlisilm.com ما زال في مصادر src:\n${offenders.join("\n")}`);

const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");
assert.match(
  vercel,
  /"has"\s*:\s*\[\{\s*"type"\s*:\s*"host"\s*,\s*"value"\s*:\s*"ssunnah\.com"\s*\}\][\s\S]*?"destination"\s*:\s*"https:\/\/www\.ssunnah\.com/,
  "vercel: تحويل ssunnah.com (apex) إلى www.ssunnah.com",
);
assert.match(
  vercel,
  /"has"\s*:\s*\[\{\s*"type"\s*:\s*"host"\s*,\s*"value"\s*:\s*"www\.majlisilm\.com"\s*\}\][\s\S]*?"destination"\s*:\s*"https:\/\/www\.ssunnah\.com/,
  "vercel: تحويل www.majlisilm إلى www.ssunnah",
);
assert.doesNotMatch(
  vercel,
  /"source"\s*:\s*"\/\(\.\*\)"[\s\S]*?"Access-Control-Allow-Origin"/,
  "vercel: لا CORS على HTML الثابت (/(.*))",
);
const searchApi = readFileSync(resolve(root, "lib/api-handlers/search.js"), "utf8");
assert.match(searchApi, /Access-Control-Allow-Origin/, "search API: CORS عند الحاجة");
assert.match(searchApi, /Vary.*Origin/, "search API: Vary Origin");
assert.match(
  vercel,
  /"proxy"\s*:\s*\{[\s\S]*"entrypoint"\s*:\s*"middleware\.js"[\s\S]*"matcher"/,
  "vercel: proxy middleware لـ /lessons و/admin",
);
assert.match(vercel, /"\/lessons"/, "vercel proxy: /lessons");
assert.match(vercel, /"\/admin"/, "vercel proxy: /admin");
assert.match(
  readFileSync(resolve(root, "middleware.js"), "utf8"),
  /searchParams\.delete\("tab"\)/,
  "middleware: يزيل ?tab= من /lessons",
);
assert.match(
  readFileSync(resolve(root, "middleware.js"), "utf8"),
  /from\s+"@vercel\/functions"/,
  "middleware: next() من @vercel/functions لتمرير الطلبات",
);
assert.match(
  readFileSync(resolve(root, "middleware.js"), "utf8"),
  /return\s+next\(\)/,
  "middleware: return next() عند غياب tab",
);
assert.match(
  readFileSync(resolve(root, "middleware.js"), "utf8"),
  /hasSupabaseSession|auth-token/,
  "middleware: يحجب الإدارة بلا جلسة",
);
assert.match(
  readFileSync(resolve(root, "middleware.js"), "utf8"),
  /isPrivateAppPath|\/admin/,
  "middleware: يحجب زواحف الإدارة",
);

const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf8");
assert.equal(/https:\/\/(?:www\.)?majlisilm\.com/.test(sitemap), false, "sitemap: بلا majlisilm");
assert.match(sitemap, new RegExp(`<loc>${CANONICAL.replace(/\./g, "\\.")}/lessons</loc>`));

const siteConfig = readFileSync(resolve(root, "site.config.json"), "utf8");
assert.match(siteConfig, /"siteUrl"\s*:\s*"https:\/\/www\.ssunnah\.com"/);

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.equal(/https:\/\/(?:www\.)?majlisilm\.com/.test(indexHtml), false, "index.html: بلا majlisilm");
assert.match(indexHtml, /https:\/\/www\.ssunnah\.com/);

const appTsx =
  readFileSync(resolve(srcRoot, "App.tsx"), "utf8") +
  "\n" +
  readFileSync(resolve(srcRoot, "AppRoutes.tsx"), "utf8");
assert.equal(/\/lessons\?tab=/.test(appTsx), false, "App.tsx: بلا /lessons?tab=");

const errorPage = readFileSync(resolve(root, "public/native-load-error.html"), "utf8");
assert.match(errorPage, /https:\/\/www\.ssunnah\.com\//);
assert.equal(/majlisilm\.com/.test(errorPage), false, "native-load-error: بلا majlisilm");
assert.match(errorPage, /جاري إعادة التحميل/, "native-load-error: عنوان ناعم أولًا بلا خطأ فوري");
assert.match(errorPage, /mj\.last-path/, "native-load-error: يعيد لنفس المسار عبر mj.last-path");
assert.match(errorPage, /mj\.native-load-retry/, "native-load-error: إعادة تلقائية مرة واحدة");
assert.match(errorPage, /navigator\.onLine/, "native-load-error: يفرّق offline عن فشل مؤقت");

console.log("canonical-apex-gate.test.ts: ok");
