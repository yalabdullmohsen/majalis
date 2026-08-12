#!/usr/bin/env node
/**
 * بوابة R4-3: لا تكرار «ذات صلة» يطابق شريط القسم في الحديث/الأذكار.
 */
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const issues = [];

const adhkar = readFileSync(join(appRoot, "src/pages/worship/ui/AdhkarView.tsx"), "utf8");
if (/RelatedKnowledge/.test(adhkar)) {
  issues.push("AdhkarPage: RelatedKnowledge يكرّر أقسام الصفحة — أُزل");
}

const hadith = readFileSync(join(appRoot, "src/pages/hadith/ui/HadithView.tsx"), "utf8");
if (/RelatedKnowledge/.test(hadith)) {
  issues.push("HadithPage: RelatedKnowledge يكرّر سياق الحديث — أُزل");
}
if (/ExploreAlsoNav[\s\S]{0,400}\/hadith\/books/.test(hadith)) {
  issues.push("HadithPage: ExploreAlsoNav يكرّر رابط الكتب الظاهرة في الشريط/البانر");
}

if (issues.length) {
  console.error("❌ بوابة إزالة التكرار فشلت:\n");
  issues.forEach((i) => console.error(`  - ${i}`));
  process.exit(1);
}
console.log("✓ بوابة إزالة التكرار: حديث/أذكار بلا كتل ذات صلة مكررة");
