/**
 * بوابة ١ — سلامة الحروف (حرفًا حرفًا) في جميع كوربوسات الأقسام.
 * ترفض: PUA، U+FFFD، محارف تحكم، وأنماط تلف ترميز معروفة.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-char-integrity-gate.test.ts
 */
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findCharIssues,
  findMojibake,
  walkCorpusFiles,
} from "../content-audit/walk-corpora";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const files = walkCorpusFiles(appRoot);
assert.ok(files.length >= 500, `يُتوقَّع ≥500 ملف محتوى (الآن ${files.length})`);

let scannedChars = 0;
const failures: string[] = [];

for (const file of files) {
  scannedChars += file.text.length;
  const issues = findCharIssues(file.text);
  if (issues.pua > 0) {
    failures.push(`${file.rel}: PUA×${issues.pua} ${issues.samples.join(" · ")}`);
  }
  if (issues.replacement > 0) {
    failures.push(
      `${file.rel}: U+FFFD×${issues.replacement} ${issues.samples.slice(0, 3).join(" · ")}`,
    );
  }
  if (issues.control > 0) {
    failures.push(`${file.rel}: CTRL×${issues.control} ${issues.samples.join(" · ")}`);
  }
  const mojibake = findMojibake(file.text);
  if (mojibake.length) {
    failures.push(`${file.rel}: تلف ترميز [${mojibake.join(", ")}]`);
  }
}

if (failures.length) {
  console.error("\nفشل بوابة سلامة الحروف:");
  for (const f of failures.slice(0, 40)) console.error(`  ✗ ${f}`);
  if (failures.length > 40) console.error(`  … و${failures.length - 40} أخرى`);
  process.exit(1);
}

console.log(
  `content-audit-char-integrity-gate: ok — ${files.length} ملفًا · ${scannedChars.toLocaleString("en-US")} حرفًا`,
);
