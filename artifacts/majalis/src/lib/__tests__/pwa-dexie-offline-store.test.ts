/**
 * بوابة PWA + Dexie offline-first.
 * تشغيل: node --import tsx src/lib/__tests__/pwa-dexie-offline-store.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OFFLINE_STORES } from "../offline-engine";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../");

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

// ── Manifest + iOS ──────────────────────────────────────────────────────────
const manifest = JSON.parse(read("public/manifest.json"));
assert.equal(manifest.name, "سُنّة");
assert.equal(manifest.short_name, "سُنّة");
assert.equal(manifest.lang, "ar");
assert.equal(manifest.dir, "rtl");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.theme_color, "#F2F4F3");
assert.equal(manifest.background_color, "#F2F4F3");
assert.ok(manifest.icons.some((i: { sizes: string }) => i.sizes.includes("192")));
assert.ok(manifest.icons.some((i: { sizes: string }) => i.sizes.includes("512")));

const site = JSON.parse(read("public/site.webmanifest"));
assert.equal(site.name, manifest.name);
assert.equal(site.dir, "rtl");
assert.ok(site.icons.some((i: { sizes: string }) => i.sizes.includes("1024")));

const html = read("index.html");
assert.match(html, /apple-mobile-web-app-capable/);
assert.match(html, /apple-mobile-web-app-title" content="سُنّة"/);
assert.match(html, /manifest\.webmanifest/);
assert.match(html, /format-detection" content="telephone=no"/);
assert.match(html, /application-name" content="سُنّة"/);

// ── Dexie stores ────────────────────────────────────────────────────────────
assert.equal(OFFLINE_STORES.quran, "quran");
assert.equal(OFFLINE_STORES.adhkar, "adhkar");
assert.equal(OFFLINE_STORES.bookmarks, "bookmarks");

const engine = read("src/lib/offline-engine.ts");
assert.match(engine, /majalis-offline-engine-v2/);
assert.match(engine, /from "dexie"/);

const content = read("src/lib/offline-content-store.ts");
assert.match(content, /withOfflineFirst/);
assert.match(content, /getCachedAdhkarPack/);
assert.match(content, /cacheQuranSurah/);

assert.ok(existsSync(resolve(root, "src/lib/offline-bookmarks.ts")));
assert.match(read("src/lib/local-bookmarks.ts"), /persistOfflineBookmarks/);
assert.match(read("src/lib/local-bookmarks.ts"), /listBookmarksOfflineFirst/);

assert.match(read("src/lib/adhkar-service.ts"), /withOfflineFirst/);
assert.match(read("src/lib/adhkar-service.ts"), /getCachedAdhkarPack/);
assert.match(read("src/hooks/useOfflineContent.ts"), /cache-first/);
assert.match(read("src/lib/quran-api.ts"), /getCachedQuranSurah/);
assert.match(read("src/lib/offline-sync-bootstrap.ts"), /migrateLocalBookmarksToIdb/);

// ── Service worker shell ────────────────────────────────────────────────────
const sw = read("public/sw.js");
assert.match(sw, /STATIC_SHELL_ASSETS/);
assert.match(sw, /manifest\.json/);
assert.doesNotMatch(sw, /STATIC_SHELL_ASSETS[\s\S]*AmiriQuran-Regular\.woff2/, "لا precache لخط المصحف في الغلاف");
assert.match(sw, /apple-touch-icon/);
assert.match(sw, /staleWhileRevalidate|cacheFirst/);
assert.ok(existsSync(resolve(root, "public/offline.html")));
assert.ok(existsSync(resolve(root, "public/icon-192.png")));
assert.ok(existsSync(resolve(root, "public/icon-512.png")));

assert.match(read("src/lib/service-worker.ts"), /serviceWorker\.register\("\/sw\.js"\)/);

// ── Dexie dependency ────────────────────────────────────────────────────────
const pkg = JSON.parse(read("package.json"));
assert.ok(pkg.dependencies?.dexie || pkg.devDependencies?.dexie);

console.log("pwa-dexie-offline-store.test.ts: ok");
