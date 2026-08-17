#!/usr/bin/env node
/**
 * بوابة ثابتة: وجود لقطات اللوبيات الخمسة + أرقام القرآن (نهاري/ليلي).
 * التشغيل: node scripts/verify-more-hub-snapshots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [
  { dir: path.join(root, "tests/snapshots/more-hub"), needed: ["more-hub-light.png", "more-hub-dark.png"] },
  { dir: path.join(root, "tests/snapshots/quran-hub"), needed: ["quran-hub-light.png", "quran-hub-dark.png"] },
  {
    dir: path.join(root, "tests/snapshots/quran-numbers"),
    needed: ["quran-numbers-light.png", "quran-numbers-dark.png"],
  },
  {
    dir: path.join(root, "tests/snapshots/quran-tajweed"),
    needed: ["quran-tajweed-light.png", "quran-tajweed-dark.png"],
  },
  {
    dir: path.join(root, "tests/snapshots/quran-qiraat"),
    needed: ["quran-qiraat-light.png", "quran-qiraat-dark.png"],
  },
  {
    dir: path.join(root, "tests/snapshots/lessons-lobby"),
    needed: ["lessons-lobby-light.png", "lessons-lobby-dark.png"],
  },
  {
    dir: path.join(root, "tests/snapshots/prayer-lobby"),
    needed: ["prayer-lobby-light.png", "prayer-lobby-dark.png"],
  },
  {
    dir: path.join(root, "tests/snapshots/fiqh-lobby"),
    needed: ["fiqh-lobby-light.png", "fiqh-lobby-dark.png"],
  },
];

let failed = false;
for (const { dir, needed } of checks) {
  if (!fs.existsSync(dir)) {
    console.error(`verify-more-hub-snapshots: FAILED — مجلد مفقود: ${dir}`);
    failed = true;
    continue;
  }
  for (const name of needed) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) {
      console.error(`verify-more-hub-snapshots: FAILED — لقطة مفقودة: ${name}`);
      failed = true;
      continue;
    }
    const size = fs.statSync(file).size;
    if (size < 1000) {
      console.error(`verify-more-hub-snapshots: FAILED — لقطة تالفة: ${name} (${size} بايت)`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("verify-more-hub-snapshots: FAILED — شغّل UPDATE_SNAPSHOTS=1 pnpm run test:more-hub-visual-snapshot");
  process.exit(1);
}
console.log("verify-more-hub-snapshots: OK");
