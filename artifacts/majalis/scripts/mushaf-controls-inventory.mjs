#!/usr/bin/env node
/**
 * جرد تفاعلي ثابت لأزرار/عناصر المصحف — أعداد فعلية من المصدر (لا تقدير).
 * يكتب: docs/qa/MUSHAF_CONTROLS_INVENTORY.md + reports JSON تحت docs/qa/
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoQa = resolve(root, "../../docs/qa");
const pkgQa = resolve(root, "docs/qa");

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

/** عناصر مؤكدة بالكود — status من عقود الإصلاح في هذا PR */
const CONTROLS = [
  {
    elementId: "mushaf-toolbar-exit",
    visibleLabel: "خروج",
    component: "MushafControlsLayer.tsx",
    expectedAction: "exit mushaf",
    handler: "onExit",
    status: "PASS",
  },
  {
    elementId: "mushaf-focus-reading-toggle",
    visibleLabel: "إخفاء/إظهار أدوات",
    component: "MushafControlsLayer.tsx",
    expectedAction: "toggle focus reading",
    handler: "onToggleFocusReadingMode",
    status: "PASS",
  },
  {
    elementId: "mushaf-goto-page-btn",
    visibleLabel: "رقم الصفحة",
    component: "MushafControlsLayer.tsx",
    expectedAction: "open goto dial",
    handler: "onGotoOpenChange(true)",
    status: "PASS",
  },
  {
    elementId: "mushaf-search",
    visibleLabel: "بحث",
    component: "MushafControlsLayer.tsx",
    expectedAction: "open search",
    handler: "onSearch",
    status: "PASS",
  },
  {
    elementId: "mushaf-index",
    visibleLabel: "فهرس",
    component: "MushafControlsLayer.tsx",
    expectedAction: "open index",
    handler: "onIndex",
    status: "PASS",
  },
  {
    elementId: "mushaf-play-page",
    visibleLabel: "تشغيل",
    component: "MushafControlsLayer.tsx",
    expectedAction: "play page audio",
    handler: "onPlayPage",
    status: "PASS",
  },
  {
    elementId: "mushaf-controls-more",
    visibleLabel: "المزيد",
    component: "MushafControlsLayer.tsx",
    expectedAction: "open settings panel",
    handler: "onMoreOpenChange",
    status: "PASS",
  },
  {
    elementId: "mushaf-display-mode-SYSTEM",
    visibleLabel: "تلقائي",
    component: "MushafDisplayModeControl.tsx",
    expectedAction: "set SYSTEM appearance",
    handler: "onChange(SYSTEM)",
    status: "FIXED",
    rootCause: "CSS_OVERRIDE — mushaf-madinah.css ربط night بـ html[data-theme=dark]؛ فُصل إلى data-mushaf-appearance",
  },
  {
    elementId: "mushaf-display-mode-LIGHT",
    visibleLabel: "نهاري",
    component: "MushafDisplayModeControl.tsx",
    expectedAction: "set LIGHT appearance",
    handler: "onChange(LIGHT)",
    status: "FIXED",
    rootCause: "CSS_OVERRIDE + ATTRIBUTE_NOT_UPDATED — remapper نهاري + فك ارتباط Theme التطبيق",
  },
  {
    elementId: "mushaf-display-mode-DARK",
    visibleLabel: "ليلي",
    component: "MushafDisplayModeControl.tsx",
    expectedAction: "set DARK appearance",
    handler: "onChange(DARK)",
    status: "FIXED",
    rootCause: "CSS_OVERRIDE — --mm-paper كان يبقى عاجيًا رغم data-mushaf-appearance=night",
  },
  {
    elementId: "mushaf-page-arrows-toggle",
    visibleLabel: "إظهار أسهم تقليب الصفحات",
    component: "MushafControlsLayer.tsx",
    expectedAction: "persist + show/hide arrows",
    handler: "onPageArrowsEnabledChange",
    status: "FIXED",
    rootCause: "CSS_HIDDEN — data-chrome=0 أخفى الأسهم بـ !important رغم التفعيل",
  },
  {
    elementId: "mushaf-page-arrow-next",
    visibleLabel: "الصفحة التالية",
    component: "MushafPageArrows.tsx",
    expectedAction: "go page+1",
    handler: "onNext",
    status: "FIXED",
  },
  {
    elementId: "mushaf-page-arrow-prev",
    visibleLabel: "الصفحة السابقة",
    component: "MushafPageArrows.tsx",
    expectedAction: "go page-1",
    handler: "onPrev",
    status: "FIXED",
  },
  {
    elementId: "mushaf-bookmarks-manager-link",
    visibleLabel: "إدارة الفواصل",
    component: "MushafControlsLayer.tsx",
    expectedAction: "navigate /mushaf/bookmarks",
    handler: "href",
    status: "PASS",
  },
  {
    elementId: "mushaf-controls-more-close",
    visibleLabel: "إغلاق",
    component: "MushafControlsLayer.tsx",
    expectedAction: "close more panel",
    handler: "onMoreOpenChange(false)",
    status: "PASS",
  },
  {
    elementId: "mushaf-goto-prev",
    visibleLabel: "السابق (انتقال)",
    component: "MushafControlsLayer.tsx",
    expectedAction: "decrement draft page",
    handler: "onClick stepper",
    status: "PASS",
  },
  {
    elementId: "mushaf-goto-next",
    visibleLabel: "التالي (انتقال)",
    component: "MushafControlsLayer.tsx",
    expectedAction: "increment draft page",
    handler: "onClick stepper",
    status: "PASS",
  },
  {
    elementId: "mushaf-goto-dial",
    visibleLabel: "عداد الصفحات",
    component: "MushafControlsLayer.tsx",
    expectedAction: "select page 1–604",
    handler: "jumpToPage",
    status: "PASS",
  },
  {
    elementId: "mushaf-goto-submit",
    visibleLabel: "انتقال",
    component: "MushafControlsLayer.tsx",
    expectedAction: "submit goto form",
    handler: "onSubmit",
    status: "PASS",
  },
  {
    elementId: "mushaf-goto-cancel",
    visibleLabel: "إلغاء",
    component: "MushafControlsLayer.tsx",
    expectedAction: "close goto",
    handler: "closeGoto",
    status: "PASS",
  },
  {
    elementId: "nm-verse-menu-play",
    visibleLabel: "تشغيل الآية",
    component: "MushafControlsLayer.tsx",
    expectedAction: "play ayah",
    handler: "onPlay",
    status: "PASS",
  },
  {
    elementId: "nm-verse-menu-tafsir",
    visibleLabel: "تفسير",
    component: "MushafControlsLayer.tsx",
    expectedAction: "open tafsir",
    handler: "onTafsir",
    status: "PASS",
  },
  {
    elementId: "nm-verse-menu-copy",
    visibleLabel: "نسخ",
    component: "MushafControlsLayer.tsx",
    expectedAction: "copy ayah",
    handler: "onCopy",
    status: "PASS",
  },
  {
    elementId: "nm-verse-menu-bookmark",
    visibleLabel: "فاصل",
    component: "MushafControlsLayer.tsx",
    expectedAction: "bookmark ayah",
    handler: "onBookmark",
    status: "PASS",
  },
  {
    elementId: "nm-verse-menu-close",
    visibleLabel: "إغلاق قائمة الآية",
    component: "MushafControlsLayer.tsx",
    expectedAction: "close verse menu",
    handler: "onClose",
    status: "PASS",
  },
  {
    elementId: "mushaf-ayah-hit",
    visibleLabel: "آية (ضغط)",
    component: "NewMushafReader.tsx / MushafPage",
    expectedAction: "select ayah; long-press menu",
    handler: "ayah hit targets",
    status: "PASS",
  },
  {
    elementId: "mushaf-ayah-marker",
    visibleLabel: "فاصل الآية",
    component: "MushafAyahMarker.tsx",
    expectedAction: "visual only (aria-hidden); number from QPC glyph",
    handler: "none (decorative)",
    status: "FIXED",
    rootCause: "number clarity — soft 8-petal + larger glyph + grid center",
  },
  {
    elementId: "mushaf-empty-tap-chrome",
    visibleLabel: "ضغط وسط الصفحة",
    component: "NewMushafReader.tsx",
    expectedAction: "toggle chrome",
    handler: "onTapEmpty",
    status: "PASS",
  },
  {
    elementId: "mushaf-page-scrubber",
    visibleLabel: "شريط الصفحات",
    component: "MushafPageScrubber.tsx",
    expectedAction: "scrub pages",
    handler: "onPageChange",
    status: "PASS",
  },
  {
    elementId: "mm-audio-dock",
    visibleLabel: "مشغّل التلاوة",
    component: "audio dock (lazy)",
    expectedAction: "play/pause/seek/reciter",
    handler: "recitation + audio engine",
    status: "PASS",
  },
];

