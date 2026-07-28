/**
 * PWA installability audit — manifest, SW, iOS meta, splash hooks.
 * Run: npx tsx tests/pwa/pwa-installability.test.ts
 * Does not change runtime feature logic — asserts release readiness artifacts.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

let passed = 0;
let failed = 0;
function check(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.log(`  ✗ ${msg}`);
  }
}

console.log("═══ PWA Installability ═══");

const site = JSON.parse(read("public/site.webmanifest"));
check(site.display === "standalone" || site.display === "fullscreen", "display standalone/fullscreen");
check(typeof site.name === "string" && site.name.length > 0, "name");
check(typeof site.short_name === "string" && site.short_name.length > 0, "short_name");
check(site.start_url?.startsWith("/"), "start_url relative");
check(site.scope === "/", "scope /");
check(Boolean(site.theme_color && site.background_color), "theme + background colors");
check(
  Array.isArray(site.icons) && site.icons.some((i: { sizes?: string }) => i.sizes === "192x192"),
  "icon 192",
);
check(
  Array.isArray(site.icons) && site.icons.some((i: { sizes?: string }) => i.sizes === "512x512"),
  "icon 512",
);
check(
  Array.isArray(site.icons) && site.icons.some((i: { purpose?: string }) => String(i.purpose || "").includes("maskable")),
  "maskable icon",
);
check(site.dir === "rtl" && site.lang === "ar", "RTL Arabic locale");
check(
  Array.isArray(site.shortcuts) && site.shortcuts.some((s: { url?: string }) => String(s.url).includes("quran")),
  "Quran shortcut",
);

const html = read("index.html");
check(/rel=["']manifest["']/.test(html), "manifest link in index.html");
check(/apple-mobile-web-app-capable/.test(html), "apple-mobile-web-app-capable");
check(/apple-mobile-web-app-title/.test(html), "apple-mobile-web-app-title");
check(/apple-mobile-web-app-status-bar-style/.test(html), "status-bar-style");
check(/apple-touch-icon/.test(html), "apple-touch-icon");
check(/apple-touch-startup-image/.test(html), "apple-touch-startup-image (splash)");
check(/mobile-web-app-capable/.test(html), "mobile-web-app-capable");
check(/name=["']theme-color["']/.test(html), "theme-color meta");

const sw = read("public/sw.js");
check(/addEventListener\(["']install["']/.test(sw), "SW install");
check(/addEventListener\(["']fetch["']/.test(sw), "SW fetch");
check(/skipWaiting/.test(sw), "skipWaiting");
check(/clients\.claim/.test(sw), "clients.claim");
check(/\/data\/quran/.test(sw), "Quran data cache path");
check(/MAJALIS_QURAN_PRECACHE/.test(sw), "Quran precache message");

check(existsSync(resolve(root, "public/offline.html")), "offline.html");
check(existsSync(resolve(root, "public/icon-192.png")), "icon-192.png");
check(existsSync(resolve(root, "public/icon-512.png")), "icon-512.png");
check(existsSync(resolve(root, "public/apple-touch-icon.png")), "apple-touch-icon.png");

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
