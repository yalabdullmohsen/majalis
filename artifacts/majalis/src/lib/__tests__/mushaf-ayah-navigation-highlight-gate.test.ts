/**
 * بوابة P0 — تنقّل آية سياقي (آدم + تعميم الأنبياء) بلا تفسير/صوت تلقائي.
 * node --import tsx src/lib/__tests__/mushaf-ayah-navigation-highlight-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildQuranAyahReference,
  buildMushafAyahHref,
  ayahBelongsToPage,
  QuranNavigationService,
} from "@/lib/quran-navigation";
import { findMushafPageForAyah } from "@/features/mushaf-madinah/mushaf-page-for-ayah";
import { PROPHET_MUSHAF_MENTIONS } from "@/lib/prophet-mushaf-mentions";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const ADAM = [
  { surahId: 2, ayahId: 34, page: 6 },
  { surahId: 7, ayahId: 11, page: 151 },
  { surahId: 15, ayahId: 31, page: 263 },
  { surahId: 38, ayahId: 74, page: 457 },
] as const;

console.log("=== آدم: Page Mapping المعتمدة ===");
assert.equal(PROPHET_MUSHAF_MENTIONS.adam.length, 4);
for (const row of ADAM) {
  const mapped = findMushafPageForAyah(row.surahId, row.ayahId);
  assert.equal(mapped, row.page, `${row.surahId}:${row.ayahId}`);
  const built = buildQuranAyahReference({
    surahId: row.surahId,
    ayahId: row.ayahId,
    navigationSource: "prophets-stories",
  });
  assert.equal(built.ok, true);
  if (!built.ok) throw new Error(built.error);
  assert.equal(built.ref.pageNumber, row.page);
  assert.equal(ayahBelongsToPage(row.surahId, row.ayahId, row.page), true);
  const href = buildMushafAyahHref(built.ref);
  assert.match(href, new RegExp(`page=${row.page}`));
  assert.match(href, /highlight=1/);
  assert.match(href, /source=prophets-stories/);
  assert.doesNotMatch(href, /tafsir=1|autoplay=1|actions=1/);
}

console.log("=== عزل الحالات في القارئ ===");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
assert.match(reader, /setNavigationHighlightedAyahId/);
assert.match(reader, /peekPendingNavigationHighlight/);
assert.match(reader, /consumePendingNavigationHighlight/);
const navIdx = reader.indexOf("/** تمييز تنقّل سياقي");
assert.ok(navIdx >= 0, "navigation effect comment");
const navBlock = reader.slice(navIdx, navIdx + 1400);
assert.match(navBlock, /setTafsirOpen\(false\)/);
assert.match(navBlock, /setActionsOpen\(false\)/);
assert.match(navBlock, /setAudioDockOpen\(false\)/);
assert.doesNotMatch(navBlock, /setTafsirOpen\(true\)/);
assert.doesNotMatch(navBlock, /\.play\(|startPlayback\(/);

console.log("=== البطاقات + الخدمة المركزية ===");
const cards = read("src/components/prophets/ProphetMushafMentions.tsx");
assert.match(cards, /QuranNavigationService\.openAyah/);
assert.match(cards, /فتح في المصحف/);
assert.match(cards, /returnContext/);
const stories = read("src/views/ProphetStoriesPage.tsx");
assert.match(stories, /ProphetMushafMentions/);
assert.match(stories, /PROPHET_MUSHAF_MENTIONS/);

console.log("=== تعميم: كل مواضع الأنبياء عبر الخدمة ===");
const prophetSlugs = Object.keys(PROPHET_MUSHAF_MENTIONS);
assert.ok(prophetSlugs.length >= 16, `expected generalized prophets, got ${prophetSlugs.length}`);
assert.ok(prophetSlugs.includes("adam"));
for (const slug of prophetSlugs) {
  const mentions = PROPHET_MUSHAF_MENTIONS[slug];
  assert.ok(mentions?.length, slug);
  for (const m of mentions) {
    const mapped = findMushafPageForAyah(m.surahId, m.ayahId);
    assert.ok(typeof mapped === "number" && mapped > 0, `${slug} ${m.surahId}:${m.ayahId}`);
    const built = buildQuranAyahReference({
      surahId: m.surahId,
      ayahId: m.ayahId,
      navigationSource: "prophets-stories",
    });
    assert.equal(built.ok, true, `${slug} ${m.surahId}:${m.ayahId}`);
    if (!built.ok) throw new Error(built.error);
    assert.equal(built.ref.pageNumber, mapped);
    const href = buildMushafAyahHref(built.ref);
    assert.match(href, new RegExp(`page=${mapped}`));
    assert.match(href, /highlight=1/);
    assert.doesNotMatch(href, /tafsir=1|autoplay=1|actions=1/);
  }
}

console.log("=== رفض تخمين الصفحة ===");
const bad = buildQuranAyahReference({
  surahId: 2,
  ayahId: 34,
  navigationSource: "prophets-stories",
  pageNumberOverride: 7,
});
assert.equal(bad.ok, false);

assert.equal(typeof QuranNavigationService.buildReference, "function");
assert.equal(typeof QuranNavigationService.buildHref, "function");
assert.equal(typeof QuranNavigationService.openAyah, "function");

console.log("mushaf-ayah-navigation-highlight-gate.test.ts: ok");
