/**
 * طبقات المصحف فقط: تحديد متصل، لوحة، بحث، أرقام، تقليب — بلا تغيير تخطيط النص.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-reader-layers-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMushafPageQuery, TOTAL_QURAN_PAGES } from "../../lib/quran-last-page";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const line = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
const page = read("src/features/mushaf-madinah/MushafPage.tsx");
const actions = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
const controls = read("src/features/mushaf-madinah/MushafControls.tsx");
const search = read("src/features/mushaf-madinah/MushafSearchSheet.tsx");
const reader = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const pager = read("src/features/mushaf-madinah/MushafPager.tsx");
const tafsir = read("src/features/mushaf-madinah/TafsirTabPanel.tsx");
const highlight = read("src/features/mushaf-madinah/MushafAyahHighlight.tsx");

assert.match(line, /\{(w|word)\.glyphText\}/);
assert.doesNotMatch(line, /MushafAyahNumber/);
assert.match(css, /\.ayah-active\.mm-ayah-line__word:not\(\[data-type="end"\]\)/);
assert.match(css, /\.mm-ayah-hit--end\.ayah-active/);
assert.match(css, /\.mm-ayah-hl__band/);
assert.match(page, /MushafAyahHighlight/);
assert.match(highlight, /getClientRects/);
assert.doesNotMatch(page, /inlineBasmala/);

assert.match(actions, /useState<SheetTab>\("tilawa"\)/);
assert.match(actions, /setHeight\("half"\)/);
assert.match(actions, /تفسير/);
assert.match(actions, /تلاوة/);
assert.match(actions, /معاني/);
assert.match(actions, /تجويد/);
assert.match(actions, /ayahPreview/);
assert.match(tafsir, /تعذّر جلب التفسير|لا يوجد تفسير متاح/);

assert.match(controls, /\{pageNumber\} \/ \{MUSHAF_PAGE_MAX\}/);
assert.match(controls, /mm-goto__error/);
assert.match(controls, /أدخل رقمًا بين/);
assert.match(css, /\.mm-controls__page[\s\S]*?font-weight:\s*800/);
assert.match(css, /grid-template-columns:\s*1fr auto 1fr/);

assert.match(search, /searchVersesInCorpus/);
assert.match(search, /لا نتائج/);
assert.match(search, /جاري البحث/);
assert.match(search, /تعذّر البحث/);
assert.match(search, /e\.preventDefault\(\)/);
assert.match(search, /رقم الصفحة يجب أن يكون بين/);
assert.match(search, /300/);
assert.match(search, /type="text"/);
assert.match(reader, /pendingSelectRef/);
assert.match(reader, /setSelectedVerseKey\(verseKey\)/);
assert.match(reader, /setActionsOpen\(true\)/);
assert.match(reader, /MushafSettingsSheet/);
assert.match(css, /align-items:\s*flex-start/);
assert.match(css, /\.mm-page-footer__badge\s*\{[^}]*left:\s*50%/);

assert.match(pager, /dx > 0/);
assert.match(pager, /locking\.current = true/);
assert.match(pager, /SWIPE_MIN_PX\s*=\s*40/);
assert.match(pager, /haptics\.selection/);
assert.match(reader, /savePagePosition/);
assert.match(reader, /onTapEmpty/);
assert.match(reader, /haptics\.success/);
assert.match(reader, /beginPowerSaverSession/);
assert.match(reader, /startBatteryFpsMonitor/);
assert.match(reader, /data-audio-dock/);
assert.match(reader, /scrollAyahIntoViewCentered|block:\s*"center"/);
assert.match(css, /--mm-ayah-select:\s*rgba\(46,\s*125,\s*82/);
assert.match(css, /margin-bottom:\s*var\(--mm-dock-pad\)/);
assert.match(css, /--mm-dock-pad:\s*calc\([^)]*var\(--inset-bottom/);

assert.equal(TOTAL_QURAN_PAGES, 604);
assert.equal(parseMushafPageQuery("255"), 255);
assert.equal(parseMushafPageQuery("٢٥٥"), 255);
assert.equal(parseMushafPageQuery("۲۵۵"), 255);
assert.equal(parseMushafPageQuery("700"), 700);
const pageFiles = readdirSync(resolve(root, "public/data/quran-v2/pages")).filter((f) =>
  /^page-\d+\.json$/.test(f),
);
assert.equal(pageFiles.length, 604);

console.log("mushaf-reader-layers-gate.test.ts: ok");
