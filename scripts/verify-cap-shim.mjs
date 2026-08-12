#!/usr/bin/env node
/**
 * يضمن أن `npx cap` / `pnpm exec cap` من جذر المستودع لا يحلّ حزمة npm الخاطئة.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

console.log("=== verify cap-shim (root npx cap) ===\n");

ok(pkg.bin?.cap === "./scripts/cap-shim.mjs", 'package.json bin.cap → ./scripts/cap-shim.mjs');
ok(existsSync(resolve(root, "scripts/cap-shim.mjs")), "scripts/cap-shim.mjs exists");

// لا أوامر exec فارغة في سكربتات الجذر
for (const [name, cmd] of Object.entries(pkg.scripts || {})) {
  ok(
    !/(?:^|[;&|]|&&|\|\|)\s*(?:npx|npm\s+exec|pnpm\s+exec)\s*(?:$|[;&|])/.test(cmd),
    `root script ${name}: no bare npx/npm exec/pnpm exec`,
  );
}

const majalisPkg = JSON.parse(readFileSync(resolve(root, "artifacts/majalis/package.json"), "utf8"));
for (const name of ["mobile:sync", "mobile:android", "mobile:ios"]) {
  const cmd = majalisPkg.scripts?.[name] || "";
  ok(!/\bnpx\b/.test(cmd), `majalis ${name}: no npx`);
  ok(!/\bnpm\s+exec\b/.test(cmd), `majalis ${name}: no npm exec`);
}

const prepare = readFileSync(resolve(root, "artifacts/majalis/scripts/prepare-ios.sh"), "utf8")
  .split("\n")
  .filter((l) => !/^\s*#/.test(l))
  .join("\n");
ok(!/\bnpx\b/.test(prepare), "prepare-ios.sh code: no npx");
ok(/node_modules\/\.bin\/cap/.test(prepare), "prepare-ios.sh uses local .bin/cap");

const linked = resolve(root, "node_modules/.bin/cap");
ok(existsSync(linked), "node_modules/.bin/cap linked after install");

if (existsSync(linked)) {
  const ver = spawnSync(linked, ["--version"], { encoding: "utf8", cwd: root });
  ok(ver.status === 0 && /^\d+\.\d+/.test((ver.stdout || "").trim()), `cap --version → ${(ver.stdout || "").trim()}`);
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\ncap-shim OK — npx cap sync ios يعمل من جذر المستودع.");
