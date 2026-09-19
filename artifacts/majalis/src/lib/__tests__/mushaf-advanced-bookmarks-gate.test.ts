/**
 * بوابة نظام فواصل المصحف المتقدم.
 * Run: node --import tsx src/lib/__tests__/mushaf-advanced-bookmarks-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const majalisRoot = resolve(here, "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const kinds = read("src/lib/quran-bookmark-kinds.ts");
const store = read("src/lib/quran-my-bookmarks.ts");
const ops = read("src/lib/quran-my-bookmarks-ops.ts");
const composer = read("src/features/mushaf-bookmarks/MushafBookmarkComposer.tsx");
const markers = read("src/features/mushaf-bookmarks/MushafBookmarkMarkers.tsx");
const manager = read("src/pages/quran/ui/MushafBookmarksView.tsx");
const css = read("src/styles/reader-bookmarks.css");
const managerCss = read("src/styles/reader-bookmarks-manager.css");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const controls = read("src/features/mushaf-reader/MushafControlsLayer.tsx");
const nav = read("src/features/mushaf-reader/mushaf-reader-nav-contract.ts");
const routes = read("src/AppRoutes.tsx");

assert.match(kinds, /wird/);
assert.match(kinds, /hifz/);
assert.match(kinds, /review/);
assert.match(kinds, /tadabbur/);
assert.match(kinds, /lesson/);
assert.match(kinds, /custom/);

assert.match(store, /MY_BOOKMARKS_MAX\s*=\s*1000/);
assert.match(store, /getBookmarksOnPage/);
assert.match(store, /kind:\s*MushafBookmarkKind/);
assert.match(store, /khatmaId/);
assert.match(store, /wirdSlot/);
assert.doesNotMatch(store, /import\s+(?!type\s)\{[^}]*\}\s+from\s+["']@\/lib\/quran-bookmark-kinds["']/);
assert.match(ops, /addTypedBookmark/);
assert.match(ops, /getBookmarkStats/);
assert.match(ops, /exportBookmarksJson/);
assert.match(ops, /importBookmarksJson/);
assert.match(ops, /archiveBookmark/);

assert.match(composer, /data-testid="mushaf-bookmark-composer"/);
assert.match(composer, /إضافة فاصل/);
assert.match(composer, /quran-my-bookmarks-ops/);
assert.match(markers, /data-testid="mushaf-bookmark-markers"/);
assert.match(markers, /rb-markers__dot/);
assert.match(manager, /data-testid="mushaf-bookmarks-manager"/);
assert.match(manager, /تصدير/);
assert.match(manager, /استيراد/);
assert.match(manager, /quran-my-bookmarks-ops/);

assert.match(css, /\.rb-markers__dot/);
assert.doesNotMatch(css, /transform:\s*scale\(/);
assert.match(css, /inset-inline-start:\s*0\.12rem/);
assert.doesNotMatch(css, /\.rb-manager\b/);
assert.match(managerCss, /\.rb-manager\b/);
assert.match(manager, /reader-bookmarks-manager\.css/);

assert.match(reader, /MushafBookmarkComposer/);
assert.match(reader, /MushafBookmarkMarkers/);
assert.match(reader, /reader-bookmarks\.css/);
assert.doesNotMatch(reader, /reader-bookmarks-manager\.css/);
assert.match(controls, /إضافة فاصل/);
assert.match(controls, /mushaf-bookmarks-manager-link/);
assert.match(nav, /id:\s*"bookmark",\s*enabled:\s*true/);

assert.match(routes, /\/mushaf\/bookmarks/);
assert.match(routes, /MushafBookmarksPage/);
assert.ok(existsSync(resolve(majalisRoot, "src/pages/quran/MushafBookmarksPage.tsx")));

/* لا يغطي النص بمستطيل عريض */
assert.doesNotMatch(markers, /width:\s*['"`]?100%/);
assert.match(css, /pointer-events:\s*none/);

console.log("mushaf-advanced-bookmarks-gate.test.ts: ok");
