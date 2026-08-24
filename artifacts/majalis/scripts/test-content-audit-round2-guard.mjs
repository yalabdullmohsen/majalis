#!/usr/bin/env node
/**
 * حارس أوصاف SEO المقطوعة وحشو المؤسسات/اكتشف الإسلام (2026-08-25).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const violations = [];

const SEO_FILES = [
  "src/views/SahabahPage.tsx",
  "src/views/ProphetStoriesPage.tsx",
  "src/views/ArkanIslamPage.tsx",
  "src/views/RaqaiqPage.tsx",
  "src/views/MiraclesPage.tsx",
  "src/views/JannaNaarPage.tsx",
  "src/views/IslamicStoriesPage.tsx",
  "src/views/IslamicSectsPage.tsx",
  "src/views/UniversitiesPage.tsx",
  "src/views/ArbaeenLovePage.tsx",
  "src/views/InstitutionsPage.tsx",
];

const BANNED = [
  "محتوى معتمد في\"",
  "محتوى معتمد في منهج\"",
  "منهج مجالس\"",
  "— دليل عملي منظم",
  "يُستفاد منها في\"",
  "من أبرز المؤسسات الإسلامية في العالم",
  "موسوعة كبار الصحابة رضي الله عنهم؛ سيرتهم وفضائلهم وإرثهم في الإسلام؛ موسوعة",
  "لا إعجاز\"",
  "وأقوال\"",
];

for (const rel of SEO_FILES) {
  const src = readFileSync(path.join(ROOT, rel), "utf-8");
  for (const b of BANNED) {
    if (src.includes(b)) violations.push(`${rel}: «${b.slice(0, 50)}»`);
  }
}

const faq = JSON.parse(
  readFileSync(path.join(ROOT, "public/data/knowledge/discover-islam/path-and-faq.json"), "utf-8"),
);
for (const item of faq.items || []) {
  if ((item.body || "").includes("جواب موجز لحديث العهد")) {
    violations.push(`${item.id}: حشو FAQ قالبي`);
  }
}

if (violations.length) {
  console.error(`✗ حارس تدقيق المحتوى ج2: ${violations.length} مخالفة\n`);
  violations.slice(0, 40).forEach((v) => console.error("  • " + v));
  process.exit(1);
}
console.log(`✓ حارس تدقيق المحتوى ج2: ${SEO_FILES.length} ملفًا + FAQ بلا حشو/قطع.`);
