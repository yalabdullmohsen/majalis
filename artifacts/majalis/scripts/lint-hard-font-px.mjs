#!/usr/bin/env node
/** يمنع عودة text-[Npx] أو fontSize: Npx تحت 13 في JSX/TSX الجديدة (خارج المصحف). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const SKIP = /features[\\/]mushaf/;
const bad = [];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

for (const f of walk(SRC)) {
  if (SKIP.test(f)) continue;
  const rel = path.relative(ROOT, f);
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/text-\[(\d+)px\]/g)) {
    if (parseInt(m[1], 10) < 13) bad.push(`${rel}: ${m[0]}`);
  }
  for (const m of s.matchAll(/fontSize:\s*['"]?(\d+)px/g)) {
    if (parseInt(m[1], 10) < 13) bad.push(`${rel}: fontSize ${m[1]}px`);
  }
}

if (bad.length) {
  console.error("✗ lint:hard-font-px —", bad.length);
  for (const b of bad.slice(0, 30)) console.error(" ", b);
  process.exit(1);
}
console.log("✓ lint:hard-font-px — نظيف");
