/**
 * Wave 34 — فراغات/أخطاء عامة (أوفلاين·تلاوة·أذان·موقع·نسخ) + SEO ≥80 لمسارات عامة رقيقة.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave34-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const ui = read("src/lib/ui-copy.ts");
assert.match(ui, /offline:\s*"أنت غير متصل، سيتم عرض المحتوى المحفوظ"/);

const offline = read("src/components/OfflineBanner.tsx");
assert.match(offline, /EMPTY\.offline/);
assert.match(offline, /BUTTON\.retry/);
assert.doesNotMatch(offline, /أنت غير متصل، سيتم عرض المحتوى المحفوظ/);

const action = read("src/components/QuranActionBar.tsx");
assert.match(action, /STATUS\.networkError/);
assert.match(action, /STATUS\.loadError/);
assert.match(action, /EMPTY\.data/);
assert.doesNotMatch(action, /تعذّر تشغيل التلاوة\. تحقق من الاتصال/);

const mini = read("src/components/quran/QuranMiniPlayerBar.tsx");
assert.match(mini, /STATUS\.networkError/);
assert.match(mini, /BUTTON\.retry/);
assert.doesNotMatch(mini, /تعذّر تشغيل التلاوة\./);

const muezzin = read("src/components/adhan/MuezzinPicker.tsx");
assert.match(muezzin, /STATUS\.networkError/);
assert.doesNotMatch(muezzin, /تعذّر تشغيل المعاينة/);

const prayer = read("src/components/prayer/PrayerLocationPicker.tsx");
assert.match(prayer, /STATUS\.networkError/);
assert.doesNotMatch(prayer, /تعذّر الحصول على الموقع/);

const immersivePage = read("src/components/quran/ImmersiveQuranPage.tsx");
assert.match(immersivePage, /STATUS\.loadError/);
assert.doesNotMatch(immersivePage, /تعذّر النسخ/);

const immersiveApp = read("src/components/quran/ImmersiveQuranApp.tsx");
assert.match(immersiveApp, /STATUS\.loadError/);
assert.doesNotMatch(immersiveApp, /تعذّر النسخ/);

const verified = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
assert.match(verified, /STATUS\.loadError/);
assert.doesNotMatch(verified, /setCopyStatus\("تعذّر النسخ"\)/);
assert.doesNotMatch(verified, /setAudioStatus\("فشل التحميل"\)/);

const seo = JSON.parse(read("src/lib/seo-routes.json")) as {
  routes: Array<{ path: string; description?: string }>;
};
const enriched = [
  "/kuwait-lessons",
  "/quran/tajweed",
  "/prayer-ranks",
  "/qibla",
  "/tasbih",
  "/daily-wird",
  "/occasions",
  "/announcements",
];
for (const path of enriched) {
  const r = seo.routes.find((x) => x.path === path);
  assert.ok(r?.description && r.description.length >= 80, `${path} SEO ≥80`);
  assert.doesNotMatch(r.description, /ضمن منصة/);
}

console.log("content-quality-wave34-gate.test.ts: ok");
