/**
 * بوابة P0 — انتقال آية محددة: Canonical + legacy `/mushaf/:surah?ayah=` لا يعامل السورة كصفحة.
 * node --import tsx src/lib/__tests__/mushaf-ayah-target-nav-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildQuranAyahReference,
  buildMushafAyahHref,
  resolveCanonicalAyahHref,
  resolveLegacyMushafSurahRedirect,
  createPendingNavigationHighlight,
  openMushafAtReference,
  QuranNavigationService,
} from "@/lib/quran-navigation";
import { mushafAyahHref } from "@/features/quran-people/types";
import { buildAyahDeepLink } from "@/lib/smart-deep-link";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/** مواضع آدم الأربعة + البقرة 31 — مراجع منع التراجع */
const TARGETS = [
  { surahId: 2, ayahId: 34, page: 6, label: "البقرة 34" },
  { surahId: 7, ayahId: 11, page: 151, label: "الأعراف 11" },
  { surahId: 15, ayahId: 31, page: 263, label: "الحجر 31" },
  { surahId: 38, ayahId: 74, page: 457, label: "ص 74" },
] as const;

console.log("=== Canonical reference للمراجع الأربعة ===");
for (const row of TARGETS) {
  const built = buildQuranAyahReference({
    surahId: row.surahId,
    ayahId: row.ayahId,
    navigationSource: "prophets-stories",
  });
  assert.equal(built.ok, true, row.label);
  if (!built.ok) throw new Error(built.error);
  assert.equal(built.ref.pageNumber, row.page, `${row.label} page`);
  assert.equal(built.ref.surahId, row.surahId);
  assert.equal(built.ref.ayahId, row.ayahId);

  const href = buildMushafAyahHref(built.ref);
  assert.match(href, new RegExp(`page=${row.page}`));
  assert.match(href, new RegExp(`surah=${row.surahId}`));
  assert.match(href, new RegExp(`ayah=${row.ayahId}`));
  assert.match(href, /highlight=1/);
  assert.doesNotMatch(href, /\/mushaf\/\d+\?/);
  assert.doesNotMatch(href, new RegExp(`page=${row.surahId}(?!\\d)`));

  const pending = createPendingNavigationHighlight(built.ref);
  assert.equal(pending.verseKey, `${row.surahId}:${row.ayahId}`);
  assert.equal(pending.pageNumber, row.page);
  assert.equal(pending.status, "pending");
  assert.ok(pending.navigationIntentId.includes(pending.verseKey));
}

console.log("=== Legacy redirect: لا تعامل السورة كصفحة ===");
for (const row of TARGETS) {
  const legacy = resolveLegacyMushafSurahRedirect(String(row.surahId), `?ayah=${row.ayahId}`);
  assert.equal(legacy.legacyBuggyPageIfNumericSurah, row.surahId, row.label);
  assert.notEqual(legacy.href, `/mushaf?page=${row.surahId}`, `${row.label} must not use surah as page`);
  assert.match(legacy.href, new RegExp(`page=${row.page}`));
  assert.match(legacy.href, new RegExp(`surah=${row.surahId}`));
  assert.match(legacy.href, new RegExp(`ayah=${row.ayahId}`));
  assert.ok(legacy.pending, `${row.label} pending`);
  assert.equal(legacy.pending!.verseKey, `${row.surahId}:${row.ayahId}`);
  assert.equal(legacy.pending!.pageNumber, row.page);
}

console.log("=== Surah-only legacy: بداية السورة لا رقم السورة كصفحة ===");
const baqaraStart = resolveLegacyMushafSurahRedirect("2", "");
assert.match(baqaraStart.href, /page=2(?:&|$)/); /* البقرة تبدأ ص2 في مصحف المدينة */
assert.equal(baqaraStart.pending, null);
const arafStart = resolveLegacyMushafSurahRedirect("7", "");
assert.doesNotMatch(arafStart.href, /^\/mushaf\?page=7$/);
assert.match(arafStart.href, /page=151/);

console.log("=== مصادر الانتقال تستخدم Canonical ===");
assert.match(mushafAyahHref(2, 34), /page=6/);
assert.match(mushafAyahHref(2, 34), /surah=2/);
assert.match(mushafAyahHref(2, 34), /ayah=34/);
assert.doesNotMatch(mushafAyahHref(7, 11), /\/mushaf\/7\?/);

assert.match(resolveCanonicalAyahHref(2, 34, "search"), /source=search/);
assert.match(buildAyahDeepLink(2, 34), /page=6/);
assert.doesNotMatch(buildAyahDeepLink(2, 34), /\/mushaf\/2\?/);

assert.equal(typeof openMushafAtReference, "function");
assert.equal(typeof QuranNavigationService.openAyah, "function");

console.log("=== AppRoutes يحوّل عبر resolver لا page=surah ===");
const routes = read("src/AppRoutes.tsx");
assert.match(routes, /LegacyMushafSurahRedirect/);
assert.match(routes, /resolveLegacyMushafSurahRedirect/);
assert.doesNotMatch(routes, /Redirect to=\{`\/mushaf\?page=\$\{raw\}`\}/);

console.log("=== القارئ: chip إلغاء + لا مسح مبكر عند غياب pending ===");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
assert.match(reader, /NavigationHighlightChip/);
assert.match(reader, /إلغاء التحديد/);
assert.match(reader, /clearPendingNavigationHighlight/);
assert.match(reader, /revealedNavIntentRef/);
assert.doesNotMatch(reader, /QURAN_NAV_HIGHLIGHT_HOLD_MS \+ QURAN_NAV_HIGHLIGHT_FADE_MS/);

console.log("=== رفض آية غير صالحة ===");
const bad = buildQuranAyahReference({
  surahId: 2,
  ayahId: 9999,
  navigationSource: "deep-link",
});
assert.equal(bad.ok, false);
assert.equal(resolveCanonicalAyahHref(2, 9999, "deep-link"), "/mushaf");

console.log("mushaf-ayah-target-nav-gate.test.ts: ok");
