/**
 * Wave 35 — توحيد أخطاء عامة (نسخ·مشاركة·تفسير صوتي·إمساكية·أذان) + SEO عام ≥80 (بلا رقيق عام).
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave35-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const mushaf = read("src/features/mushaf-reader/NewMushafReader.tsx");
assert.match(mushaf, /STATUS\.loadError/);
assert.doesNotMatch(mushaf, /setStatus\("تعذّر النسخ"\)/);

const ayah = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
assert.match(ayah, /STATUS\.loadError/);
assert.match(ayah, /STATUS\.networkError/);
assert.doesNotMatch(ayah, /\? "حدث خطأ"/);
assert.doesNotMatch(ayah, /تعذّر تشغيل التفسير الصوتي/);

const viewer = read("src/components/QuranViewer.tsx");
assert.match(viewer, /STATUS\.loadError/);
assert.doesNotMatch(viewer, /تعذّرت المشاركة/);

const timetable = read("src/components/prayer/PrayerAnnualTimetable.tsx");
assert.match(timetable, /STATUS\.loadError/);
assert.doesNotMatch(timetable, /تعذّر توليد الإمساكية/);

const adhan = read("src/pages/worship/ui/AdhanSettingsView.tsx");
assert.match(adhan, /STATUS\.networkError/);
assert.match(adhan, /STATUS\.loadError/);
assert.doesNotMatch(adhan, /تعذّر تشغيل المعاينة/);
assert.doesNotMatch(adhan, /تعذّرت إعادة الجدولة/);

const seo = JSON.parse(read("src/lib/seo-routes.json")) as {
  routes: Array<{ path: string; description?: string }>;
};
const skip = new Set(["/library", "/quran", "/more", "/bookmarks", "/downloads"]);
const isAuthAdmin = (p: string) =>
  p.startsWith("/auth") || p.startsWith("/admin") || p.includes("/admin");
const remainingThin = seo.routes.filter((r) => {
  if (skip.has(r.path) || isAuthAdmin(r.path)) return false;
  return (r.description || "").length < 65;
});
assert.equal(remainingThin.length, 0, `remaining_thin=${remainingThin.map((r) => r.path).join(",")}`);

const enriched = [
  "/hajj",
  "/zakat",
  "/scholars",
  "/riba",
  "/lessons/current",
  "/courses",
  "/privacy",
  "/terms",
  "/login",
  "/register",
];
for (const path of enriched) {
  const r = seo.routes.find((x) => x.path === path);
  assert.ok(r?.description && r.description.length >= 80, `${path} SEO ≥80`);
  assert.doesNotMatch(r.description, /ضمن منصة/);
}

console.log("content-quality-wave35-gate.test.ts: ok");
