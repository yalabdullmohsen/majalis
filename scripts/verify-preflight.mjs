#!/usr/bin/env node
/**
 * verify:preflight — فحوص سريعة حتمية قبل `verify:ci`.
 *
 * يوحّد: changed-scope + حوكمة الوكيل + path-lane unit + aggregator unit.
 * لا يُضعف البوابات ولا يستبدل verify:ci.
 *
 *   pnpm run verify:preflight
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeVerifyFingerprint,
  readVerifyCache,
  writeVerifyCache,
} from "./verify-fingerprint.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(label, cmd, args) {
  console.log(`\n── preflight: ${label} ──`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`\nverify:preflight فشل عند: ${label}`);
    process.exit(r.status ?? 1);
  }
}

if (!existsSync(resolve(ROOT, "package.json")) || !existsSync(resolve(ROOT, "pnpm-workspace.yaml"))) {
  console.error("verify:preflight: شغّل من جذر monorepo فقط.");
  process.exit(2);
}

const force = process.argv.includes("--force");
const cached = readVerifyCache("preflight");
if (!force && cached.hit) {
  console.log(
    `\n✓ verify:preflight — إعادة استخدام نتيجة سابقة (fingerprint ${cached.fingerprint.slice(0, 12)}…)`,
  );
  console.log("  المدخلات لم تتغير. استخدم --force لإعادة التشغيل.\n");
  process.exit(0);
}

const t0 = Date.now();
console.log(`verify:preflight · fp=${computeVerifyFingerprint().slice(0, 12)}…`);

run("changed-scope policy", process.execPath, ["scripts/verify-changed-scope.mjs"]);
run(
  "agent-throughput governance",
  process.execPath,
  ["--test", "scripts/__tests__/agent-throughput-policy.test.mjs"],
);
run(
  "path-lane matrix",
  process.execPath,
  ["--test", ".github/scripts/safe-auto-merge/__tests__/path-classifier.test.mjs"],
);
run(
  "aggregator contract",
  process.execPath,
  ["--test", ".github/scripts/ci/__tests__/aggregate-required.test.mjs"],
);
run(
  "dist artifact identity",
  process.execPath,
  ["--test", ".github/scripts/ci/__tests__/dist-artifact-identity.test.mjs"],
);

const seconds = Number(((Date.now() - t0) / 1000).toFixed(1));
writeVerifyCache("preflight", { seconds, note: "verify:preflight" });
console.log(
  `\n✓ verify:preflight نجحت في ${seconds}s — مسموح بـ pnpm run verify:ci مرة واحدة بعد IMPLEMENTATION_FROZEN.\n`,
);
