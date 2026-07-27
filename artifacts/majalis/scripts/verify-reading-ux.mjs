#!/usr/bin/env node
/**
 * Verify reading UX components exist and export correctly.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function test(cond, msg) {
  if (cond) { passed++; console.log(`✓ ${msg}`); }
  else { failed++; console.error(`✗ ${msg}`); }
}

console.log("Reading UX verification\n");

test(existsSync(join(root, "src/components/reading/HighlightedContentCard.tsx")), "HighlightedContentCard exists");
test(existsSync(join(root, "src/components/reading/ContentActionBar.tsx")), "ContentActionBar exists");
test(existsSync(join(root, "src/lib/reading-progress.ts")), "reading-progress lib exists");
test(existsSync(join(root, "src/lib/tasbeeh-storage.ts")), "tasbeeh-storage lib exists");
test(existsSync(join(root, "src/styles/highlighted-content.css")), "highlighted-content.css exists");

const adhkar = readFileSync(join(root, "src/views/AdhkarPage.tsx"), "utf8");
// الواجهة الحالية: وضع التركيز (adhkar-page--focus) مع ذاكرة تمرير القراءة
// عبر useReadingScrollMemory — لا تخطيط v2 القديم ولا استيراد getReadingProgress المباشر.
test(/adhkar-page--focus/.test(adhkar), "AdhkarPage focus layout");
test(/useReadingScrollMemory\s*\(\s*["']adhkar["']\s*\)/.test(adhkar), "AdhkarPage reading progress memory");

const tasbih = readFileSync(join(root, "src/lib/tasbeeh-storage.ts"), "utf8");
test(tasbih.includes("TASBEEH_PRESETS"), "Tasbeeh presets defined");
test(tasbih.includes("syncTasbeehToAccount"), "Tasbeeh account sync");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
