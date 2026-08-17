#!/usr/bin/env node
/**
 * يحذف ملفات .map بعد البناء — sourcemap:"hidden" ما زال يُصدرها، وPSI يُحاسب عليها.
 */
import { readdirSync, unlinkSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist", import.meta.url).pathname;
let n = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".map")) {
      unlinkSync(p);
      n++;
    }
  }
}
try {
  walk(dist);
  console.log(`strip-sourcemaps: removed ${n} .map files`);
} catch (e) {
  console.warn("strip-sourcemaps:", e.message);
  process.exit(0);
}
