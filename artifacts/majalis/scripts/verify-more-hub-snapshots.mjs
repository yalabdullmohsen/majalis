#!/usr/bin/env node
/**
 * بوابة ثابتة: وجود لقطات المزيد المرجعية (نهاري/ليلي).
 * التشغيل: node scripts/verify-more-hub-snapshots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "tests/snapshots/more-hub");
const needed = ["more-hub-light.png", "more-hub-dark.png"];

if (!fs.existsSync(dir)) {
  console.error("verify-more-hub-snapshots: FAILED — مجلد اللقطات مفقود");
  process.exit(1);
}

let ok = true;
for (const name of needed) {
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) {
    console.error(`  ✗ مفقود: ${name}`);
    ok = false;
    continue;
  }
  const size = fs.statSync(file).size;
  if (size < 1000) {
    console.error(`  ✗ تالف/فارغ: ${name} (${size} بايت)`);
    ok = false;
    continue;
  }
  console.log(`  · ${name}: ${size} بايت`);
}

if (!ok) {
  console.error("verify-more-hub-snapshots: FAILED — شغّل UPDATE_SNAPSHOTS=1 pnpm run test:more-hub-visual-snapshot");
  process.exit(1);
}

console.log("verify-more-hub-snapshots: OK");
