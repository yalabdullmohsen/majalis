#!/usr/bin/env node
/**
 * يتأكد أن src/data/content-counts.json مطابق تمامًا لما يُحسب فعليًا من السجلات الحية.
 * يفشل إذا كان الملف قديمًا (لم يُعَد توليده بعد تغيير في البيانات) أو حُرِّر يدويًا.
 *
 * التشغيل: node scripts/test-content-counts.mjs
 */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const countsPath = resolve(appRoot, "src/data/content-counts.json");

const before = await readFile(countsPath, "utf8");

execFileSync("npx", ["tsx", "scripts/generate-content-counts.ts"], {
  cwd: appRoot,
  stdio: "pipe",
});

const after = await readFile(countsPath, "utf8");

const stripGeneratedAt = (s) => JSON.parse(s);
const beforeData = stripGeneratedAt(before);
const afterData = stripGeneratedAt(after);
delete beforeData.generatedAt;
delete afterData.generatedAt;

if (JSON.stringify(beforeData) !== JSON.stringify(afterData)) {
  console.error("❌ src/data/content-counts.json غير مطابق للسجلات الحية. أعد التوليد: pnpm run generate:counts");
  console.error("قبل:", beforeData);
  console.error("بعد:", afterData);
  process.exit(1);
}

console.log("✓ أعداد المحتوى مطابقة للسجلات الحية:", afterData);
