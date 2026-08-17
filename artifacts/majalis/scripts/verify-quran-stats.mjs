#!/usr/bin/env node
/**
 * بوابة verify:quran-stats — استبدال بصمة stats.json.
 * تشغيل: node --import tsx scripts/verify-quran-stats.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (existsSync(resolve(root, "public/data/quran/stats.json"))) {
  console.error("فشل: public/data/quran/stats.json ما زال موجودًا");
  process.exit(1);
}
if (existsSync(resolve(root, "scripts/generate-quran-stats.mjs"))) {
  console.error("فشل: سكربت التوليد ما زال موجودًا");
  process.exit(1);
}

const r = spawnSync(
  process.execPath,
  ["--import", "tsx", "src/lib/__tests__/quran-stats-catalog.test.ts"],
  { cwd: root, stdio: "inherit" },
);
process.exit(r.status ?? 1);
