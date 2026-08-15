/**
 * اختبارات أساس إطلاق PWA / الجوال.
 * تشغيل: npx tsx src/lib/__tests__/pwa-mobile-launch.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isNavHrefActive } from "../nav-active";
import { isPlaceholderLessonImage, resolveLessonPosterUrl } from "../lesson-image";
import { normalizePath } from "../seo";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../");

// ── Phase 1: manifests ──────────────────────────────────────────────────────
assert.ok(existsSync(resolve(root, "public/brand/splash-logo.png")), "شعار الدخول يبقى للواجهة");
assert.ok(!existsSync(resolve(root, "public/brand/splash-source.png")), "مصدر توليد الإقلاع محذوف");
assert.ok(!existsSync(resolve(root, "public/brand/apple-splash")), "لا صور إقلاع PWA يتيمة");

const siteManifest = JSON.parse(readFileSync(resolve(root, "public/site.webmanifest"), "utf8"));
assert.equal(siteManifest.display, "standalone");
assert.equal(siteManifest.orientation, "portrait-primary");
assert.equal(siteManifest.name, "المجلس العلمي");
assert.equal(siteManifest.short_name, "المجلس العلمي");
assert.equal(siteManifest.start_url, "/");
assert.equal(siteManifest.theme_color, "#F2F4F3");
assert.equal(siteManifest.background_color, "#002b21");
assert.ok(siteManifest.icons.some((i: { src: string }) => i.src.includes("icon-512")));
assert.ok(existsSync(resolve(root, "public/manifest.webmanifest")));
assert.ok(existsSync(resolve(root, "public/manifest.json")));

const jsonManifest = JSON.parse(readFileSync(resolve(root, "public/manifest.json"), "utf8"));
assert.equal(jsonManifest.name, "المجلس العلمي");
assert.equal(jsonManifest.short_name, "المجلس العلمي");
assert.equal(jsonManifest.start_url, "/");
assert.equal(jsonManifest.display, "standalone");
assert.equal(jsonManifest.theme_color, "#F2F4F3");
assert.equal(jsonManifest.background_color, "#002b21");
assert.ok(existsSync(resolve(root, "public/sw.js")));
assert.ok(existsSync(resolve(root, "public/offline.html")));

const sw = readFileSync(resolve(root, "public/sw.js"), "utf8");
assert.match(sw, /addEventListener\("push"/);
assert.match(sw, /site\.webmanifest/);
assert.match(sw, /offline\.html/);

// ── Phase 2: media helpers ──────────────────────────────────────────────────
assert.equal(isPlaceholderLessonImage("/images/posters/foo.svg"), true);
assert.equal(resolveLessonPosterUrl("/images/posters/foo.svg"), undefined);
assert.equal(resolveLessonPosterUrl("https://cdn.example.com/lesson.jpg"), "https://cdn.example.com/lesson.jpg");

// ── Phase 3: SEO path normalize ─────────────────────────────────────────────
assert.equal(normalizePath("/lessons/?tab=1#x"), "/lessons");
assert.equal(normalizePath("/"), "/");

const seoRoutes = JSON.parse(readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8"));
assert.ok(String(seoRoutes.defaultImage).includes("/brand/official-og.png"));

// ── Phase 5/6: push API handler exists + no private key leak patterns in client
assert.ok(existsSync(resolve(root, "lib/api-handlers/push-subscribe.js")));
const pushClient = readFileSync(resolve(root, "src/lib/push-notifications.ts"), "utf8");
assert.doesNotMatch(pushClient, /import\.meta\.env\.VAPID_PRIVATE/);
assert.doesNotMatch(pushClient, /process\.env\.VAPID_PRIVATE/);
assert.match(pushClient, /VITE_VAPID_PUBLIC_KEY/);

const dispatch = readFileSync(resolve(root, "lib/api-dispatch.mjs"), "utf8");
assert.match(dispatch, /\/api\/push\/subscribe/);
assert.match(dispatch, /pushSubscribeRateLimit/);

// ── Nav smoke (critical mobile flow) ────────────────────────────────────────
assert.equal(isNavHrefActive("/mushaf", "/mushaf"), true);
assert.equal(isNavHrefActive("/mushaf/page/12", "/mushaf"), true);
assert.equal(isNavHrefActive("/prayer-times", "/prayer-times"), true);
assert.equal(isNavHrefActive("/lessons", "/"), false);

console.log("pwa-mobile-launch.test.ts: ok");