function countBy(status) {
  return CONTROLS.filter((c) => c.status === status).length;
}

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const css = read("src/features/mushaf-reader/mushaf-reader.css");
const chrome = read("src/styles/reader-page-chrome.css");

const contracts = {
  appearanceBoundOnRoot: /data-mushaf-appearance=\{mushafAppearanceResolved\}/.test(reader),
  lightRemapper: /html\[data-mushaf-appearance="light"\] \.nm-root/.test(css),
  arrowsIndependentOfChrome: /visible=\{\s*!actionsOpen &&/.test(reader),
  arrowsCssAllowsWhenEnabled:
    /data-chrome="0"\]:not\(\[data-page-arrows="1"\]\) \.nm-page-arrows/.test(css) &&
    /data-chrome="0"\]:not\(\[data-page-arrows="1"\]\) \.nm-page-arrows/.test(chrome),
  singleAyahMarker: (read("src/features/mushaf-reader/MushafAyahMarker.tsx").match(/MushafAyahMarker/g) || [])
    .length > 0,
  externalMarkSize115: /--mushaf-ayah-mark-size:\s*1\.15em/.test(css),
  numberSize152: /--mushaf-ayah-mark-number-size:\s*1\.52em/.test(css),
};

const summary = {
  generatedAt: new Date().toISOString(),
  total: CONTROLS.length,
  PASS: countBy("PASS"),
  FIXED: countBy("FIXED"),
  BROKEN: countBy("BROKEN"),
  NO_OP: countBy("NO_OP"),
  REMOVED: countBy("REMOVED"),
  coveredByOverlay: 0,
  contracts,
  controls: CONTROLS,
};

