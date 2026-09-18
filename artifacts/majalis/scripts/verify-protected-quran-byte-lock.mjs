#!/usr/bin/env node
/**
 * Byte-for-byte lock for protected Quran-adjacent sources.
 * Read-only: fails if listed files diverge from PROTECTED_BYTE_LOCK.json.
 * Never edits Quran text / QPC / page order — verification only.
 *
 * Run: node scripts/verify-protected-quran-byte-lock.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = join(root, "public/data/quran/PROTECTED_BYTE_LOCK.json");

function sha256File(abs) {
  return createHash("sha256").update(readFileSync(abs)).digest("hex");
}

if (!existsSync(lockPath)) {
  console.error("✗ مفقود: public/data/quran/PROTECTED_BYTE_LOCK.json");
  process.exit(1);
}

const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const files = lock.files && typeof lock.files === "object" ? lock.files : null;
if (!files || Object.keys(files).length < 3) {
  console.error("✗ قفل بايت غير صالح — يلزم ≥3 ملفات محمية");
  process.exit(1);
}

const issues = [];
for (const [rel, meta] of Object.entries(files)) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    issues.push(`مفقود: ${rel}`);
    continue;
  }
  const actual = sha256File(abs);
  const expected = String(meta?.sha256 || "");
  if (!expected || actual !== expected) {
    issues.push(
      `${rel}: انحراف بايت (متوقع ${expected.slice(0, 12)}… فعلي ${actual.slice(0, 12)}…) — لا تُصلح آليًا؛ مراجعة بشرية`,
    );
  }
}

if (issues.length) {
  console.error("✗ فشل قفل بايت مصادر القرآن المحمية:");
  for (const m of issues) console.error(`  - ${m}`);
  process.exit(1);
}

console.log(`✓ قفل بايت القرآن: ${Object.keys(files).length} ملفًا مطابقًا Byte-for-Byte`);
