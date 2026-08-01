#!/usr/bin/env node
/**
 * يربط node_modules/.bin/cap → scripts/cap-shim.mjs بعد كل pnpm install.
 * حزمة الجذر private وقد لا يُنشئ pnpm bin لها تلقائيًا.
 */
import { existsSync, lstatSync, mkdirSync, readlinkSync, symlinkSync, unlinkSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const binDir = resolve(root, "node_modules", ".bin");
const linkPath = resolve(binDir, "cap");
const targetPath = resolve(root, "scripts", "cap-shim.mjs");

if (!existsSync(targetPath)) {
  console.error(`ensure-cap-bin: missing ${targetPath}`);
  process.exit(1);
}

mkdirSync(binDir, { recursive: true });
const rel = relative(binDir, targetPath);

function isCorrectLink() {
  try {
    if (!lstatSync(linkPath).isSymbolicLink()) return false;
    return resolve(binDir, readlinkSync(linkPath)) === targetPath;
  } catch {
    return false;
  }
}

if (!isCorrectLink()) {
  try {
    unlinkSync(linkPath);
  } catch {
    /* missing */
  }
  symlinkSync(rel, linkPath);
}

console.log(`ensure-cap-bin: ${linkPath} → ${rel}`);
