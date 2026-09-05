#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const BAD = /Majlisilm|majlisilm|المجلس العلمي/u;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

let files;
try {
  files = walk(dist);
} catch {
  console.error("verify-no-legacy-brand-html: dist/ missing — run build first");
  process.exit(1);
}

const hits = [];
for (const f of files) {
  const t = readFileSync(f, "utf8");
  if (BAD.test(t)) hits.push(f.replace(root + "/", ""));
}

if (hits.length) {
  console.error("verify-no-legacy-brand-html: FAIL");
  for (const h of hits.slice(0, 20)) console.error(" -", h);
  process.exit(1);
}
console.log(`verify-no-legacy-brand-html: ok (${files.length} html)`);
