/**
 * بوابة تخطيط المصحف الحقيقي /mushaf — VerifiedMushafReader.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-real-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const page = read("src/features/mushaf-madinah/MushafPage.tsx");
const basmala = read("src/features/mushaf-madinah/MushafBasmala.tsx");
const viewport = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const pager = read("src/features/mushaf-madinah/MushafPager.tsx");
const actions = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
const line = read("src/features/mushaf-madinah/MushafAyahLine.tsx");
const reader = read("src/pages/quran/MushafReaderPage.tsx");
const data = read("src/lib/quran-data/qpc-page-data.ts");
const fit = read("src/features/mushaf-madinah/useMushafPageFontFit.ts");

assert.match(reader, /VerifiedMushafReader|MushafViewport/);
assert.doesNotMatch(reader, /\.pdf/i);
assert.doesNotMatch(reader, /demo-ayah/);

assert.match(css, /overflow-x:\s*(hidden|clip)/);
assert.match(css, /overflow-y:\s*hidden/);
assert.doesNotMatch(css, /\.mm-page-shell\s*\{[^}]*overflow-x:\s*scroll/);
assert.doesNotMatch(css, /aspect-ratio:\s*0\.68/);
assert.match(css, /100svh|100dvh/);
assert.match(css, /--mm-page-max-w:\s*min\(100%/);
assert.match(page, /useMushafPageFontFit/);
assert.doesNotMatch(viewport, /exitAlwaysVisible/);
assert.match(fit, /slotInkOverflows/);
assert.match(css, /\.mm-page--opening\s+\.mm-slot\[data-kind="empty"\]/);
assert.match(css, /\.mm-page-shell[^{]*\{[^}]*padding-top:\s*0/);

assert.match(css, /--mm-ref-header-y:\s*8\.3%/);
assert.match(css, /--mm-ref-text-start:\s*11\.9%/);
assert.match(css, /--mm-ref-text-end:\s*91\.1%/);
assert.match(css, /--mm-ref-cartouche-y:\s*94\.3%/);
assert.match(css, /--mm-ref-open-banner-y:\s*27\.7%/);
assert.doesNotMatch(css, /--mm-ref-open-p2-text-end/);
assert.doesNotMatch(css, /\.mm-page--opening\[data-page="2"\]/);

assert.match(css, /\.mm-ayah-bar\s*\{[^}]*z-index:\s*9999/);
assert.match(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.40\)/);
assert.doesNotMatch(css, /backdrop-filter:\s*blur\(/);
assert.match(css, /height:\s*120px/);
assert.match(css, /height:\s*50dvh/);
assert.match(css, /height:\s*90dvh/);
assert.doesNotMatch(css, /height:\s*35dvh/);
assert.doesNotMatch(css, /height:\s*85dvh/);
assert.match(css, /border-radius:\s*20px\s+20px\s+0\s+0/);
assert.match(css, /ayah-active/);
assert.match(css, /var\(--gold,\s*var\(--mm-gold\)\) 14%|var\(--mm-gold\) 14%/);
assert.match(css, /\.mm-ayah-highlight/);
assert.match(page, /MushafAyahHighlight/);
assert.match(css, /\.mm-ayah-run__text\s*\{[^}]*padding:\s*0/);
assert.match(css, /grid-template-columns:\s*repeat\(4,/);
assert.match(css, /\[data-chrome="1"\]\s*\.mm-controls__bar/);
assert.match(css, /100% - var\(--mm-ref-cartouche-y\)/);

assert.match(css, /--mm-chrome-top-h/);
assert.match(css, /--mm-chrome-bottom-h/);
assert.match(css, /\.mm-page-shell[^{]*\{[^}]*padding-top:\s*0/);
assert.match(css, /\.mm-page-shell[^{]*\{[^}]*padding-bottom:\s*0/);

assert.match(css, /\.mm-basmala\s*\{[^}]*font-size:\s*var\(--mm-basmala-size\)/);
assert.match(css, /\.mm-basmala\s*\{[^}]*text-align:\s*center/);
assert.match(css, /\.mm-basmala--uthmani\s*\{[^}]*!important/);
assert.match(page, /bismillahPre === true/);
assert.match(basmala, /BASMALA_UTHMANI/);
assert.match(basmala, /data-basmala="qpc"/);
assert.match(data, /bismillahPre/);
assert.match(data, /basmalaSlot/);
assert.match(page, /needsVisualBasmala/);

assert.match(line, /mm-ayah-hit--end/);
assert.match(css, /\.mm-ayah-number/);
assert.match(css, /\[data-type="end"\]/);
assert.doesNotMatch(css, /transition:\s*background-color\s+150ms/);

assert.match(actions, /mm-ayah-bar__handle/);
assert.match(actions, /data-sheet-height/);
assert.match(actions, /is-expanded|setHeight/);
assert.match(actions, /تفسير/);
assert.match(actions, /تلاوة/);
assert.doesNotMatch(actions, /المزيد/);
assert.match(actions, /aria-modal="true"/);
assert.match(actions, /createPortal/);
assert.match(actions, /focusables|Tab/);

// RTL: سحب لليمين (dx>0) = التالية
assert.match(pager, /dx > 0/);
assert.match(pager, /go\(page \+ 1\)/);
assert.match(pager, /go\(page - 1\)/);
assert.match(pager, /SWIPE_MIN_PX\s*=\s*45/);
assert.match(pager, /SETTLE_MS\s*=\s*250/);
assert.doesNotMatch(pager, /rotateY/);
assert.match(viewport, /suppressPageSyncRef/);
assert.match(viewport, /useMediaSession/);
assert.match(viewport, /اختر آية أولاً/);
assert.match(viewport, /listAyahAudioUrls/);
assert.match(viewport, /import\.meta\.env\.DEV/);

assert.match(line, /stopPropagation/);
assert.match(line, /LONG_PRESS_MS/);
assert.match(line, /onPointerDown/);
assert.match(line, /data-testid="mushaf-ayah-hit"/);

assert.match(css, /فوق مناطق قلب الصفحة/);
assert.match(css, /data-ayah-bar="1"\]\s*\.mm-page-edge/);
assert.match(css, /scroll-margin-bottom/);
assert.match(css, /scrollbar-width:\s*none/);
assert.match(css, /\.mm-page-edge--next\s*\{[^}]*inset-inline-start:\s*0/);

assert.match(actions, /جاري تحميل التلاوة/);
assert.match(actions, /تعذر تحميل التلاوة/);
assert.match(actions, /mushaf-ayah-play/);
assert.match(actions, /handlePlayClick|onTogglePlay/);
assert.match(actions, /SkipBack|onPrevAyah/);
assert.match(actions, /آية \{parsed\?\.ayah|آية \$\{parsed/);

const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
for (const id of ["alafasy", "abdulsamad", "husary", "minshawi", "ghamdi", "maher"]) {
  assert.match(dock, new RegExp(`"${id}"`));
}
assert.match(read("src/features/mushaf-madinah/MushafSurahOrnament.tsx"), /mm-surah-ornament__motif/);
assert.match(viewport, /addEventListener\("scroll"/);

assert.match(css, /html\[data-theme="dark"\]\s*\.mm-viewport/);
assert.match(css, /--mm-ink:\s*#f4efe5|--mm-ink:\s*#f7faf7|--mm-ink:\s*#ffffff/);
assert.match(css, /--mm-paper:\s*#fbf7ef/);
assert.match(css, /rgba\(191,\s*159,\s*91,\s*0\.(1[0-9]|22)\)/);

assert.match(page, /filledSlots|mm-page__body--opening/);
assert.doesNotMatch(page, /\(15 - span\) \/ 2/);
assert.match(page, /النمل/);

assert.match(css, /width:\s*13\.1%/);
assert.match(read("src/features/mushaf-madinah/MushafPageFooter.tsx"), /mm-page-footer__cartouche/);

console.log("mushaf-real-layout-gate.test.ts: ok");
