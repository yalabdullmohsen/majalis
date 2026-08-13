/**
 * بوابة: CSS الحرج (index-*.css) ≤ 60 KiB gzip بعد البناء.
 * يُشغَّل بعد `pnpm build` عندما يوجد dist؛ وإلا يتخطّى بأمان.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const assets = resolve(root, "dist/assets");
const BUDGET = 60 * 1024;

if (!existsSync(assets)) {
  console.log("critical-css-gzip-gate.test.ts: skip (no dist/assets)");
  process.exit(0);
}

const cssFiles = readdirSync(assets).filter((f) => /^index-.*\.css$/.test(f));
assert.ok(cssFiles.length >= 1, "متوقع index-*.css في dist/assets");

let largest = { name: "", gz: 0, raw: 0 };
for (const name of cssFiles) {
  const buf = readFileSync(resolve(assets, name));
  const gz = gzipSync(buf, { level: 9 }).length;
  if (gz > largest.gz) largest = { name, gz, raw: buf.length };
}

assert.ok(
  largest.gz <= BUDGET,
  `CSS الحرج ${largest.name} gzip=${largest.gz} يتجاوز ${BUDGET} (هدف الإطلاق <60KiB)`,
);

console.log(
  `critical-css-gzip-gate.test.ts: ok (${largest.name} raw=${largest.raw} gz=${largest.gz} ≤ ${BUDGET})`,
);