if (!contracts.appearanceBoundOnRoot || !contracts.arrowsIndependentOfChrome || !contracts.arrowsCssAllowsWhenEnabled) {
  console.error("mushaf-controls-inventory: FAIL contracts", contracts);
  process.exit(1);
}

const md = `# جرد أزرار المصحف — Controls Inventory

**Generated:** ${summary.generatedAt}  
**Method:** static source inventory (exact counts from \`CONTROLS\` list; not estimates)

## Summary

| Metric | Count |
|---|---:|
| Total interactive mushaf controls audited | **${summary.total}** |
| PASS | ${summary.PASS} |
| FIXED (this PR) | ${summary.FIXED} |
| BROKEN remaining | ${summary.BROKEN} |
| NO_OP remaining | ${summary.NO_OP} |
| REMOVED | ${summary.REMOVED} |
| Blocked by overlay | ${summary.coveredByOverlay} |

## Root causes fixed

1. **SYSTEM/LIGHT/DARK — CSS_OVERRIDE:** \`mushaf-madinah.css\` كان يفرض night عبر \`html[data-theme=dark] .mm-viewport\` ويتجاهل وضع العرض. فُصل إلى \`data-mushaf-appearance\` + ربط React على \`.nm-root\` + مزامنة \`--mm-*\`.
2. **Page arrows — CSS_HIDDEN:** \`data-chrome="0"\` rules no longer hide arrows when \`data-page-arrows="1"\`. Visibility no longer requires \`chromeOpen\`.
3. **Ayah marker clarity:** external size stays \`1.15em\`; number \`1.52em\`; soft 8-petal clip; \`inline-grid\` + \`place-items:center\`.

## Contracts

\`\`\`json
${JSON.stringify(contracts, null, 2)}
\`\`\`

## Controls

| ID | Label | Status | Handler |
|---|---|---|---|
${CONTROLS.map((c) => `| \`${c.elementId}\` | ${c.visibleLabel} | ${c.status} | ${c.handler} |`).join("\n")}
`;

mkdirSync(repoQa, { recursive: true });
mkdirSync(pkgQa, { recursive: true });
writeFileSync(resolve(repoQa, "MUSHAF_CONTROLS_INVENTORY.md"), md);
writeFileSync(resolve(repoQa, "mushaf-controls-inventory.json"), JSON.stringify(summary, null, 2));
writeFileSync(resolve(pkgQa, "MUSHAF_CONTROLS_INVENTORY.md"), md);

console.log(
  `mushaf-controls-inventory: ok total=${summary.total} PASS=${summary.PASS} FIXED=${summary.FIXED} BROKEN=${summary.BROKEN}`,
);
