/**
 * بوابة: canonical/sitemap/OG/روابط SEO على https://majlisilm.com (بلا www).
 * تبويبات /lessons?tab= ممنوعة — تُحوَّل إلى /lessons (hash داخل التطبيق فقط).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const srcRoot = resolve(root, "src");

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(name)) acc.push(p);
  }
  return acc;
}

const allowWww = new Set([
  resolve(srcRoot, "lib/site-config.ts"),
  resolve(srcRoot, "lib/__tests__/to-app-path.test.ts"),
  resolve(srcRoot, "lib/__tests__/ios-stability-audit.test.ts"),
  resolve(srcRoot, "lib/__tests__/religious-content-validator.test.ts"),
]);

const offenders: string[] = [];
for (const file of walk(srcRoot)) {
  if (allowWww.has(file)) continue;
  const text = readFileSync(file, "utf8");
  if (/https:\/\/www\.majlisilm\.com/.test(text)) offenders.push(file.slice(root.length + 1));
}
assert.equal(offenders.length, 0, `www في مصادر src:\n${offenders.join("\n")}`);

const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");
assert.match(
  vercel,
  /"has"\s*:\s*\[\{\s*"type"\s*:\s*"host"\s*,\s*"value"\s*:\s*"www\.majlisilm\.com"\s*\}\][\s\S]*?"destination"\s*:\s*"https:\/\/majlisilm\.com/,
  "vercel: 301 من www إلى apex",
);
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
assert.equal(/https:\/\/www\.majlisilm\.com/.test(sitemap), false, "sitemap: بلا www");
assert.match(sitemap, /<loc>https:\/\/majlisilm\.com\/lessons<\/loc>/);

const siteConfig = readFileSync(resolve(root, "site.config.json"), "utf8");
assert.match(siteConfig, /"siteUrl"\s*:\s*"https:\/\/majlisilm\.com"/);

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.equal(/https:\/\/www\.majlisilm\.com/.test(indexHtml), false, "index.html: بلا www");

const appTsx = readFileSync(resolve(srcRoot, "App.tsx"), "utf8");
assert.equal(/\/lessons\?tab=/.test(appTsx), false, "App.tsx: بلا /lessons?tab=");

console.log("canonical-apex-gate.test.ts: ok");
