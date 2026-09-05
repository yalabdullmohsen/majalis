#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const view = readFileSync(resolve(root, "src/pages/hadith/ui/HadithView.tsx"), "utf8");
const norm = readFileSync(resolve(root, "src/lib/hadith/hadithNormalize.ts"), "utf8");
const warnings = readFileSync(resolve(root, "src/pages/hadith/ui/HadithView.tsx"), "utf8");

if (!/HadithGradeBadge|formatHadithGradeLabel|classifyHadithGrade/.test(view + norm)) {
  console.error("verify-hadith-grades-gate: missing grade display helpers");
  process.exit(1);
}
if (!/تخريج|الاستشهاد|الحكم/.test(warnings + norm)) {
  console.error("verify-hadith-grades-gate: missing citation caution language");
  process.exit(1);
}
console.log("verify-hadith-grades-gate: ok");
