#!/usr/bin/env node
/**
 * Content Ops P0 gate — must pass before any auto-publish work (P1+).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isAutoPublishEnabled,
  loadSafeChangePolicy,
  listProtectedEntities,
  listSources,
  evaluateChange,
  BRAND,
  SYSTEM_NAME,
} from "../../lib/content-ops/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

function fail(msg) {
  console.error(`✗ Content Ops P0: ${msg}`);
  process.exit(1);
}

console.log(`→ ${SYSTEM_NAME} — بوابة P0 (${BRAND})`);

if (BRAND !== "سُنّة") fail("هوية العلامة يجب أن تكون سُنّة");

const policy = loadSafeChangePolicy();
if (policy.autoPublishEnabled === true) {
  fail("autoPublishEnabled يجب أن يبقى false في P0");
}
if (isAutoPublishEnabled()) {
  fail("isAutoPublishEnabled() يجب أن يعيد false");
}

const entities = listProtectedEntities();
if (entities.length < 5) fail("Protected Content Registry ناقص");

const sources = listSources();
if (sources.length < 1) fail("Source Registry فارغ");

const c = evaluateChange({
  changeKind: "quran_text",
  path: "public/data/quran/surah-001.json",
});
if (c.decision !== "reject" || c.publish !== false) {
  fail("محاولة تعديل قرآن لم تُرفض");
}

const a = evaluateChange({
  changeKind: "trim_whitespace",
  highConfidence: true,
  reversible: true,
});
if (a.publish === true) {
  fail("مستوى A نُشر رغم تعطيل Auto-Publish");
}

const testFile = join(__dirname, "test-content-ops-p0.mjs");
const r = spawnSync(process.execPath, ["--test", testFile], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env },
});
process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");
if (r.status !== 0) fail("اختبارات P0 فشلت");

console.log("✓ Content Ops P0 gate passed — النشر التلقائي ما زال معطّلاً");
process.exit(0);
