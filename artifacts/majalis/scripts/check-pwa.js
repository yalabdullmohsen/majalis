#!/usr/bin/env node
/**
 * فحص PWA — manifest، sw، icons، offline.
 *
 * Usage:
 *   node scripts/check-pwa.js
 *   node scripts/check-pwa.js --url=https://www.ssunnah.com
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, parseBaseUrl, fetchText } from "./monitoring-utils.mjs";

const base = parseBaseUrl();
const failures = [];

function checkManifestJson(manifest, source) {
  if (manifest.name !== "سُنّة" && manifest.name !== "سنّة") {
    failures.push(`${source}: name=${manifest.name}`);
  }
  if (manifest.short_name !== "سُنّة" && manifest.short_name !== "سنّة") {
    failures.push(`${source}: short_name=${manifest.short_name}`);
  }
  if (manifest.lang !== "ar") failures.push(`${source}: lang=${manifest.lang}`);
  if (manifest.dir !== "rtl") failures.push(`${source}: dir=${manifest.dir}`);
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    failures.push(`${source}: icons مفقودة`);
  }
}

async function checkIcon(urlPath) {
  const target = base || `file://${resolve(ROOT, "public")}`;
  if (base) {
    const { status } = await fetchText(base, urlPath.split("?")[0]);
    if (status !== 200) failures.push(`${urlPath}: HTTP ${status}`);
    return;
  }
  const local = resolve(ROOT, "public", urlPath.replace(/^\//, "").split("?")[0]);
  if (!existsSync(local)) failures.push(`${urlPath}: ملف مفقود`);
}

function checkSwSource(text, source) {
  if (/cache\.add\s*\(\s*["']\/["']\s*\)/.test(text)) {
    failures.push(`${source}: يخزّن /`);
  }
  if (/official-og\.png/.test(text) && /STATIC_SHELL_ASSETS/.test(text)) {
    failures.push(`${source}: official-og.png في STATIC_SHELL`);
  }
  if (/["']majlisilm-v/.test(text) && !/LEGACY_CACHE_PREFIXES/.test(text)) {
    failures.push(`${source}: كاش majlisilm جديد`);
  }
}

function checkOffline(text) {
  if (/majlisilm|Majlisilm|المجلس\s*العلمي/i.test(text)) {
    failures.push("offline.html: اسم قديم");
  }
}

console.log(`▶ check-pwa${base ? ` — ${base}` : " (محلي)"}\n`);

let manifestText;
if (base) {
  const res = await fetchText(base, "/manifest.webmanifest");
  if (res.status !== 200) failures.push(`manifest: HTTP ${res.status}`);
  else manifestText = res.text;
} else {
  manifestText = readFileSync(resolve(ROOT, "public/manifest.webmanifest"), "utf8");
}

if (manifestText) {
  checkManifestJson(JSON.parse(manifestText), "manifest");
  const manifest = JSON.parse(manifestText);
  for (const icon of manifest.icons || []) {
    await checkIcon(icon.src);
  }
}

await checkIcon("/apple-touch-icon.png");

let swText;
if (base) {
  const res = await fetchText(base, "/sw.js");
  if (res.status !== 200) failures.push(`sw.js: HTTP ${res.status}`);
  else swText = res.text;
} else {
  swText = readFileSync(resolve(ROOT, "public/sw.js"), "utf8");
}
if (swText) checkSwSource(swText, "sw.js");

const swVersionPath = base ? null : resolve(ROOT, "dist/sw-version.js");
if (base) {
  const res = await fetchText(base, "/sw-version.js");
  if (res.status !== 200) failures.push("sw-version.js: غير موجود بعد build");
} else if (!existsSync(swVersionPath)) {
  failures.push("dist/sw-version.js مفقود — شغّل build");
}

let offlineText;
if (base) {
  const res = await fetchText(base, "/offline.html");
  offlineText = res.text;
} else {
  offlineText = readFileSync(resolve(ROOT, "public/offline.html"), "utf8");
}
if (offlineText) checkOffline(offlineText);

if (failures.length) {
  console.error("❌ check-pwa فشل:");
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log("✅ check-pwa — نجح");
