#!/usr/bin/env node
/**
 * كاشف أسماء بمقاطع مكررة — needs_review فقط، لا تصحيح آلي.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = resolve(appRoot, "scripts/lessons-seed.snapshot.json");

/** يكتشف تكرار مقطعين متتاليين متطابقين في الاسم. */
function hasRepeatedSegments(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < parts.length - 1; i++) {
    if (parts[i] === parts[i + 1]) return true;
  }
  const half = Math.floor(parts.length / 2);
  if (half >= 2 && parts.slice(0, half).join(" ") === parts.slice(half, half * 2).join(" ")) {
    return true;
  }
  return false;
}

const rows = JSON.parse(readFileSync(seedPath, "utf8"));
const warnings = [];

for (const row of rows) {
  const name = row.speaker_name || row.sheikhs?.name || "";
  if (name && hasRepeatedSegments(name)) {
    warnings.push({ id: row.id, name, note: "needs_review: مقاطع اسم مكررة محتملة" });
  }
}

if (warnings.length) {
  console.warn(`⚠ كاشف الأسماء: ${warnings.length} سجل(ات) للمراجعة (لا تصحيح آلي):`);
  warnings.slice(0, 20).forEach((w) => console.warn(`  - ${w.id}: «${w.name}»`));
} else {
  console.log("✓ كاشف الأسماء: لا مقاطع مكررة واضحة في seed الدروس");
}
