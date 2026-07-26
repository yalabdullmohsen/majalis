#!/usr/bin/env node
/**
 * يمنع import * من lucide-react — يسحب المكتبة كاملة إلى الحزمة المشتركة.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..", "src");
const RE = /import\s*\*\s*as\s+\w+\s+from\s*["']lucide-react["']/;
const offenders = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(name)) {
      const src = readFileSync(p, "utf8");
      if (RE.test(src)) offenders.push(relative(root, p));
    }
  }
}

walk(root);

if (offenders.length) {
  console.error("✗ ممنوع import * من lucide-react:\n" + offenders.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("✓ لا يوجد import * من lucide-react.");
