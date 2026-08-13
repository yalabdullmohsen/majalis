#!/usr/bin/env node
/**
 * بوابة الصورة الرسمية الواحدة.
 *   pnpm run test:brand-image
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const issues = [];

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

const assetsPath = join(ROOT, "public/brand/assets.json");
const officialPath = join(ROOT, "public/brand/official.png");
if (!existsSync(officialPath)) issues.push("مفقود public/brand/official.png");
if (!existsSync(assetsPath)) issues.push("مفقود public/brand/assets.json — شغّل derive:brand");

const assets = existsSync(assetsPath) ? JSON.parse(read("public/brand/assets.json")) : null;
if (assets) {
  const buf = readFileSync(officialPath);
  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 10);
  if (assets.hash !== hash) {
    issues.push(`بصمة المصدر ${hash} ≠ assets.hash ${assets.hash} — أعد derive:brand`);
  }
  if (!String(assets.ogImageAbsolute || "").startsWith("https://majlisilm.com/")) {
    issues.push("ogImageAbsolute يجب أن يكون مطلقًا على majlisilm.com");
  }
  if (!String(assets.ogImage || "").startsWith("/brand/og-1200x630.")) {
    issues.push(`ogImage غير مشتق بالبصمة: ${assets.ogImage}`);
  }
  const required = [
    assets.ogImage.replace(/^\//, ""),
    "favicon.ico",
    "favicon-32.png",
    "apple-touch-icon.png",
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-512.png",
    "brand/official.png",
  ];
  for (const rel of required) {
    const p = join(ROOT, "public", rel);
    if (!existsSync(p)) issues.push(`أيقونة/أصل مفقود: public/${rel}`);
  }
  // sizes via sips/identify optional — use file existence + PIL
  try {
    const out = execFileSync(
      "python3",
      [
        "-c",
        `from PIL import Image; from pathlib import Path
root=Path(${JSON.stringify(join(ROOT, "public"))})
checks={
  ${JSON.stringify(assets.ogImage.replace(/^\//, ""))}:(1200,630),
  "icon-192.png":(192,192),
  "icon-512.png":(512,512),
  "icon-maskable-512.png":(512,512),
  "apple-touch-icon.png":(180,180),
}
bad=[]
for rel,(w,h) in checks.items():
  im=Image.open(root/rel)
  if im.size!=(w,h): bad.append(f"{rel}={im.size} want {(w,h)}")
print("\\n".join(bad))`,
      ],
      { encoding: "utf8" },
    ).trim();
    if (out) out.split("\n").forEach((l) => issues.push(`مقاس خاطئ: ${l}`));
  } catch (e) {
    issues.push(`تعذر فحص المقاسات: ${e.message}`);
  }
}

const site = JSON.parse(read("site.config.json"));
const routes = JSON.parse(read("src/lib/seo-routes.json"));
if (!String(site.defaultImage || "").startsWith("/brand/og-1200x630.")) {
  issues.push(`site.config defaultImage خاطئ: ${site.defaultImage}`);
}
if (site.defaultImage !== routes.defaultImage) {
  issues.push("site.config و seo-routes defaultImage غير متطابقين");
}

const bannedPatterns = [
  /majlisilm-og-2026/i,
  /opengraph\.jpg/i,
  /\/favicon\.svg/i,
  /splash-logo\.png/i,
  /owner-brand-reference/i,
  /logo-calligraphy/i,
];

const SCAN_ROOTS = [
  "src",
  "scripts",
  "lib",
  "index.html",
  "site.config.json",
  "public/manifest.webmanifest",
  "public/site.webmanifest",
  "public/manifest.json",
  "public/sw.js",
];

function walk(rel, out = []) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return out;
  const st = statSync(abs);
  if (st.isFile()) {
    out.push(rel);
    return out;
  }
  for (const name of readdirSync(abs)) {
    if (name === "node_modules" || name === "dist" || name === "seo-prerender") continue;
    walk(join(rel, name), out);
  }
  return out;
}

const files = [];
for (const r of SCAN_ROOTS) walk(r, files);

for (const rel of files) {
  if (!/\.(tsx?|jsx?|mjs|cjs|json|html|css|webmanifest)$/i.test(rel)) continue;
  if (/test-brand-image-gate|derive-official-brand/.test(rel)) continue;
  let text;
  try {
    text = read(rel);
  } catch {
    continue;
  }
  for (const ban of bannedPatterns) {
    if (ban.test(text)) {
      issues.push(`${rel}: مرجع قديم «${ban}»`);
    }
  }
}

// index.html absolute og
const indexHtml = read("index.html");
const ogMatch = indexHtml.match(/property="og:image"\s+content="([^"]+)"/);
if (!ogMatch) issues.push("index.html بلا og:image");
else if (!/^https:\/\/majlisilm\.com\//.test(ogMatch[1])) {
  issues.push(`index.html og:image غير مطلق: ${ogMatch[1]}`);
}
if (!/property="og:image:type"\s+content="image\/png"/.test(indexHtml)) {
  issues.push("index.html بلا og:image:type=image/png");
}

// manifest icons exist
const man = JSON.parse(read("public/manifest.webmanifest"));
for (const icon of man.icons || []) {
  const src = String(icon.src || "").split("?")[0];
  if (!src.startsWith("/")) {
    issues.push(`manifest icon غير مسار جذري: ${icon.src}`);
    continue;
  }
  if (!existsSync(join(ROOT, "public", src.slice(1)))) {
    issues.push(`manifest يشير لملف مفقود: ${src}`);
  }
}
const purposes = new Set((man.icons || []).map((i) => i.purpose));
if (!purposes.has("any") || !purposes.has("maskable")) {
  issues.push("manifest يجب أن يتضمن purpose any و maskable");
}

// orphan representational images in public root
const allowPublic = new Set([
  "official.png", // under brand/
  "logo.png", // alias مشتق من official
  "logo-icon.png",
  "favicon.ico",
  "favicon-16.png",
  "favicon-32.png",
  "favicon-48.png",
  "favicon.png",
  "apple-touch-icon.png",
  "icon-96.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "corner-ornament.svg",
  "star-pattern.svg",
]);
for (const name of readdirSync(join(ROOT, "public"))) {
  if (!/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(name)) continue;
  if (allowPublic.has(name)) continue;
  if (name.startsWith("og-")) issues.push(`صورة OG يتيمة في public/: ${name}`);
  if (/og|opengraph|share|social|splash|preview/i.test(name)) {
    issues.push(`صورة تمثيلية غير مشتقة في public/: ${name}`);
  }
}

if (issues.length) {
  console.error("test:brand-image FAILED");
  for (const i of issues) console.error(" -", i);
  process.exit(1);
}
console.log("test:brand-image: ok");
