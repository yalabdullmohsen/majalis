/**
 * store-strip-unresolved-assets — delete store-forbidden assets from dist before cap sync.
 * - All adhan media under dist/{sounds,audio}/adhan (until OWNER allowlist)
 * - QPC V2 font packs under dist/fonts/qpc-v2 (BLOCKED_LICENSE until written OK)
 * Does not delete source files in public/ (web may still use them outside store RC).
 *
 * Usage: node scripts/store-strip-unresolved-assets.mjs
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "artifacts/majalis/dist");

if (!existsSync(dist)) {
  console.log("store-strip: no dist yet — skip");
  process.exit(0);
}

const mediaTargets = [join(dist, "sounds/adhan"), join(dist, "audio/adhan")];
const qpcDir = join(dist, "fonts/qpc-v2");
let removed = 0;

function wipeMedia(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      wipeMedia(p);
      continue;
    }
    if (/\.(mp3|m4a|caf|wav|ogg)$/i.test(name)) {
      rmSync(p, { force: true });
      removed += 1;
      console.log(`  removed ${relative(dist, p)}`);
    }
  }
}

for (const t of mediaTargets) wipeMedia(t);

if (existsSync(qpcDir)) {
  rmSync(qpcDir, { recursive: true, force: true });
  removed += 1;
  console.log(`  removed ${relative(dist, qpcDir)}/ (QPC fonts — BLOCKED_LICENSE until OWNER OK)`);
}

console.log(`store-strip: removed ${removed} store-forbidden path(s) from dist`);
